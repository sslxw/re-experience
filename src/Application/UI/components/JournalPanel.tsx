import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    fetchJournalProgress,
    fetchJournalUser,
    JournalUser,
    resetJournalProgress,
    submitJournalAnswer,
} from '../../Game/journalApi';
import {
    emptyProgress,
    JOURNAL_QUESTIONS,
    JournalProgress,
} from '../../Game/journalGame';
import JournalConfetti from './JournalConfetti';
import JournalWinScreen from './JournalWinScreen';

interface JournalPanelProps {
    open: boolean;
    onClose: () => void;
    onProgressChange: (progress: JournalProgress) => void;
    onRequestTerminalLogin?: () => void;
    authRefreshKey?: number;
}

const JournalPanel: React.FC<JournalPanelProps> = ({
    open,
    onClose,
    onProgressChange,
    onRequestTerminalLogin,
    authRefreshKey = 0,
}) => {
    const [progress, setProgress] = useState<JournalProgress>(emptyProgress);
    const [authUser, setAuthUser] = useState<JournalUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [showConfetti, setShowConfetti] = useState(false);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const confettiFiredRef = useRef(false);

    const triggerConfetti = useCallback(() => {
        if (confettiFiredRef.current) return;
        confettiFiredRef.current = true;
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 4500);
    }, []);
    const releaseIframeFocus = () => {
        const iframe = document.getElementById(
            'computer-screen'
        ) as HTMLIFrameElement | null;
        try {
            const active = iframe?.contentDocument?.activeElement as
                | HTMLElement
                | undefined;
            active?.blur();
        } catch {
            /* ignore */
        }
    };

    const focusQuestion = (questionId: string) => {
        requestAnimationFrame(() => {
            releaseIframeFocus();
            inputRefs.current[questionId]?.focus();
        });
    };

    const focusNextUnsolved = (p: JournalProgress) => {
        const solved = p.solved ?? [];
        const next = JOURNAL_QUESTIONS.find((q) => !solved.includes(q.id));
        if (next) focusQuestion(next.id);
    };

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoading(true);
        setFeedback({});

        (async () => {
            try {
                const user = await fetchJournalUser();
                if (cancelled) return;
                setAuthUser(user);
                if (!user) {
                    const empty = emptyProgress();
                    setProgress(empty);
                    onProgressChange(empty);
                    return;
                }
                try {
                    const p = await fetchJournalProgress();
                    if (cancelled) return;
                    setProgress(p);
                    onProgressChange(p);
                    if (p.won) {
                        triggerConfetti();
                    } else {
                        focusNextUnsolved(p);
                    }
                } catch {
                    if (cancelled) return;
                    const empty = emptyProgress();
                    setProgress(empty);
                    onProgressChange(empty);
                }
            } catch {
                if (cancelled) return;
                setAuthUser(null);
                const empty = emptyProgress();
                setProgress(empty);
                onProgressChange(empty);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, onProgressChange, authRefreshKey, triggerConfetti]);

    useEffect(() => {
        if (!open) {
            confettiFiredRef.current = false;
            setShowConfetti(false);
        }
    }, [open]);

    if (!open) return null;

    const handleSubmit = async (questionId: string) => {
        if (!authUser || submittingId) return;
        const raw = drafts[questionId] ?? '';
        setSubmittingId(questionId);
        try {
            const result = await submitJournalAnswer(questionId, raw);
            setProgress(result.progress);
            onProgressChange(result.progress);

            if (result.correct) {
                setFeedback((f) => ({
                    ...f,
                    [questionId]: 'Intel logged. Archive entry verified.',
                }));
                setDrafts((d) => ({ ...d, [questionId]: '' }));
                if (result.progress.won) {
                    triggerConfetti();
                } else {
                    focusNextUnsolved(result.progress);
                }
            } else if (result.alreadySolved) {
                setFeedback((f) => ({
                    ...f,
                    [questionId]: 'Entry already logged for your account.',
                }));
            } else {
                setFeedback((f) => ({
                    ...f,
                    [questionId]:
                        'No match in archive. Re-read the case files.',
                }));
                focusQuestion(questionId);
            }
        } catch (e) {
            const err = e as Error & { status?: number };
            if (err.status === 401) {
                setAuthUser(null);
                setFeedback((f) => ({
                    ...f,
                    [questionId]: 'Session expired. Log in at the terminal.',
                }));
            } else {
                setFeedback((f) => ({
                    ...f,
                    [questionId]: err.message || 'Could not log intel.',
                }));
                focusQuestion(questionId);
            }
        } finally {
            setSubmittingId(null);
        }
    };

    const handleReset = async () => {
        if (!authUser || submittingId) return;
        setSubmittingId('reset');
        try {
            const fresh = await resetJournalProgress();
            setProgress(fresh);
            onProgressChange(fresh);
            setDrafts({});
            setFeedback({});
            focusNextUnsolved(fresh);
        } catch (e) {
            const err = e as Error & { status?: number };
            if (err.status === 401) setAuthUser(null);
        } finally {
            setSubmittingId(null);
        }
    };

    const modal = (
        <div style={styles.backdrop} role="presentation" onClick={onClose}>
            <div
                className="journal-panel-scroll"
                style={styles.panel}
                role="dialog"
                aria-labelledby="journal-title"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header style={styles.header}>
                    <div>
                        <h2 id="journal-title" style={styles.title}>
                            Field Journal
                        </h2>
                        <p style={styles.subtitle}>
                            {authUser
                                ? progress.won
                                    ? `Operative: ${authUser.name} · Extraction clearance granted`
                                    : `Operative: ${authUser.name} · Intel ${(progress.solved ?? []).length}/${JOURNAL_QUESTIONS.length}`
                                : 'Secure login required'}
                        </p>
                    </div>
                    <button
                        type="button"
                        style={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close journal"
                    >
                        ×
                    </button>
                </header>

                {loading ? (
                    <p style={styles.intro}>Syncing field journal…</p>
                ) : !authUser ? (
                    <div style={styles.authBox}>
                        <p style={styles.authTitle}>CLEARANCE REQUIRED</p>
                        <p style={styles.authText}>
                            Raccoon Protocol progress is stored per operative.
                            Log in or create an account inside the Raccoon City
                            Archive terminal before logging intel.
                        </p>
                        <button
                            type="button"
                            style={styles.loginBtn}
                            onClick={() => onRequestTerminalLogin?.()}
                        >
                            Open terminal login
                        </button>
                    </div>
                ) : progress.won ? (
                    <JournalWinScreen operativeName={authUser.name} />
                ) : (
                    <>
                        <p style={styles.intro}>
                            Answers are hidden in the Raccoon City Archive.
                            Search categories, read reports, and log findings
                            below. Progress is saved to your account.
                        </p>

                        <ul style={styles.list}>
                    {JOURNAL_QUESTIONS.map((q, index) => {
                        const solved = (progress.solved ?? []).includes(q.id);
                        return (
                            <li key={q.id} style={styles.item}>
                                <p style={styles.qNum}>Entry {index + 1}</p>
                                <p style={styles.prompt}>{q.prompt}</p>
                                <p style={styles.hint}>{q.hint}</p>
                                <p style={styles.clue}>{q.archiveClue}</p>
                                {solved ? (
                                    <p style={styles.solved}>✓ Intel secured</p>
                                ) : (
                                    <div style={styles.answerRow}>
                                        <input
                                            ref={(el) => {
                                                inputRefs.current[q.id] = el;
                                            }}
                                            type="text"
                                            value={drafts[q.id] ?? ''}
                                            onChange={(e) =>
                                                setDrafts((d) => ({
                                                    ...d,
                                                    [q.id]: e.target.value,
                                                }))
                                            }
                                            onFocus={releaseIframeFocus}
                                            onMouseDown={(e) =>
                                                e.stopPropagation()
                                            }
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSubmit(q.id);
                                                }
                                            }}
                                            placeholder="Enter answer…"
                                            style={styles.input}
                                            disabled={!!submittingId}
                                            aria-label={`Answer for entry ${index + 1}`}
                                        />
                                        <button
                                            type="button"
                                            style={styles.submitBtn}
                                            disabled={!!submittingId}
                                            onClick={() => handleSubmit(q.id)}
                                        >
                                            {submittingId === q.id
                                                ? '…'
                                                : 'Log'}
                                        </button>
                                    </div>
                                )}
                                {feedback[q.id] && (
                                    <p
                                        style={
                                            solved
                                                ? styles.feedbackOk
                                                : styles.feedbackErr
                                        }
                                    >
                                        {feedback[q.id]}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>

                        <footer style={styles.footer}>
                            <button
                                type="button"
                                style={styles.resetBtn}
                                disabled={!!submittingId}
                                onClick={handleReset}
                            >
                                Reset journal
                            </button>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );

    return createPortal(
        <>
            <JournalConfetti active={showConfetti} />
            {modal}
        </>,
        document.body
    );
};

const styles: StyleSheetCSS = {
    backdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        zIndex: 10000,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
    },
    panel: {
        width: 'min(420px, calc(100vw - 24px))',
        maxHeight: 'min(85vh, 640px)',
        overflowY: 'auto',
        background: 'rgba(8, 6, 6, 0.97)',
        border: '1px solid #3f1010',
        borderLeft: '3px solid #dc2626',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '14px 16px',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        fontSize: 12,
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
    subtitle: {
        margin: '4px 0 0',
        color: '#737373',
        fontSize: 11,
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
    intro: {
        margin: '0 0 12px',
        color: '#a3a3a3',
        lineHeight: 1.5,
    },
    list: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
    },
    item: {
        marginBottom: 14,
        paddingBottom: 14,
        borderBottom: '1px solid #262626',
    },
    qNum: {
        margin: '0 0 4px',
        color: '#dc2626',
        fontSize: 10,
        letterSpacing: '0.1em',
    },
    prompt: {
        margin: '0 0 6px',
        color: '#fafafa',
        lineHeight: 1.4,
    },
    hint: {
        margin: '0 0 4px',
        color: '#737373',
        fontSize: 11,
    },
    clue: {
        margin: '0 0 8px',
        color: '#a3a3a3',
        fontSize: 10,
        fontStyle: 'italic',
    },
    solved: {
        margin: 0,
        color: '#4ade80',
        fontWeight: 700,
    },
    answerRow: {
        display: 'flex',
        gap: 6,
    },
    input: {
        flex: 1,
        minWidth: 0,
        padding: '6px 8px',
        border: '1px solid #3f1010',
        background: 'rgba(0,0,0,0.4)',
        color: '#4ade80',
        fontFamily: 'inherit',
        fontSize: 12,
    },
    submitBtn: {
        padding: '6px 10px',
        border: '1px solid #7f1d1d',
        background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
    },
    feedbackOk: {
        margin: '6px 0 0',
        color: '#4ade80',
        fontSize: 10,
    },
    feedbackErr: {
        margin: '6px 0 0',
        color: '#f87171',
        fontSize: 10,
    },
    footer: {
        marginTop: 8,
        paddingTop: 8,
    },
    resetBtn: {
        border: '1px solid #3f1010',
        background: 'transparent',
        color: '#737373',
        padding: '6px 10px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 10,
    },
    authBox: {
        marginBottom: 12,
        padding: 12,
        border: '1px solid #7f1d1d',
        background: 'rgba(220, 38, 38, 0.08)',
    },
    authTitle: {
        margin: '0 0 8px',
        color: '#f87171',
        fontWeight: 700,
        letterSpacing: '0.1em',
        fontSize: 11,
    },
    authText: {
        margin: '0 0 12px',
        color: '#d4d4d4',
        lineHeight: 1.5,
    },
    loginBtn: {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #7f1d1d',
        background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
    },
};

export default JournalPanel;
