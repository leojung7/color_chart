/**
 * Color math, temperature classification, and sorting utilities.
 */

const tempCache = new Map();

export function isValidHex(hex) {
    return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function hexToRgb(hex) {
    if (!isValidHex(hex)) return { r: 128, g: 128, b: 128 };
    const clean = hex.slice(1);
    const num = parseInt(clean, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

export function getContrastColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 135 ? '#0f172a' : '#ffffff';
}

export function classifyTemperature(marker) {
    if (tempCache.has(marker.code)) {
        return tempCache.get(marker.code);
    }

    let temp = 'neutral';
    const fam = (marker.fam || '').toUpperCase();
    const code = (marker.code || '').toUpperCase();

    if (fam === '0' || fam === 'GREY') {
        if (code.startsWith('WG') || code.startsWith('YGY')) temp = 'warm';
        else if (code.startsWith('CG')) temp = 'cool';
        else temp = 'neutral';
    } else if (['R', 'YR', 'Y', 'E'].includes(fam)) {
        temp = 'warm';
    } else if (['BG', 'B', 'BV'].includes(fam)) {
        temp = 'cool';
    } else {
        // YG, G, V, RV evaluated via RGB balance
        const { r, b } = hexToRgb(marker.hex);
        if (r - b > 25) temp = 'warm';
        else if (b - r > 25) temp = 'cool';
        else temp = 'neutral';
    }

    tempCache.set(marker.code, temp);
    return temp;
}
