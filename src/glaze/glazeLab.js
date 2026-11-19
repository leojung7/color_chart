import { state, saveState, getAllMarkers } from '../data/state.js';
import { blendMultiplyAlpha } from '../data/colorMath.js';
import { addToTray } from '../tray/blendingTray.js';

export function updateGlazeLabUI() {
    const countEl = document.getElementById('layerCountSelect');
    const container = document.getElementById('glazeLayersContainer');
    if (!countEl || !container) return;

    const count = parseInt(countEl.value);
    container.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;

    const all = getAllMarkers().filter(m => m.code !== "0");
    const options = all.map(m => `<option value="${m.code}">${m.code} - ${m.name}</option>`).join('');

    let html = '';
    for (let i = 1; i <= count; i++) {
        const isBase = i === 1;
        html += `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <div>
                    <label class="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">${isBase ? '1. Base Coat' : `Layer ${i} Glaze`}</label>
                    <select id="glazeLayer${i}" onchange="computeGlazeStack()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 mb-2 outline-none">${options}</select>
                    ${!isBase ? `
                        <div class="mb-2">
                            <div class="flex justify-between text-[10px] text-slate-400"><span>Opacity</span><span id="opLabel${i}">65%</span></div>
                            <input type="range" id="glazeOpacity${i}" min="25" max="100" value="65" oninput="document.getElementById('opLabel${i}').innerText=this.value+'%';computeGlazeStack()" class="w-full accent-indigo-500">
                        </div>
                    ` : '<div class="text-[10px] text-slate-500 mb-2">100% Base Coverage</div>'}
                </div>
                <div id="glazeSwatch${i}" class="h-14 rounded-lg border border-slate-700 flex items-end p-1.5 text-[10px] font-bold mono"></div>
            </div>
        `;
    }
    container.innerHTML = html;
    if (document.getElementById('glazeLayer1')) document.getElementById('glazeLayer1').value = "Y02";
    if (document.getElementById('glazeLayer2')) document.getElementById('glazeLayer2').value = "B02";
    if (document.getElementById('glazeLayer3')) document.getElementById('glazeLayer3').value = "B09";
    computeGlazeStack();
    renderGlazeHistory();
}

export function computeGlazeStack() {
    const countEl = document.getElementById('layerCountSelect');
    if (!countEl) return;
    const count = parseInt(countEl.value);
    const all = getAllMarkers();
    let currentHex = "#FFFFFF";
    let codes = [];

    for (let i = 1; i <= count; i++) {
        const sel = document.getElementById(`glazeLayer${i}`);
        if (!sel) continue;
        const m = all.find(x => x.code === sel.value);
        if (!m) continue;
        codes.push(m.code);

        if (i === 1) {
            currentHex = m.hex;
        } else {
            const opEl = document.getElementById(`glazeOpacity${i}`);
            const op = opEl ? parseInt(opEl.value) / 100 : 0.65;
            currentHex = blendMultiplyAlpha(currentHex, m.hex, op);
        }
        const sw = document.getElementById(`glazeSwatch${i}`);
        if (sw) { sw.style.backgroundColor = m.hex; sw.innerText = m.code; }
    }

    const resSwatch = document.getElementById('glazeResultSwatch');
    const resText = document.getElementById('glazeResultText');
    if (resSwatch) resSwatch.style.backgroundColor = currentHex;
    if (resText) resText.innerText = `Stack: ${codes.join(' → ')} | Result: ${currentHex}`;
}

export function saveGlazeRecipe() {
    const countEl = document.getElementById('layerCountSelect');
    if (!countEl) return;
    const count = parseInt(countEl.value);
    const layers = [];
    for (let i = 1; i <= count; i++) {
        const sel = document.getElementById(`glazeLayer${i}`);
        if (sel) {
            const code = sel.value;
            const op = i === 1 ? 100 : document.getElementById(`glazeOpacity${i}`).value;
            layers.push(`${code} @${op}%`);
        }
    }
    state.glazeHistory.unshift({ date: new Date().toLocaleDateString(), layers });
    if (state.glazeHistory.length > 15) state.glazeHistory.pop();
    saveState();
    renderGlazeHistory();
}

export function renderGlazeHistory() {
    const el = document.getElementById('glazeHistoryList');
    if (!el) return;
    if (!state.glazeHistory || !state.glazeHistory.length) {
        el.innerHTML = `<div class="text-slate-500">No glaze recipes logged yet.</div>`;
        return;
    }
    el.innerHTML = state.glazeHistory.map(h => `
        <div class="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex justify-between items-center">
            <span class="mono font-bold text-slate-200">${h.layers.join(' → ')}</span>
            <span class="text-[10px] text-slate-500">${h.date}</span>
        </div>
    `).join('');
}

export function sendGlazeToTray() {
    const countEl = document.getElementById('layerCountSelect');
    if (!countEl) return;
    const count = parseInt(countEl.value);
    for (let i = 1; i <= count; i++) {
        const sel = document.getElementById(`glazeLayer${i}`);
        if (sel) addToTray(sel.value);
    }
}
