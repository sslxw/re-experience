const { randomUUID } = require('crypto');
const { readJson, writeJson } = require('./store');

function attachCommentRoutes(app) {
    app.get('/api/posts/:id/comments', (req, res) => {
        const { comments } = readJson('comments.json', { comments: [] });
        const list = comments
            .filter((c) => c.postId === req.params.id)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map(({ email, ...safe }) => safe);
        res.json({ comments: list });
    });

    app.post('/api/posts/:id/comments', (req, res) => {
        try {
            const { posts } = readJson('posts.json', { posts: [] });
            const post = posts.find((p) => p.id === req.params.id && p.published);
            if (!post) {
                return res.status(404).json({ error: 'Post not found.' });
            }

            const name = String(req.body?.name || '').trim();
            const email = String(req.body?.email || '').trim().toLowerCase();
            const body = String(req.body?.body || '').trim();

            if (!name || name.length > 80) {
                return res.status(400).json({ error: 'Name required.' });
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: 'Valid email required.' });
            }
            if (!body || body.length > 2000) {
                return res.status(400).json({ error: 'Comment required (max 2000).' });
            }

            const comment = {
                id: randomUUID(),
                postId: req.params.id,
                name,
                email,
                body,
                createdAt: new Date().toISOString(),
            };

            const store = readJson('comments.json', { comments: [] });
            store.comments.push(comment);
            writeJson('comments.json', store);

            const { email: _e, ...safe } = comment;
            res.status(201).json({ comment: safe });
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
}

module.exports = { attachCommentRoutes };
