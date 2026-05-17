const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');
const { readJson, writeJson, UPLOADS_DIR } = require('./store');
const { requireAuth } = require('./middleware');

function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboarded: user.onboarded,
    };
}

const avatarUpload = multer({
    storage: multer.diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname) || '.jpg';
            cb(null, `avatar-${randomUUID()}${ext}`);
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Image files only.'));
        }
        cb(null, true);
    },
});

function attachUserRoutes(app) {
    app.post(
        '/api/users/onboard',
        requireAuth,
        avatarUpload.single('avatar'),
        (req, res) => {
            try {
                const name = String(req.body?.name || '').trim();
                if (!name || name.length > 80) {
                    return res
                        .status(400)
                        .json({ error: 'Display name required (max 80 chars).' });
                }

                const users = readJson('users.json', { users: [] });
                const idx = users.users.findIndex((u) => u.id === req.user.id);
                if (idx === -1) {
                    return res.status(404).json({ error: 'User not found.' });
                }

                users.users[idx].name = name;
                users.users[idx].onboarded = true;
                if (req.file) {
                    users.users[idx].avatarUrl = `/uploads/${req.file.filename}`;
                }
                writeJson('users.json', users);

                res.json({ user: publicUser(users.users[idx]) });
            } catch (e) {
                res.status(400).json({ error: e.message || 'Onboarding failed.' });
            }
        }
    );

    app.post(
        '/api/users/avatar',
        requireAuth,
        avatarUpload.single('avatar'),
        (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'Avatar image required.' });
                }
                const users = readJson('users.json', { users: [] });
                const idx = users.users.findIndex((u) => u.id === req.user.id);
                if (idx === -1) {
                    return res.status(404).json({ error: 'User not found.' });
                }
                users.users[idx].avatarUrl = `/uploads/${req.file.filename}`;
                writeJson('users.json', users);
                res.json({ user: publicUser(users.users[idx]) });
            } catch (e) {
                res.status(400).json({ error: e.message || 'Upload failed.' });
            }
        }
    );

    app.patch('/api/users/me', requireAuth, (req, res) => {
        try {
            const name = req.body?.name
                ? String(req.body.name).trim()
                : undefined;
            const users = readJson('users.json', { users: [] });
            const idx = users.users.findIndex((u) => u.id === req.user.id);
            if (idx === -1) return res.status(404).json({ error: 'User not found.' });

            if (name !== undefined) {
                if (!name) {
                    return res.status(400).json({ error: 'Name cannot be empty.' });
                }
                users.users[idx].name = name;
            }
            writeJson('users.json', users);
            res.json({ user: publicUser(users.users[idx]) });
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
}

module.exports = { attachUserRoutes };
