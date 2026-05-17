import React from 'react';

interface AgentGameControlsProps {
    onOpenJournal: () => void;
    onOpenHelp: () => void;
    intelCount: number;
    intelTotal: number;
    won: boolean;
}

const AgentGameControls: React.FC<AgentGameControlsProps> = ({
    onOpenJournal,
    onOpenHelp,
    intelCount,
    intelTotal,
    won,
}) => {
    return (
        <div style={styles.row} className="agent-game-controls">
            <button
                type="button"
                style={styles.iconBtn}
                className="agent-game-btn"
                onClick={onOpenJournal}
                aria-label={`Field journal, ${intelCount} of ${intelTotal} intel recovered`}
                title="Field journal"
            >
                <span style={styles.iconGlyph} aria-hidden="true">
                    📓
                </span>
                <span style={styles.badge}>
                    {won ? '✓' : `${intelCount}/${intelTotal}`}
                </span>
            </button>
            <button
                type="button"
                style={styles.iconBtn}
                className="agent-game-btn"
                onClick={onOpenHelp}
                aria-label="How to play"
                title="How to play"
            >
                <span style={styles.iconGlyph} aria-hidden="true">
                    ?
                </span>
            </button>
        </div>
    );
};

const styles: StyleSheetCSS = {
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginLeft: 4,
    },
    iconBtn: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        padding: 0,
        border: '1px solid #3f1010',
        borderRadius: 4,
        background: 'rgba(5, 5, 5, 0.92)',
        color: '#4ade80',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 700,
        boxSizing: 'border-box',
        transition: 'background 0.15s ease, border-color 0.15s ease',
    },
    iconGlyph: {
        lineHeight: 1,
        fontSize: 15,
    },
    badge: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        minWidth: 14,
        padding: '1px 3px',
        borderRadius: 3,
        background: '#7f1d1d',
        border: '1px solid #dc2626',
        color: '#fecaca',
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: '0.02em',
    },
};

export default AgentGameControls;
