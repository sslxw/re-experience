import React from 'react';
import { motion } from 'framer-motion';

const MonitorExitHint: React.FC = () => {
    return (
        <motion.div
            style={styles.wrap}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            aria-live="polite"
        >
            <p style={styles.hint}>ESC — leave terminal</p>
            <p style={styles.sub}>Returns to Umbrella secure boot</p>
        </motion.div>
    );
};

const styles: StyleSheetCSS = {
    wrap: {
        position: 'fixed',
        bottom: 28,
        right: 32,
        zIndex: 120,
        pointerEvents: 'none',
        textAlign: 'right',
        fontFamily: 'Share Tech Mono, monospace',
    },
    hint: {
        margin: 0,
        color: 'rgba(200, 200, 200, 0.75)',
        fontSize: 13,
        letterSpacing: '0.12em',
    },
    sub: {
        margin: '6px 0 0',
        color: 'rgba(74, 222, 128, 0.45)',
        fontSize: 10,
        letterSpacing: '0.08em',
    },
};

export default MonitorExitHint;
