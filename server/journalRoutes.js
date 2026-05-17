const { readJson, writeJson } = require('./store');
const { requireAuth } = require('./middleware');
const {
    JOURNAL_QUESTIONS,
    JOURNAL_QUESTION_COUNT,
    checkAnswer,
} = require('./journalGameData');

const EMPTY_PROGRESS = { solved: [], won: false };

function readProgressStore() {
    return readJson('journalProgress.json', { byUser: {} });
}

function getUserProgress(userId) {
    const store = readProgressStore();
    const raw = store.byUser[userId];
    if (!raw) return { ...EMPTY_PROGRESS };
    return {
        solved: Array.isArray(raw.solved) ? [...raw.solved] : [],
        won: Boolean(raw.won),
        wonAt: raw.wonAt,
    };
}

function saveUserProgress(userId, progress) {
    const store = readProgressStore();
    store.byUser[userId] = progress;
    writeJson('journalProgress.json', store);
}

function attachJournalRoutes(app) {
    app.get('/api/journal/progress', requireAuth, (req, res) => {
        res.json({ progress: getUserProgress(req.user.id) });
    });

    app.post('/api/journal/submit', requireAuth, (req, res) => {
        try {
            const questionId = String(req.body?.questionId || '');
            const answer = String(req.body?.answer ?? '');

            const question = JOURNAL_QUESTIONS.find((q) => q.id === questionId);
            if (!question) {
                return res.status(400).json({ error: 'Unknown journal entry.' });
            }

            const progress = getUserProgress(req.user.id);
            if (progress.solved.includes(questionId)) {
                return res.json({ correct: false, progress, alreadySolved: true });
            }

            if (!checkAnswer(questionId, answer)) {
                return res.json({ correct: false, progress });
            }

            const solved = [...progress.solved, questionId];
            const won = solved.length >= JOURNAL_QUESTION_COUNT;
            const next = {
                solved,
                won,
                wonAt: won
                    ? progress.wonAt || new Date().toISOString()
                    : progress.wonAt,
            };
            saveUserProgress(req.user.id, next);
            res.json({ correct: true, progress: next });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Could not log intel.' });
        }
    });

    app.post('/api/journal/reset', requireAuth, (req, res) => {
        const fresh = { ...EMPTY_PROGRESS };
        saveUserProgress(req.user.id, fresh);
        res.json({ progress: fresh });
    });
}

module.exports = { attachJournalRoutes };
