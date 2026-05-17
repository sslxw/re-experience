export interface JournalQuestion {
    id: string;
    prompt: string;
    hint: string;
    archiveClue: string;
    answers: string[];
}

export const JOURNAL_QUESTIONS: JournalQuestion[] = [
    {
        id: 'q-virus',
        prompt: 'What virus strain is listed at CRITICAL containment status?',
        hint: 'Search the Biohazard category or read the lab analysis transmission.',
        archiveClue: 'File: T-Virus Containment Status',
        answers: ['tvirus', 't-virus', 't virus'],
    },
    {
        id: 'q-bravo',
        prompt: 'At what time was radio contact with Bravo team lost?',
        hint: 'Review the Spencer Mansion initial survey in Investigation.',
        archiveClue: 'File: Spencer Mansion — Initial Survey',
        answers: ['2200', '22:00', '10pm', '10:00pm'],
    },
    {
        id: 'q-barry',
        prompt: 'Which operative warned agents about the mansion library?',
        hint: 'Check comments on the Spencer Mansion case file.',
        archiveClue: 'Comment thread on post-001',
        answers: ['barry', 'barryb', 'barry b'],
    },
    {
        id: 'q-barricade',
        prompt: 'When did hostiles breach the east barricade at RPD?',
        hint: 'Read the night log under Operations.',
        archiveClue: 'File: RPD Perimeter Collapse — Night Log',
        answers: ['0314', '03:14', '3:14am', '314'],
    },
    {
        id: 'q-nest',
        prompt: 'What is the codename of the Umbrella underground facility?',
        hint: 'Look for Facilities reports tagged game-intel.',
        archiveClue: 'File: Underground Site NEST — Briefing',
        answers: ['nest'],
    },
    {
        id: 'q-clearance',
        prompt: "What is Agent S's extraction clearance code?",
        hint: 'Find the sealed dossier addressed to Agent S in Personnel.',
        archiveClue: 'File: Agent S — Extraction Dossier',
        answers: ['s7734', 's-7734'],
    },
    {
        id: 'q-room',
        prompt: 'What room are we in?',
        hint: 'Check the STARS office assignment log under Operations.',
        archiveClue: 'File: STARS Office — Room Assignment',
        answers: ['254', 'room254', 'room 254'],
    },
];

export interface JournalProgress {
    solved: string[];
    won: boolean;
    wonAt?: string;
}

export function emptyProgress(): JournalProgress {
    return { solved: [], won: false };
}
