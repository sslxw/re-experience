import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import UIEventBus from '../EventBus';
import AgentGameControls from './AgentGameControls';
import GameHelpModal from './GameHelpModal';
import InfoOverlay from './InfoOverlay';
import JournalPanel from './JournalPanel';
import {
    fetchJournalProgress,
    fetchJournalUser,
} from '../../Game/journalApi';
import {
    emptyProgress,
    JOURNAL_QUESTIONS,
    JournalProgress,
} from '../../Game/journalGame';
import { setCursorMotionLock } from '../cursorMotionLock';

interface InterfaceUIProps {}

const InterfaceUI: React.FC<InterfaceUIProps> = ({}) => {
    const [initLoad, setInitLoad] = useState(true);
    const [visible, setVisible] = useState(false);
    const [sceneActive, setSceneActive] = useState(false);
    const [inMonitor, setInMonitor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [journalOpen, setJournalOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [progress, setProgress] = useState<JournalProgress>(emptyProgress);
    const [authRefreshKey, setAuthRefreshKey] = useState(0);
    const interfaceRef = useRef<HTMLDivElement>(null);

    const showGameHud = sceneActive && !inMonitor;

    const refreshHudProgress = useCallback(async () => {
        try {
            const user = await fetchJournalUser();
            if (!user) {
                setProgress(emptyProgress());
                return;
            }
            const p = await fetchJournalProgress();
            setProgress(p);
        } catch {
            setProgress(emptyProgress());
        }
    }, []);

    const openTerminalLogin = useCallback(() => {
        UIEventBus.dispatch('requestEnterMonitor', {});
        const iframe = document.getElementById(
            'computer-screen'
        ) as HTMLIFrameElement | null;
        iframe?.contentWindow?.postMessage(
            { type: 'navigate', hash: '#/login' },
            '*'
        );
    }, []);

    const openJournal = () => {
        setHelpOpen(false);
        setJournalOpen(true);
    };

    const openHelp = () => {
        setJournalOpen(false);
        setHelpOpen(true);
    };

    const gameControls = (
        <AgentGameControls
            onOpenJournal={openJournal}
            onOpenHelp={openHelp}
            intelCount={(progress.solved ?? []).length}
            intelTotal={JOURNAL_QUESTIONS.length}
            won={progress.won}
        />
    );

    useEffect(() => {
        UIEventBus.on('loadingScreenDone', () => {
            setLoading(false);
        });

        const element = document.getElementById('ui-interactive');
        if (element) {
            // @ts-ignore
            interfaceRef.current = element;
        }
    }, []);

    useEffect(() => {
        if (sceneActive) refreshHudProgress();
    }, [sceneActive, refreshHudProgress, authRefreshKey]);

    const initMouseDownHandler = () => {
        setSceneActive(true);
        setVisible(true);
        setInitLoad(false);
    };

    useEffect(() => {
        if (!loading && initLoad) {
            document.addEventListener('mousedown', initMouseDownHandler);
            return () => {
                document.removeEventListener('mousedown', initMouseDownHandler);
            };
        }
    }, [loading, initLoad]);

    useEffect(() => {
        UIEventBus.on('enterMonitor', () => {
            setSceneActive(true);
            setInMonitor(true);
            setVisible(false);
            setInitLoad(false);
            setJournalOpen(false);
            setHelpOpen(false);
            const prevent = document.getElementById('prevent-click');
            if (prevent) prevent.style.pointerEvents = 'none';
        });
        UIEventBus.on('leftMonitor', () => {
            setSceneActive(true);
            setInMonitor(false);
            setVisible(true);
            const prevent = document.getElementById('prevent-click');
            if (prevent) prevent.style.pointerEvents = 'auto';
        });
    }, []);

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (!event.data) return;
            if (event.data.type === 'journalAuthChanged') {
                setAuthRefreshKey((k) => k + 1);
                refreshHudProgress();
                return;
            }
            if (event.data.type === 'openFieldJournal') {
                setSceneActive(true);
                setHelpOpen(false);
                setJournalOpen(true);
            }
            if (event.data.type === 'openGameHelp') {
                setSceneActive(true);
                setJournalOpen(false);
                setHelpOpen(true);
            }
            if (event.data.type === 'keydown' && event.data.key === 'Escape') {
                if (journalOpen) {
                    setJournalOpen(false);
                    return;
                }
                if (helpOpen) {
                    setHelpOpen(false);
                    return;
                }
                if (inMonitor) {
                    UIEventBus.dispatch('requestLeaveMonitor', {});
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [sceneActive, journalOpen, helpOpen, inMonitor, refreshHudProgress]);

    useEffect(() => {
        setCursorMotionLock(journalOpen || helpOpen);
    }, [journalOpen, helpOpen]);

    useEffect(() => {
        const iframe = document.getElementById(
            'computer-screen'
        ) as HTMLIFrameElement | null;
        if (!iframe) return;

        if (journalOpen || helpOpen) {
            iframe.style.pointerEvents = 'none';
            iframe.setAttribute('inert', '');
            iframe.tabIndex = -1;
            try {
                const active = iframe.contentDocument?.activeElement as
                    | HTMLElement
                    | undefined;
                active?.blur();
            } catch {
                /* ignore */
            }
            return;
        }

        iframe.removeAttribute('inert');
        iframe.tabIndex = 0;
        iframe.style.pointerEvents = inMonitor ? 'auto' : 'none';
    }, [journalOpen, helpOpen, inMonitor]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (journalOpen) {
                e.preventDefault();
                setJournalOpen(false);
                return;
            }
            if (helpOpen) {
                e.preventDefault();
                setHelpOpen(false);
                return;
            }
            if (inMonitor) {
                e.preventDefault();
                e.stopPropagation();
                UIEventBus.dispatch('requestLeaveMonitor', {});
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [journalOpen, helpOpen, inMonitor]);

    if (loading) {
        return <></>;
    }

    return (
        <>
            <motion.div
                initial="hide"
                variants={vars}
                animate={visible ? 'visible' : 'hide'}
                style={styles.wrapper}
                className="interface-wrapper"
                id="prevent-click"
            >
                <InfoOverlay
                    visible={visible}
                    gameControls={showGameHud ? gameControls : null}
                />
            </motion.div>

            <JournalPanel
                open={journalOpen}
                onClose={() => setJournalOpen(false)}
                onProgressChange={setProgress}
                onRequestTerminalLogin={openTerminalLogin}
                authRefreshKey={authRefreshKey}
            />
            <GameHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
};

const vars = {
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            delay: 0.3,
            ease: 'easeOut',
        },
    },
    hide: {
        x: -32,
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
};

const styles: StyleSheetCSS = {
    wrapper: {
        width: '100%',
        display: 'flex',
        position: 'absolute',
        boxSizing: 'border-box',
    },
};

export default InterfaceUI;
