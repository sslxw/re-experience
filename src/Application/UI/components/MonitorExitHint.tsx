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
};

export default MonitorExitHint;
