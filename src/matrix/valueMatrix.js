import { state, saveState, getAllMarkers } from '../data/state.js';
import { getLuma } from '../data/colorMath.js';
import { familyTitles } from '../catalog/catalogConfig.js';
import { generateBlendRecipe } from '../chart/masterChart.js';
import { renderTray } from '../tray/blendingTray.js';

export function showSmartRecipe(code) {
    const r = generateBlendRecipe(code);
    if (!r) return;
    const steps = [
        { label: "Highlight", m: r.highlight },
        { label: "Light", m: r.light },
        { label: "Base", m: r.base },
        { label: "Dark", m: r.dark },
        { label: "Shadow", m: r.shadow }
    ];
    const banner = document.getElementById('smartRecipeBanner');
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-indigo-300 uppercase">5-Step Smart Blend Recipe for ${code}</span>
            <button onclick="loadRecipeToTray(['${steps.map(s => s.m.code).join("','")}'])" class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg">Load 5-Step into Tray</button>
        </div>
        <div class="grid grid-cols-5 gap-2">
            ${steps.map(s => `
                <div class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                    <div class="text-[9px] uppercase text-slate-400 mb-1">${s.label}</div>
                    <div class="h-8 rounded mb-1" style="background-color:${s.m.hex}"></div>
                    <div class="text-xs font-bold mono">${s.m.code}</div>
                </div>
            `).join('')}
        </div>
    `;
}

export function loadRecipeToTray(codes) {
    state.tray = Array.from(new Set(codes)).slice(0, 6);
    saveState();
    renderTray();
}

export function renderValueMatrix() {
    const container = document.getElementById('matrixContainer');
    if (!container) return;
    const all = getAllMarkers();
    const families = ["R", "YR", "Y", "YG", "G", "BG", "B", "BV", "V", "RV", "E"];
    container.innerHTML = families.map(fam => {
        const famMarkers = all.filter(m => m.fam === fam).sort((a, b) => getLuma(b.hex) - getLuma(a.hex));
        if (!famMarkers.length) return '';
        return `
            <div class="border border-slate-800 bg-slate-950 p-4 rounded-xl">
                <h3 class="text-xs font-bold text-slate-300 uppercase mb-3">${familyTitles[fam]}</h3>
                <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    ${famMarkers.map(m => `
                        <div onclick="showSmartRecipe('${m.code}')" class="cursor-pointer p-2 rounded border border-slate-800 bg-slate-900 text-center hover:border-indigo-500 transition">
                            <div class="h-6 rounded mb-1" style="background-color:${m.hex}"></div>
                            <div class="text-[10px] font-bold mono">${m.code}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}
