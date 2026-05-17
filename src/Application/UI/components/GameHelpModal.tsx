import React from 'react';
import { createPortal } from 'react-dom';
import { JOURNAL_QUESTIONS } from '../../Game/journalGame';

interface GameHelpModalProps {
    open: boolean;
    onClose: () => void;
}

const GameHelpModal: React.FC<GameHelpModalProps> = ({ open, onClose }) => {
    if (!open) return null;

    const modal = (
        <div style={styles.backdrop} role="presentation" onClick={onClose}>
            <div
                style={styles.panel}
                role="dialog"
                aria-labelledby="help-title"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <header style={styles.header}>
                    <h2 id="help-title" style={styles.title}>
                        Raccoon Protocol
                    </h2>
                    <button
                        type="button"
                        style={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close help"
                    >
                        ×
                    </button>
                </header>

                <p style={styles.lead}>
                    You are <strong style={styles.accent}>Agent S</strong>.
                    Recover {JOURNAL_QUESTIONS.length} intel entries from the
                    classified archive to win extraction.
                </p>

                <ol style={styles.steps}>
                    <li>
                        <strong>Click the monitor screen</strong> to open the{' '}
                        <strong>Raccoon City Archive</strong> terminal.
                    </li>
                    <li>
                        <strong>Sign in or create an account</strong> in the
                        terminal — Field Journal progress is saved per operative.
                    </li>
                    <li>
                        Read case files in <strong>Home</strong>,{' '}
                        <strong>Archives</strong>, and <strong>Search</strong>.
                        Use categories and tags to narrow reports.
                    </li>
                    <li>
                        Open your <strong>Field Journal</strong> (📓) anytime
                        and log answers you find in the files.
                    </li>
                    <li>
                        Check comments on posts — some intel is only in field
                        notes left by other operatives.
                    </li>
                    <li>
                        Recover all {JOURNAL_QUESTIONS.length} entries to
                        complete the mission.
                    </li>
                    <li>
                        Press <strong>ESC</strong> to leave the terminal and return
                        to the desk (journal/help close first if open).
                    </li>
                </ol>

                <p style={styles.tip}>
                    Wrong answer? Re-read the linked report named in each
                    journal entry. Answers are short codes, names, or times.
                </p>

                <button type="button" style={styles.okBtn} onClick={onClose}>
                    Understood
                </button>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

const styles: StyleSheetCSS = {
    backdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
    },
    panel: {
        width: 'min(400px, calc(100vw - 24px))',
        background: 'rgba(8, 6, 6, 0.97)',
        border: '1px solid #3f1010',
        borderLeft: '3px solid #dc2626',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '14px 16px',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.5,
        boxSizing: 'border-box',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 10,
    },
    title: {
        margin: 0,
        color: '#4ade80',
        fontSize: 14,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
    },
    closeBtn: {
        border: '1px solid #3f1010',
        background: 'rgba(255,255,255,0.04)',
        color: '#a3a3a3',
        width: 28,
        height: 28,
        cursor: 'pointer',
        fontSize: 18,
        lineHeight: 1,
    },
    lead: {
        margin: '0 0 12px',
    },
    accent: {
        color: '#4ade80',
    },
    steps: {
        margin: '0 0 12px',
        paddingLeft: 18,
    },
    tip: {
        margin: '0 0 14px',
        color: '#737373',
        fontSize: 11,
    },
    okBtn: {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #7f1d1d',
        background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
    },
};

export default GameHelpModal;
