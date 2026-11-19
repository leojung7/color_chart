import { state, getAllMarkers } from '../data/state.js';
import { getHue, getLuma } from '../data/colorMath.js';

function getSortedOwned() {
    const famOrder = ["R", "YR", "Y", "YG", "G", "BG", "B", "BV", "V", "RV", "E", "GREY", "0"];
    return getAllMarkers()
        .filter(m => !m.sets || m.sets.some(s => state.selectedSets.includes(s)))
        .sort((a, b) => {
            const fDiff = famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam);
            if (fDiff !== 0) return fDiff;
            const hDiff = Math.round(getHue(a.hex) / 15) - Math.round(getHue(b.hex) / 15);
            if (hDiff !== 0) return hDiff;
            return getLuma(b.hex) - getLuma(a.hex);
        });
}

export function renderOrganizerMap() {
    const colsEl = document.getElementById('gridColsSelect');
    const grid = document.getElementById('organizerGrid');
    if (!grid) return;

    const cols = colsEl ? parseInt(colsEl.value) : 10;
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    const owned = getSortedOwned();
    grid.innerHTML = owned.map((m, idx) => {
        const row = Math.floor(idx / cols) + 1, col = (idx % cols) + 1;
        return `
            <div id="slot-${m.code}" class="rounded p-1.5 border border-slate-800 bg-slate-950 flex flex-col items-center text-center transition">
                <span class="w-full h-4 rounded-sm mb-1" style="background-color:${m.hex}"></span>
                <span class="text-[10px] font-bold mono">${m.code}</span>
                <span class="text-[8px] text-slate-500">R${row}:C${col}</span>
            </div>
        `;
    }).join('');
}

export function findMarkerLocation() {
    const inputEl = document.getElementById('findMarkerInput');
    const colsEl = document.getElementById('gridColsSelect');
    const resEl = document.getElementById('findLocationResult');
    if (!inputEl || !resEl) return;

    const q = inputEl.value.trim().toUpperCase();
    const cols = colsEl ? parseInt(colsEl.value) : 10;
    const owned = getSortedOwned();

    const idx = owned.findIndex(m => m.code === q);
    if (idx === -1) {
        resEl.innerText = `Marker "${q}" not found in owned collection.`;
        return;
    }
    const row = Math.floor(idx / cols) + 1, col = (idx % cols) + 1;
    resEl.innerText = `Marker ${q} is located at Row ${row}, Column ${col}.`;
    const slot = document.getElementById(`slot-${q}`);
    if (slot) {
        slot.classList.add('border-indigo-500', 'ring-2', 'ring-indigo-500');
        slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => slot.classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-500'), 3000);
    }
}
