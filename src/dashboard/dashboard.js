import { state, getAllMarkers } from '../data/state.js';
import { MAX_PALETTES, familyTitles } from '../catalog/catalogConfig.js';

export function renderDashboard() {
    const all = getAllMarkers();
    const owned = all.filter(m => !m.sets || m.sets.some(s => state.selectedSets.includes(s)));
    const missing = all.filter(m => m.sets && !m.sets.some(s => state.selectedSets.includes(s)));
    const swatched = owned.filter(m => state.swatched[m.code]);
    const lowInk = owned.filter(m => (state.ink[m.code] !== undefined ? state.ink[m.code] : 100) <= 25);

    const statsEl = document.getElementById('dashboardStatsCards');
    if (statsEl) {
        statsEl.innerHTML = [
            { label: "Markers Owned", val: `${owned.length} / ${all.length}`, sub: `${Math.round((owned.length/all.length)*100)}% Complete` },
            { label: "Swatch Progress", val: `${swatched.length} / ${owned.length}`, sub: "Physical Swatching" },
            { label: "Low / Empty Ink", val: lowInk.length, sub: "Markers ≤25% Ink" },
            { label: "Saved Palettes", val: state.palettes.length, sub: `Max ${MAX_PALETTES}` }
        ].map(c => `
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div class="text-[11px] uppercase text-slate-400 font-semibold">${c.label}</div>
                <div class="text-xl font-bold text-slate-100 mt-1 mono">${c.val}</div>
                <div class="text-[10px] text-slate-500 mt-0.5">${c.sub}</div>
            </div>
        `).join('');
    }

    const families = ["R", "YR", "Y", "YG", "G", "BG", "B", "BV", "V", "RV", "E", "GREY"];
    const famGridEl = document.getElementById('familyCompletionGrid');
    if (famGridEl) {
        famGridEl.innerHTML = families.map(fam => {
            const famTotal = all.filter(m => m.fam === fam);
            const famOwned = famTotal.filter(m => !m.sets || m.sets.some(s => state.selectedSets.includes(s)));
            const pct = famTotal.length ? Math.round((famOwned.length / famTotal.length) * 100) : 0;
            return `
                <div class="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div class="flex justify-between text-xs font-bold mb-1"><span>${familyTitles[fam] || fam}</span><span class="text-indigo-400">${pct}%</span></div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div class="bg-indigo-600 h-full" style="width: ${pct}%"></div></div>
                    <div class="text-[10px] text-slate-500 mt-1">${famOwned.length} / ${famTotal.length} owned</div>
                </div>
            `;
        }).join('');
    }

    const top = Object.entries(state.usage || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topEl = document.getElementById('topMarkersList');
    if (topEl) {
        topEl.innerHTML = top.length
            ? top.map(([code, count]) => {
                const m = all.find(x => x.code === code);
                return `<div class="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800"><span class="mono font-bold">${code} ${m ? m.name : ''}</span><span class="text-indigo-400 font-bold">${count} uses</span></div>`;
            }).join('')
            : `<div class="text-slate-500">Use markers in your tray to build your usage heatmap.</div>`;
    }

    const famMissing = {};
    missing.forEach(m => { famMissing[m.fam] = (famMissing[m.fam] || 0) + 1; });
    const sortedMissing = Object.entries(famMissing).sort((a, b) => b[1] - a[1]);
    const advisorEl = document.getElementById('purchaseAdvisorList');
    if (advisorEl) {
        advisorEl.innerHTML = sortedMissing.length
            ? sortedMissing.map(([fam, cnt]) => `<div class="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800"><span class="font-bold">${familyTitles[fam] || fam}</span><span class="text-amber-400 font-bold">${cnt} missing</span></div>`).join('')
            : `<div class="text-emerald-400">You own the complete catalog!</div>`;
    }
}
