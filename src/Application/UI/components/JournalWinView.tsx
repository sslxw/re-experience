import React from 'react';

const JournalWinView: React.FC = () => (
    <div style={styles.wrap}>
        <p style={styles.winTitle}>MISSION COMPLETE</p>
        <img
            src="/images/journal-prize-cat.png"
            alt="Celebration cat"
            style={styles.cat}
        />
        <p style={styles.prize}>
            Send me a message on Teams with a cat gif to collect your prize.
        </p>
        <p style={styles.sub}>
            All Raccoon Protocol intel verified. Extraction clearance granted,
            Agent S.
        </p>
    </div>
);

const styles: StyleSheetCSS = {
    wrap: {
        textAlign: 'center',
        padding: '8px 4px 16px',
    },
    winTitle: {
        margin: '0 0 12px',
        color: '#4ade80',
        fontWeight: 700,
        letterSpacing: '0.12em',
        fontSize: 13,
    },
    cat: {
        display: 'block',
        width: 'min(220px, 70vw)',
        height: 'auto',
        margin: '0 auto 14px',
        borderRadius: 8,
        border: '2px solid rgba(74, 222, 128, 0.4)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    },
    prize: {
        margin: '0 0 10px',
        color: '#fafafa',
        fontSize: 13,
        lineHeight: 1.55,
        fontWeight: 700,
    },
    sub: {
        margin: 0,
        color: '#a3a3a3',
        fontSize: 11,
        lineHeight: 1.45,
    },
};

export default JournalWinView;
