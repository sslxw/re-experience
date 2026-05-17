let cursorMotionLocked = false;

export function setCursorMotionLock(locked: boolean) {
    cursorMotionLocked = locked;
}

export function isCursorMotionLocked() {
    return cursorMotionLocked;
}
