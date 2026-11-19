import { state, saveState, getAllMarkers } from '../data/state.js';
import { deltaE2000, shiftHexHue } from '../data/colorMath.js';
import { presetPalettes } from '../catalog/catalogConfig.js';
import { renderTray } from '../tray/blendingTray.js';

export function loadPresetPalette(type) {
    const codes = presetPalettes[type];
    if (!codes) return;
    state.tray = [...codes];
    saveState();
    renderTray();
    const names = {
        skin: "Skin Tone Recipe",
        hair: "Hair Rendering Recipe",
        eyes: "Eye Color Recipe",
        anime: "Anime Character Palette",
        floral: "Floral Palette",
        seasonal: "Seasonal Palette"
    };
    const preview = document.getElementById('builderPreviewArea');
    if (preview) preview.innerHTML = `<span class="text-emerald-400 font-bold">Loaded ${names[type]} into your Blending Tray!</span>`;
}

export function loadAllPresetToTray() {
    if (!state.tray.length) return alert("Select a preset builder first.");
    saveState();
    renderTray();
    alert("Added preset recipe to tray!");
}

export function nearestMarkerLab(hex) {
    let best = null, bestDist = Infinity;
    getAllMarkers().filter(m => m.code !== "0").forEach(m => {
        const d = deltaE2000(hex, m.hex);
        if (d < bestDist) { bestDist = d; best = m; }
    });
    return { marker: best, dist: bestDist.toFixed(1) };
}

export function analyzeWheelColor(hex) {
    const hexLabel = document.getElementById('wheelHexLabel');
    const resultsEl = document.getElementById('wheelHarmonyResults');
    if (hexLabel) hexLabel.innerText = hex.toUpperCase();
    if (!resultsEl) return;

    const harmonies = [
        { role: "Exact Target Match", target: hex },
        { role: "Complementary (180°)", target: shiftHexHue(hex, 180) },
        { role: "Analogous (+30°)", target: shiftHexHue(hex, 30) },
        { role: "Triadic (+120°)", target: shiftHexHue(hex, 120) }
    ];
    resultsEl.innerHTML = harmonies.map(h => {
        const res = nearestMarkerLab(h.target);
        return `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg border border-slate-700" style="background-color:${res.marker.hex}"></div>
                    <div>
                        <div class="text-[10px] uppercase text-slate-400">${h.role}</div>
                        <div class="text-xs font-bold mono">${res.marker.code} — ${res.marker.name}</div>
                        <div class="text-[9px] text-slate-500">ΔE 2000: ${res.dist}</div>
                    </div>
                </div>
                <button onclick="addToTray('${res.marker.code}')" class="text-xs text-indigo-400 hover:underline">+ Tray</button>
            </div>
        `;
    }).join('');
}

export function generateFisherYatesChallenge() {
    const all = getAllMarkers().filter(m => m.code !== "0" && m.code !== "120");
    const owned = all.filter(m => !m.sets || m.sets.some(s => state.selectedSets.includes(s)));
    const pool = owned.length >= 5 ? [...owned] : [...all];

    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    renderChallengeCards(pool.slice(0, 5), "Random Owned Challenge");
}

export function loadDailyChallenge() {
    const today = new Date().toISOString().substring(0, 10);
    let seed = 0;
    for (const c of today) seed += c.charCodeAt(0);
    const pool = getAllMarkers().filter(m => m.code !== "0" && m.code !== "120");
    const chosen = [];
    while (chosen.length < 5 && chosen.length < pool.length) {
        seed = (seed * 9301 + 49297) % 233280;
        const idx = Math.floor((seed / 233280) * pool.length);
        if (!chosen.includes(pool[idx])) chosen.push(pool[idx]);
    }
    renderChallengeCards(chosen, `Daily Challenge (${today})`);
}

function renderChallengeCards(markers, title) {
    const titleEl = document.getElementById('challengeTitle');
    const resultEl = document.getElementById('challengeResult');
    if (titleEl) titleEl.innerText = title;
    if (!resultEl) return;

    resultEl.innerHTML = markers.map(m => `
        <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div class="h-14 rounded-lg mb-2 border border-slate-700" style="background-color:${m.hex}"></div>
            <div>
                <div class="text-xs font-bold mono">${m.code}</div>
                <div class="text-[10px] text-slate-400 truncate">${m.name}</div>
            </div>
            <button onclick="addToTray('${m.code}')" class="mt-2 text-[10px] text-indigo-400 hover:underline">+ Tray</button>
        </div>
    `).join('');
}
