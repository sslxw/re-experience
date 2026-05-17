const JOURNAL_QUESTIONS = [
    {
        id: 'q-virus',
        answers: ['tvirus', 't-virus', 't virus'],
    },
    {
        id: 'q-bravo',
        answers: ['2200', '22:00', '10pm', '10:00pm'],
    },
    {
        id: 'q-barry',
        answers: ['barry', 'barryb', 'barry b'],
    },
    {
        id: 'q-barricade',
        answers: ['0314', '03:14', '3:14am', '314'],
    },
    {
        id: 'q-nest',
        answers: ['nest'],
    },
    {
        id: 'q-clearance',
        answers: ['s7734', 's-7734'],
    },
    {
        id: 'q-room',
        answers: ['254', 'room254', 'room 254'],
    },
];

function normalizeAnswer(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function checkAnswer(questionId, raw) {
    const question = JOURNAL_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return false;
    const normalized = normalizeAnswer(raw);
    if (!normalized) return false;
    return question.answers
        .map((a) => normalizeAnswer(a))
        .includes(normalized);
}

module.exports = {
    JOURNAL_QUESTIONS,
    JOURNAL_QUESTION_COUNT: JOURNAL_QUESTIONS.length,
    normalizeAnswer,
    checkAnswer,
};
