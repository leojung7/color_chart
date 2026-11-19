import { state, saveState } from '../data/state.js';
import { evaluatePalette, renderTray } from '../tray/blendingTray.js';

export function loadSavedPalette(idx) {
    if (!state.palettes[idx]) return;
    state.tray = [...state.palettes[idx].codes];
    saveState();
    renderTray();
}

export function deleteSavedPalette(idx) {
    state.palettes.splice(idx, 1);
    saveState();
    renderSavedPalettes();
}

export function renderSavedPalettes() {
    const el = document.getElementById('savedPalettesList');
    if (!el) return;
    el.innerHTML = state.palettes.map((p, idx) => {
        const q = evaluatePalette(p.codes);
        return `
            <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                    <div class="text-xs font-bold">${p.name} <span class="text-[10px] text-indigo-400 font-normal">(${q}/100)</span></div>
                    <div class="text-[10px] mono text-slate-400">${p.codes.join(', ')}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="loadSavedPalette(${idx})" class="text-xs text-indigo-400 hover:underline">Load</button>
                    <button onclick="deleteSavedPalette(${idx})" class="text-xs text-rose-400 hover:underline">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}
