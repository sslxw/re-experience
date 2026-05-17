const {
    randomUUID,
    scryptSync,
    randomBytes,
    timingSafeEqual,
} = require('crypto');
const { readJson, writeJson } = require('./store');
const { getSessionUser } = require('./middleware');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isProduction() {
    return (
        process.env.NODE_ENV === 'production' ||
        process.env.RENDER === 'true'
    );
}

function sessionCookieFlags() {
    const secure = isProduction() ? '; Secure' : '';
    return `Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function setSessionCookie(res, sessionId) {
    res.setHeader(
        'Set-Cookie',
        `umbrella_session=${sessionId}; ${sessionCookieFlags()}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
    );
}

function clearSessionCookie(res) {
    res.setHeader(
        'Set-Cookie',
        `umbrella_session=; ${sessionCookieFlags()}; Max-Age=0`
    );
}

function hashPassword(password) {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    const candidate = scryptSync(password, salt, 64);
    return timingSafeEqual(hash, candidate);
}

function createSession(res, userId) {
    const sessionId = randomUUID();
    const sessions = readJson('sessions.json', { sessions: {} });
    sessions.sessions[sessionId] = {
        userId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
    writeJson('sessions.json', sessions);
    setSessionCookie(res, sessionId);
}

function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboarded: user.onboarded,
    };
}

function attachAuthRoutes(app) {
    app.get('/api/auth/me', (req, res) => {
        const user = getSessionUser(req);
        if (!user) return res.json({ user: null });
        res.json({ user: publicUser(user) });
    });

    app.post('/api/auth/register', (req, res) => {
        try {
            const email = String(req.body?.email || '')
                .trim()
                .toLowerCase();
            const password = String(req.body?.password || '');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: 'Valid email required.' });
            }
            if (password.length < 6) {
                return res
                    .status(400)
                    .json({ error: 'Password must be at least 6 characters.' });
            }

            const usersStore = readJson('users.json', { users: [] });
            if (usersStore.users.some((u) => u.email === email)) {
                return res.status(409).json({ error: 'Account already exists.' });
            }

            const user = {
                id: randomUUID(),
                email,
                passwordHash: hashPassword(password),
                name: email.split('@')[0],
                avatarUrl: null,
                onboarded: false,
                createdAt: new Date().toISOString(),
            };
            usersStore.users.push(user);
            writeJson('users.json', usersStore);

            createSession(res, user.id);
            res.status(201).json({ user: publicUser(user) });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Registration failed.' });
        }
    });

    app.post('/api/auth/login', (req, res) => {
        try {
            const email = String(req.body?.email || '')
                .trim()
                .toLowerCase();
            const password = String(req.body?.password || '');

            const usersStore = readJson('users.json', { users: [] });
            const user = usersStore.users.find((u) => u.email === email);

            if (!user || !user.passwordHash) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }
            if (!verifyPassword(password, user.passwordHash)) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }

            createSession(res, user.id);
            res.json({ user: publicUser(user) });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Login failed.' });
        }
    });

    app.post('/api/auth/logout', (req, res) => {
        const sessionId = req.headers.cookie
            ?.split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith('umbrella_session='))
            ?.split('=')[1];

        if (sessionId) {
            const sessions = readJson('sessions.json', { sessions: {} });
            delete sessions.sessions[sessionId];
            writeJson('sessions.json', sessions);
        }
        clearSessionCookie(res);
        res.json({ message: 'Session terminated.' });
    });
}

module.exports = { attachAuthRoutes };
