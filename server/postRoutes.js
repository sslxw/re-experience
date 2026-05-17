const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');
const { readJson, writeJson, UPLOADS_DIR } = require('./store');
const { requireAuth, optionalAuth } = require('./middleware');

const coverUpload = multer({
    storage: multer.diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname) || '.jpg';
            cb(null, `cover-${randomUUID()}${ext}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Image files only.'));
        }
        cb(null, true);
    },
});

function stripHtml(html) {
    return String(html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function enrichPost(post, users) {
    const author = users.find((u) => u.id === post.authorId);
    return {
        ...post,
        author: author
            ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl }
            : { id: post.authorId, name: 'Unknown Agent', avatarUrl: null },
    };
}

function attachPostRoutes(app) {
    app.get('/api/posts/meta', (_req, res) => {
        const { posts } = readJson('posts.json', { posts: [] });
        const published = posts.filter((p) => p.published);
        const defaultCategories = [
            'General',
            'Incidents',
            'Research',
            'Field Reports',
            'RPD',
            'Umbrella',
            'Bioweapons',
        ];
        const categories = [
            ...new Set([
                ...defaultCategories,
                ...published.map((p) => p.category).filter(Boolean),
            ]),
        ];
        const tags = [
            ...new Set(published.flatMap((p) => p.tags || []).filter(Boolean)),
        ];
        res.json({ categories, tags });
    });

    app.get('/api/posts/manage/mine', requireAuth, (req, res) => {
        const { posts } = readJson('posts.json', { posts: [] });
        const { users } = readJson('users.json', { users: [] });
        const mine = posts
            .filter((p) => p.authorId === req.user.id)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .map((p) => enrichPost(p, users));
        res.json({ posts: mine });
    });

    app.get('/api/posts', optionalAuth, (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(
                20,
                Math.max(1, parseInt(req.query.limit, 10) || 6)
            );
            const q = String(req.query.q || '')
                .trim()
                .toLowerCase();
            const category = String(req.query.category || '').trim();
            const tag = String(req.query.tag || '').trim();
            const featured = req.query.featured === 'true';

            const { posts } = readJson('posts.json', { posts: [] });
            const { users } = readJson('users.json', { users: [] });

            let filtered = posts.filter((p) => {
                if (!req.user && !p.published) return false;
                if (req.user && req.user.id !== p.authorId && !p.published) {
                    return false;
                }
                return true;
            });

            if (featured) filtered = filtered.filter((p) => p.featured);
            if (category) filtered = filtered.filter((p) => p.category === category);
            if (tag) filtered = filtered.filter((p) => (p.tags || []).includes(tag));
            if (q) {
                filtered = filtered.filter((p) => {
                    const hay = `${p.title} ${p.excerpt} ${stripHtml(p.bodyHtml)} ${(p.tags || []).join(' ')}`.toLowerCase();
                    return hay.includes(q);
                });
            }

            filtered.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            const total = filtered.length;
            const start = (page - 1) * limit;
            const slice = filtered.slice(start, start + limit);

            res.json({
                posts: slice.map((p) => enrichPost(p, users)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                },
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to load posts.' });
        }
    });

    app.get('/api/posts/:id', optionalAuth, (req, res) => {
        const { posts } = readJson('posts.json', { posts: [] });
        const { users } = readJson('users.json', { users: [] });
        const post = posts.find((p) => p.id === req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found.' });
        if (!post.published && (!req.user || req.user.id !== post.authorId)) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        res.json({ post: enrichPost(post, users) });
    });

    app.post(
        '/api/posts',
        requireAuth,
        coverUpload.single('cover'),
        (req, res) => {
            try {
                if (!req.user.onboarded) {
                    return res.status(403).json({ error: 'Complete onboarding first.' });
                }

                const title = String(req.body?.title || '').trim();
                const bodyHtml = String(req.body?.bodyHtml || '').trim();
                const excerpt =
                    String(req.body?.excerpt || '').trim() ||
                    stripHtml(bodyHtml).slice(0, 160);
                const category = String(req.body?.category || 'General').trim();
                const tags = String(req.body?.tags || '')
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(0, 8);
                const featured = req.body?.featured === 'true';
                const published = req.body?.published !== 'false';

                if (!title || title.length > 160) {
                    return res.status(400).json({ error: 'Title required (max 160).' });
                }
                if (!bodyHtml || stripHtml(bodyHtml).length < 20) {
                    return res
                        .status(400)
                        .json({ error: 'Post body must be at least 20 characters.' });
                }

                const now = new Date().toISOString();
                const post = {
                    id: randomUUID(),
                    authorId: req.user.id,
                    title,
                    excerpt,
                    bodyHtml,
                    coverImageUrl: req.file
                        ? `/uploads/${req.file.filename}`
                        : req.body?.coverImageUrl || null,
                    category: category || 'General',
                    tags,
                    featured,
                    published,
                    createdAt: now,
                    updatedAt: now,
                };

                const store = readJson('posts.json', { posts: [] });
                store.posts.unshift(post);
                writeJson('posts.json', store);

                const { users } = readJson('users.json', { users: [] });
                res.status(201).json({ post: enrichPost(post, users) });
            } catch (e) {
                res.status(400).json({ error: e.message || 'Create failed.' });
            }
        }
    );

    app.patch(
        '/api/posts/:id',
        requireAuth,
        coverUpload.single('cover'),
        (req, res) => {
            try {
                const store = readJson('posts.json', { posts: [] });
                const idx = store.posts.findIndex((p) => p.id === req.params.id);
                if (idx === -1) {
                    return res.status(404).json({ error: 'Post not found.' });
                }
                if (store.posts[idx].authorId !== req.user.id) {
                    return res.status(403).json({ error: 'Not your post.' });
                }

                const p = store.posts[idx];
                if (req.body?.title !== undefined) {
                    p.title = String(req.body.title).trim();
                }
                if (req.body?.bodyHtml !== undefined) {
                    p.bodyHtml = String(req.body.bodyHtml).trim();
                }
                if (req.body?.excerpt !== undefined) {
                    p.excerpt = String(req.body.excerpt).trim();
                }
                if (req.body?.category !== undefined) {
                    p.category = String(req.body.category).trim();
                }
                if (req.body?.tags !== undefined) {
                    p.tags = String(req.body.tags)
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 8);
                }
                if (req.body?.featured !== undefined) {
                    p.featured = req.body.featured === 'true';
                }
                if (req.body?.published !== undefined) {
                    p.published = req.body.published !== 'false';
                }
                if (req.file) {
                    p.coverImageUrl = `/uploads/${req.file.filename}`;
                }
                p.updatedAt = new Date().toISOString();
                writeJson('posts.json', store);

                const { users } = readJson('users.json', { users: [] });
                res.json({ post: enrichPost(p, users) });
            } catch (e) {
                res.status(400).json({ error: e.message });
            }
        }
    );

    app.delete('/api/posts/:id', requireAuth, (req, res) => {
        const store = readJson('posts.json', { posts: [] });
        const idx = store.posts.findIndex((p) => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Post not found.' });
        if (store.posts[idx].authorId !== req.user.id) {
            return res.status(403).json({ error: 'Not your post.' });
        }
        store.posts.splice(idx, 1);
        writeJson('posts.json', store);
        res.json({ message: 'Deleted.' });
    });
}

module.exports = { attachPostRoutes };
