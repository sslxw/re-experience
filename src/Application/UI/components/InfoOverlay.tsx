import React, { useEffect, useRef, useState } from 'react';
import FreeCamToggle from './FreeCamToggle';
import MuteToggle from './MuteToggle';

interface InfoOverlayProps {
    visible: boolean;
    gameControls?: React.ReactNode;
}

const NAME_TEXT = 'Agent S';
const TITLE_TEXT = 'Raccoon City';
const MULTIPLIER = 1;

const InfoOverlay: React.FC<InfoOverlayProps> = ({ visible, gameControls }) => {
    const visRef = useRef(visible);
    const [nameText, setNameText] = useState('');
    const [titleText, setTitleText] = useState('');
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const timeRef = useRef(time);
    const [timeText, setTimeText] = useState('');
    const [textDone, setTextDone] = useState(false);
    const [volumeVisible, setVolumeVisible] = useState(false);
    const [freeCamVisible, setFreeCamVisible] = useState(false);

    const typeText = (
        i: number,
        curText: string,
        text: string,
        setText: React.Dispatch<React.SetStateAction<string>>,
        callback: () => void,
        refOverride?: React.MutableRefObject<string>
    ) => {
        if (refOverride) {
            text = refOverride.current;
        }
        if (i < text.length) {
            setTimeout(() => {
                if (visRef.current === true)
                    window.postMessage(
                        { type: 'keydown', key: `_AUTO_${text[i]}` },
                        '*'
                    );

                setText(curText + text[i]);
                typeText(
                    i + 1,
                    curText + text[i],
                    text,
                    setText,
                    callback,
                    refOverride
                );
            }, Math.random() * 50 + 50 * MULTIPLIER);
        } else {
            callback();
        }
    };

    useEffect(() => {
        if (visible && nameText == '') {
            setTimeout(() => {
                typeText(0, '', NAME_TEXT, setNameText, () => {
                    typeText(0, '', TITLE_TEXT, setTitleText, () => {
                        typeText(
                            0,
                            '',
                            time,
                            setTimeText,
                            () => {
                                setTextDone(true);
                            },
                            timeRef
                        );
                    });
                });
            }, 400);
        }
        visRef.current = visible;
    }, [visible]);

    useEffect(() => {
        if (textDone) {
            setTimeout(() => {
                setVolumeVisible(true);
                setTimeout(() => {
                    setFreeCamVisible(true);
                }, 250);
            }, 250);
        }
    }, [textDone]);

    useEffect(() => {
        window.postMessage({ type: 'keydown', key: `_AUTO_` }, '*');
    }, [freeCamVisible, volumeVisible]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        timeRef.current = time;
        textDone && setTimeText(time);
    }, [time]);

    return (
        <div style={styles.wrapper}>
            {nameText !== '' && (
                <div style={styles.nameRow}>
                    <div style={styles.container}>
                        <p>{nameText}</p>
                    </div>
                    {gameControls}
                </div>
            )}
            {titleText !== '' && (
                <div style={styles.container}>
                    <p>{titleText}</p>
                </div>
            )}
            {timeText !== '' && (
                <div style={styles.lastRow}>
                    <div
                        style={Object.assign(
                            {},
                            styles.container,
                            styles.lastRowChild
                        )}
                    >
                        <p>{timeText}</p>
                    </div>
                    {volumeVisible && (
                        <div style={styles.lastRowChild}>
                            <MuteToggle />
                        </div>
                    )}
                    {freeCamVisible && (
                        <div style={styles.lastRowChild}>
                            <FreeCamToggle />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles: StyleSheetCSS = {
    nameRow: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 4,
    },
    container: {
        background: 'rgba(5, 5, 5, 0.9)',
        border: '1px solid #3f1010',
        borderLeft: '3px solid #dc2626',
        padding: 6,
        paddingLeft: 16,
        paddingRight: 16,
        textAlign: 'center',
        display: 'flex',
        boxSizing: 'border-box',
        color: '#4ade80',
        letterSpacing: '0.1em',
        fontSize: 13,
        textTransform: 'uppercase',
    },
    wrapper: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    blinkingContainer: {
        // width: 100,
        // height: 100,
        marginLeft: 8,
        paddingBottom: 2,
        paddingRight: 4,
    },
    lastRow: {
        display: 'flex',
        flexDirection: 'row',
    },
    lastRowChild: {
        marginRight: 4,
    },
};

export default InfoOverlay;
