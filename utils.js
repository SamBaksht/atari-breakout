export function isMobile() {
    if(window.innerWidth < window.innerHeight / 1.5) {
        return true;
    }
    return false;
}

export function handleResize() {
    const mobile = isMobile();
    return { mobile, width: window.innerWidth, height: window.innerHeight };
}