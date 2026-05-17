const { readJson } = require('./store');

function getSessionUser(req) {
    const sessionId = req.headers.cookie
        ?.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('umbrella_session='))
        ?.split('=')[1];

    if (!sessionId) return null;

    const { sessions } = readJson('sessions.json', { sessions: {} });
    const session = sessions[sessionId];
    if (!session || new Date(session.expiresAt) < new Date()) return null;

    const { users } = readJson('users.json', { users: [] });
    return users.find((u) => u.id === session.userId) || null;
}

function requireAuth(req, res, next) {
    const user = getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    req.user = user;
    next();
}

function optionalAuth(req, _res, next) {
    req.user = getSessionUser(req);
    next();
}

module.exports = { getSessionUser, requireAuth, optionalAuth };
