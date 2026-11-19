import { state, saveState, getAllMarkers, trackUsage } from '../data/state.js';
import { getLuma } from '../data/colorMath.js';
import { MAX_PALETTES, moodPalettes } from '../catalog/catalogConfig.js';
import { renderSavedPalettes } from '../palette/savedPalettes.js';

export function evaluatePalette(codes) {
    const palette = codes.map(c => getAllMarkers().find(m => m.code === c)).filter(Boolean);
    if (palette.length < 2) return 0;
    let score = 50;
    for (let i = 1; i < palette.length; i++) {
        const diff = Math.abs(getLuma(palette[i - 1].hex) - getLuma(palette[i].hex));
        score += Math.min(12, diff / 5);
    }
    return Math.min(100, Math.round(score));
}

export function addToTray(code) {
    if (!state.tray.includes(code)) {
        if (state.tray.length >= 6) state.tray.shift();
        state.tray.push(code);
        trackUsage(code);
        saveState();
        renderTray();
    }
}

export function removeFromTray(code) {
    state.tray = state.tray.filter(x => x !== code);
    saveState();
    renderTray();
}

export function loadMoodPalette(name) {
    if (!moodPalettes[name]) return;
    state.tray = [...moodPalettes[name]];
    saveState();
    renderTray();
}

export function renderTray() {
    const c = document.getElementById('trayContainer');
    const badge = document.getElementById('trayQualityBadge');
    if (!c || !badge) return;
    if (!state.tray || state.tray.length === 0) {
        c.innerHTML = `<span class="text-xs text-slate-400">Blending Tray is empty</span>`;
        badge.innerText = "Blend Quality: —";
        return;
    }
    const score = evaluatePalette(state.tray);
    badge.innerText = `Blend Quality: ${score}/100`;

    c.innerHTML = state.tray.map(code => {
        const m = getAllMarkers().find(x => x.code === code);
        return `<div class="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded px-2 py-1 shrink-0"><span class="w-3 h-3 rounded" style="background-color:${m ? m.hex : '#333'}"></span><span class="text-xs font-bold mono">${code}</span><button onclick="removeFromTray('${code}')" class="text-[10px] text-slate-500 ml-1">✕</button></div>`;
    }).join('');
}

export function clearTray() {
    state.tray = [];
    saveState();
    renderTray();
}

export function copyPaletteCodes() {
    if (!state.tray.length) return alert("Tray is empty.");
    const txt = state.tray.join("\n");
    navigator.clipboard.writeText(txt);
    alert("Copied palette marker codes to clipboard!");
}

export function saveCurrentTray() {
    if (state.tray.length < 2) return alert("Add at least 2 markers to your tray.");
    const inputEl = document.getElementById('paletteNameInput');
    const rawName = (inputEl ? inputEl.value.trim() : '') || `Combo #${state.palettes.length + 1}`;
    const existingIdx = state.palettes.findIndex(p => p.name.toLowerCase() === rawName.toLowerCase());

    if (existingIdx !== -1) {
        if (!confirm(`A palette named "${rawName}" already exists. Overwrite it?`)) return;
        state.palettes[existingIdx] = { name: rawName, codes: [...state.tray] };
    } else {
        if (state.palettes.length >= MAX_PALETTES) state.palettes.pop();
        state.palettes.unshift({ name: rawName, codes: [...state.tray] });
    }
    saveState();
    if (inputEl) inputEl.value = '';
    renderSavedPalettes();
    alert(`Saved "${rawName}"!`);
}

export function exportTrayPng() {
    if (!state.tray.length) return alert("Add markers to your tray first.");
    const canvas = document.createElement('canvas');
    const w = 140 * state.tray.length, h = 180;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    state.tray.forEach((code, idx) => {
        const m = getAllMarkers().find(x => x.code === code);
        ctx.fillStyle = m ? m.hex : '#333333';
        ctx.fillRect(idx * 140, 0, 140, 130);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(idx * 140, 130, 140, 50);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(code, idx * 140 + 12, 152);
        ctx.font = '11px sans-serif';
        ctx.fillText(m ? m.name.slice(0, 16) : '', idx * 140 + 12, 170);
    });
    const a = document.createElement('a');
    a.download = 'ohuhu-palette.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
}

export function shareFullStateUrl() {
    const paperEl = document.getElementById('paperSelect');
    const payload = {
        tray: state.tray,
        sets: state.selectedSets,
        paper: paperEl ? paperEl.value : 'paper-dark'
    };
    const encoded = btoa(JSON.stringify(payload));
    const url = `${window.location.origin}${window.location.pathname}#studio=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("Shareable Studio URL copied to clipboard!");
}
