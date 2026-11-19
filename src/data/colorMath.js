export function hexToRgb(hex) {
    const c = hex.replace('#', '');
    return {
        r: parseInt(c.substring(0, 2), 16),
        g: parseInt(c.substring(2, 4), 16),
        b: parseInt(c.substring(4, 6), 16)
    };
}

export function rgbToLab(r, g, b) {
    let rr = r / 255, gg = g / 255, bb = b / 255;
    rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
    gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
    bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

    let x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047;
    let y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722) / 1.00000;
    let z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16 / 116;

    return { L: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

export function deltaE2000(hex1, hex2) {
    const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
    const l1 = rgbToLab(c1.r, c1.g, c1.b), l2 = rgbToLab(c2.r, c2.g, c2.b);
    const L1 = l1.L, a1 = l1.a, b1 = l1.b;
    const L2 = l2.L, a2 = l2.a, b2 = l2.b;

    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const barC = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(barC, 7) / (Math.pow(barC, 7) + Math.pow(25, 7))));
    const a1Prime = (1 + G) * a1;
    const a2Prime = (1 + G) * a2;

    const C1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
    const C2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);
    const barCPrime = (C1Prime + C2Prime) / 2;

    let h1Prime = Math.atan2(b1, a1Prime) * (180 / Math.PI);
    if (h1Prime < 0) h1Prime += 360;
    let h2Prime = Math.atan2(b2, a2Prime) * (180 / Math.PI);
    if (h2Prime < 0) h2Prime += 360;

    let deltahPrime;
    if (C1Prime * C2Prime === 0) deltahPrime = 0;
    else {
        deltahPrime = h2Prime - h1Prime;
        if (deltahPrime > 180) deltahPrime -= 360;
        else if (deltahPrime < -180) deltahPrime += 360;
    }

    const deltaLPrime = L2 - L1;
    const deltaCPrime = C2Prime - C1Prime;
    const deltaHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((deltahPrime / 2) * (Math.PI / 180));

    const barLPrime = (L1 + L2) / 2;

    let barhPrime;
    if (C1Prime * C2Prime === 0) barhPrime = h1Prime + h2Prime;
    else {
        barhPrime = Math.abs(h1Prime - h2Prime) > 180 
            ? (h1Prime + h2Prime + 360) / 2 
            : (h1Prime + h2Prime) / 2;
    }

    const T = 1 - 0.17 * Math.cos((barhPrime - 30) * (Math.PI / 180)) 
                + 0.24 * Math.cos((2 * barhPrime) * (Math.PI / 180)) 
                + 0.32 * Math.cos((3 * barhPrime + 6) * (Math.PI / 180)) 
                - 0.20 * Math.cos((4 * barhPrime - 63) * (Math.PI / 180));

    const deltaTheta = 30 * Math.exp(-Math.pow((barhPrime - 275) / 25, 2));
    const R_C = 2 * Math.sqrt(Math.pow(barCPrime, 7) / (Math.pow(barCPrime, 7) + Math.pow(25, 7)));
    const S_L = 1 + (0.015 * Math.pow(barLPrime - 50, 2)) / Math.sqrt(20 + Math.pow(barLPrime - 50, 2));
    const S_C = 1 + 0.045 * barCPrime;
    const S_H = 1 + 0.015 * barCPrime * T;
    const R_T = -Math.sin((2 * deltaTheta) * (Math.PI / 180)) * R_C;

    return Math.sqrt(
        Math.pow(deltaLPrime / S_L, 2) +
        Math.pow(deltaCPrime / S_C, 2) +
        Math.pow(deltaHPrime / S_H, 2) +
        R_T * (deltaCPrime / S_C) * (deltaHPrime / S_H)
    );
}

export function getLuma(hex) {
    const { r, g, b } = hexToRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getHue(hex) {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
        const d = max - min;
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    return h;
}

export function getTemperature(m) {
    if (m.fam === "GREY" || m.fam === "0") return "NEUTRAL";
    if (["R", "YR", "Y", "E"].includes(m.fam)) return "WARM";
    return "COOL";
}

export function blendMultiplyAlpha(baseHex, topHex, alpha) {
    const b = hexToRgb(baseHex), t = hexToRgb(topHex);
    const multR = (b.r / 255) * (t.r / 255) * 255;
    const multG = (b.g / 255) * (t.g / 255) * 255;
    const multB = (b.b / 255) * (t.b / 255) * 255;

    const r = Math.round(b.r * (1 - alpha) + multR * alpha);
    const g = Math.round(b.g * (1 - alpha) + multG * alpha);
    const bl = Math.round(b.b * (1 - alpha) + multB * alpha);
    return "#" + [r, g, bl].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function shiftHexHue(hex, deg) {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }
    h = ((h * 360 + deg) % 360) / 360;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const nr = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const ng = Math.round(hue2rgb(p, q, h) * 255);
    const nb = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    return "#" + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
