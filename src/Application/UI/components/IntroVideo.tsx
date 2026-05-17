import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/** Drop your file at `static/video/intro.mp4` (copied to `/video/intro.mp4` in dev/build). */
export const INTRO_VIDEO_SRC = '/video/intro.mp4';

type IntroVideoProps = {
    onComplete: () => void;
};

const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const play = () => {
            video.play().catch(() => onComplete());
        };

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            play();
        } else {
            video.addEventListener('loadeddata', play, { once: true });
        }

        return () => video.removeEventListener('loadeddata', play);
    }, [onComplete]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onComplete();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onComplete]);

    return (
        <motion.div style={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <video
                ref={videoRef}
                src={INTRO_VIDEO_SRC}
                style={styles.video}
                playsInline
                preload="auto"
                onEnded={onComplete}
                onError={onComplete}
            />
            <p style={styles.skipHint}>ESC — skip</p>
        </motion.div>
    );
};

const styles: StyleSheetCSS = {
    overlay: {
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    skipHint: {
        position: 'absolute',
        bottom: 28,
        right: 32,
        color: 'rgba(200, 200, 200, 0.55)',
        fontSize: 13,
        letterSpacing: 1,
        fontFamily: 'Share Tech Mono, monospace',
        pointerEvents: 'none',
    },
};

export default IntroVideo;
