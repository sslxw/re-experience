import React, { useState } from 'react';
import {
    JOURNAL_PRIZE_CAT_GIF,
    JOURNAL_WIN_TEAMS_MESSAGE,
} from '../../Game/journalConfig';

interface JournalWinScreenProps {
    operativeName?: string;
}

const JournalWinScreen: React.FC<JournalWinScreenProps> = ({ operativeName }) => {
    const [gifOk, setGifOk] = useState(true);

    return (
        <div style={styles.wrap}>
            <p style={styles.title}>MISSION COMPLETE</p>
            <p style={styles.sub}>
                {operativeName
                    ? `All intel verified, ${operativeName}.`
                    : 'All Raccoon Protocol intel verified.'}
            </p>

            <div style={styles.gifFrame}>
                {gifOk ? (
                    <img
                        src={JOURNAL_PRIZE_CAT_GIF}
                        alt="Prize cat"
                        style={styles.gif}
                        onError={() => setGifOk(false)}
                    />
                ) : (
                    <div style={styles.gifPlaceholder}>
                        <span style={styles.placeholderIcon}>🐱</span>
                        <p style={styles.placeholderText}>
                            Add your GIF at
                            <br />
                            <code style={styles.code}>
                                static/images/journal/prize-cat.gif
                            </code>
                        </p>
                    </div>
                )}
            </div>

            <p style={styles.prize}>{JOURNAL_WIN_TEAMS_MESSAGE}</p>
        </div>
    );
};

const styles: StyleSheetCSS = {
    wrap: {
        textAlign: 'center',
        padding: '8px 4px 4px',
    },
    title: {
        margin: 0,
        color: '#4ade80',
        fontWeight: 700,
        letterSpacing: '0.14em',
        fontSize: 14,
    },
    sub: {
        margin: '8px 0 16px',
        color: '#a3a3a3',
        lineHeight: 1.5,
        fontSize: 11,
    },
    gifFrame: {
        margin: '0 auto 16px',
        maxWidth: 280,
        border: '2px solid #dc2626',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#0a0a0a',
        boxShadow: '0 8px 32px rgba(220, 38, 38, 0.25)',
    },
    gif: {
        display: 'block',
        width: '100%',
        height: 'auto',
        maxHeight: 220,
        objectFit: 'cover',
    },
    gifPlaceholder: {
        padding: '32px 16px',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderIcon: {
        fontSize: 48,
        lineHeight: 1,
    },
    placeholderText: {
        margin: 0,
        color: '#737373',
        fontSize: 10,
        lineHeight: 1.5,
    },
    code: {
        color: '#4ade80',
        fontSize: 9,
        wordBreak: 'break-all' as const,
    },
    prize: {
        margin: 0,
        color: '#fafafa',
        fontSize: 13,
        lineHeight: 1.55,
        letterSpacing: '0.04em',
        padding: '12px 10px',
        border: '1px solid rgba(74, 222, 128, 0.35)',
        background: 'rgba(74, 222, 128, 0.08)',
    },
};

export default JournalWinScreen;
