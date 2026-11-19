import { state, saveState } from '../data/state.js';
import { renderChart } from '../chart/masterChart.js';
import { renderOrganizerMap } from '../organizer/organizerMap.js';

export function addCustomMarker() {
    const nameEl = document.getElementById('customName');
    const famEl = document.getElementById('customFam');
    const hexEl = document.getElementById('customHex');
    if (!nameEl || !famEl || !hexEl) return;

    const name = nameEl.value.trim();
    const fam = famEl.value;
    const hex = hexEl.value;
    if (!name) return alert("Enter a name for your custom swatch.");

    const code = `${fam}-CUST-${Date.now().toString().slice(-4)}`;
    state.customMarkers.push({ code, old: "CUSTOM", copic: "CUSTOM", name, hex, fam, sets: ["320"] });
    saveState();
    nameEl.value = '';
    renderCustomMarkers();
    renderChart();
    renderOrganizerMap();
}

export function deleteCustomMarker(idx) {
    state.customMarkers.splice(idx, 1);
    saveState();
    renderCustomMarkers();
    renderChart();
    renderOrganizerMap();
}

export function renderCustomMarkers() {
    const c = document.getElementById('customMarkersList');
    if (!c) return;
    if (!state.customMarkers || !state.customMarkers.length) {
        c.innerHTML = `<div class="text-xs text-slate-500 col-span-full">No custom swatches added yet.</div>`;
        return;
    }
    c.innerHTML = state.customMarkers.map((m, idx) => `
        <div class="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded border border-slate-700" style="background-color:${m.hex}"></span>
                <div><div class="text-xs font-bold mono">${m.code}</div><div class="text-[10px] text-slate-400">${m.name}</div></div>
            </div>
            <button onclick="deleteCustomMarker(${idx})" class="text-[10px] text-rose-400 hover:underline">Delete</button>
        </div>
    `).join('');
}
