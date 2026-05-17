const path = require('path');
const { UPLOADS_DIR, ensureDirs } = require('./store');
const { seedIfEmpty } = require('./seed');
const { attachAuthRoutes } = require('./authRoutes');
const { attachUserRoutes } = require('./userRoutes');
const { attachPostRoutes } = require('./postRoutes');
const { attachCommentRoutes } = require('./commentRoutes');
const { attachJournalRoutes } = require('./journalRoutes');

function attachBlogRoutes(app) {
    ensureDirs();
    seedIfEmpty();

    app.use('/uploads', require('express').static(UPLOADS_DIR));

    attachAuthRoutes(app);
    attachUserRoutes(app);
    attachPostRoutes(app);
    attachCommentRoutes(app);
    attachJournalRoutes(app);

    // Legacy route redirect
    app.get('/api/blog/posts', (_req, res) => {
        res.redirect(307, '/api/posts?limit=50');
    });
}

module.exports = { attachBlogRoutes };
