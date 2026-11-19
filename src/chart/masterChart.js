import { state, saveState, getAllMarkers } from '../data/state.js';
import { getLuma, getTemperature } from '../data/colorMath.js';
import { availableSets, familyTitles } from '../catalog/catalogConfig.js';
import { renderTray } from '../tray/blendingTray.js';
import { renderFavoritesTab } from '../favorites/favoritesTab.js';
import { renderOrganizerMap } from '../organizer/organizerMap.js';

let searchTimeout = null;

export function renderSetCheckboxes() {
    const el = document.getElementById('setCheckboxes');
    if (!el) return;
    el.innerHTML = availableSets.map(s => {
        const active = state.selectedSets.includes(s.id);
        return `<button onclick="toggleSet('${s.id}')" class="px-2.5 py-1 rounded-lg text-xs font-medium border transition ${active ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">${active ? '✓ ' : '+ '}${s.label}</button>`;
    }).join('');
}

export function toggleSet(id) {
    if (state.selectedSets.includes(id)) {
        if (state.selectedSets.length > 1) state.selectedSets = state.selectedSets.filter(s => s !== id);
    } else {
        state.selectedSets.push(id);
    }
    saveState();
    renderSetCheckboxes();
    renderChart();
    renderOrganizerMap();
}

export function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderChart(), 150);
}

export function getFilteredMarkers() {
    const modeEl = document.getElementById('ownershipMode');
    const tempEl = document.getElementById('tempFilter');
    const searchEl = document.getElementById('searchInput');
    const famEl = document.getElementById('familyFilter');

    const mode = modeEl ? modeEl.value : 'owned';
    const temp = tempEl ? tempEl.value : 'ALL';
    const query = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const famFilter = famEl ? famEl.value : 'ALL';

    return getAllMarkers().filter(m => {
        const overlapCount = m.sets ? m.sets.filter(s => state.selectedSets.includes(s)).length : 1;
        const inkPct = state.ink[m.code] !== undefined ? state.ink[m.code] : 100;

        if (mode === 'owned' && m.sets && overlapCount === 0) return false;
        if (mode === 'missing' && m.sets && overlapCount > 0) return false;
        if (mode === 'low_ink' && inkPct > 25) return false;
        if (famFilter !== 'ALL' && m.fam !== famFilter) return false;
        if (temp !== 'ALL' && getTemperature(m) !== temp) return false;

        if (query) {
            const matchCode = m.code.toLowerCase().includes(query);
            const matchName = m.name.toLowerCase().includes(query);
            const matchOld = (m.old || '').toLowerCase().includes(query);
            const matchCopic = (m.copic || '').toLowerCase().includes(query);
            if (!matchCode && !matchName && !matchOld && !matchCopic) return false;
        }
        return true;
    });
}

export function renderChart() {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    const modeEl = document.getElementById('ownershipMode');
    const mode = modeEl ? modeEl.value : 'owned';
    const all = getAllMarkers();

    const lowCount = all.filter(m => (state.ink[m.code] !== undefined ? state.ink[m.code] : 100) <= 25).length;
    const refillEl = document.getElementById('refillCount');
    if (refillEl) refillEl.innerText = lowCount;

    const favCount = Object.keys(state.favorites || {}).filter(c => state.favorites[c]).length;
    const favNavEl = document.getElementById('favCountNav');
    if (favNavEl) favNavEl.innerText = favCount;

    const list = getFilteredMarkers();
    const statsEl = document.getElementById('statsSummary');
    const progressEl = document.getElementById('swatchProgress');
    if (statsEl) statsEl.innerText = `Displaying ${list.length} markers`;
    if (progressEl) progressEl.innerText = `Swatched: ${list.filter(m => state.swatched[m.code]).length} / ${list.length}`;

    if (list.length === 0) {
        container.innerHTML = `<div class="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-xs text-slate-400">No markers match the current filters.</div>`;
        return;
    }

    const grouped = {};
    list.forEach(m => { if (!grouped[m.fam]) grouped[m.fam] = []; grouped[m.fam].push(m); });

    container.innerHTML = Object.entries(grouped).map(([fam, markers]) => `
        <div class="border border-slate-500/20 rounded-xl p-4">
            <h3 class="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">${familyTitles[fam] || fam}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                ${markers.map(m => renderSwatchCard(m, mode)).join('')}
            </div>
        </div>
    `).join('');
}

export function renderSwatchCard(m, mode) {
    const isSwatched = !!state.swatched[m.code];
    const isFav = !!state.favorites[m.code];
    const inkPct = state.ink[m.code] !== undefined ? state.ink[m.code] : 100;
    const overlapCount = m.sets ? m.sets.filter(s => state.selectedSets.includes(s)).length : 1;
    const isDup = mode === 'duplicates' && overlapCount > 1;

    const inkColor = inkPct === 0 ? 'text-rose-400 font-bold' : inkPct <= 25 ? 'text-amber-400 font-bold' : 'opacity-65';
    const inkLabel = inkPct === 0 ? 'EMPTY' : `${inkPct}%`;

    return `
        <div class="swatch-card rounded-lg p-2.5 border ${isDup ? 'border-amber-400 ring-1 ring-amber-400/50' : isSwatched ? 'border-emerald-500/70' : 'border-slate-500/30'} flex flex-col justify-between select-none bg-slate-950/60">
            <div>
                <div class="swatch-dye h-9 rounded-md mb-2 flex items-center justify-between px-2 shadow-inner cursor-pointer" onclick="toggleSwatch('${m.code}')" style="background-color:${m.hex}">
                    <button onclick="event.stopPropagation();toggleFavorite('${m.code}')" class="text-xs ${isFav ? 'text-amber-300 drop-shadow' : 'text-slate-900/40 hover:text-slate-900'}">★</button>
                    ${isSwatched ? '<span class="bg-emerald-600 text-white text-[9px] font-bold px-1 rounded">✓</span>' : ''}
                </div>
                <div class="flex items-baseline justify-between cursor-pointer" onclick="toggleSwatch('${m.code}')">
                    <span class="text-xs font-bold mono">${m.code}</span>
                    <span class="text-[9px] mono opacity-60">C:${m.copic || '-'}</span>
                </div>
                <div class="text-[11px] opacity-80 truncate">${m.name}</div>
                <div class="text-[9px] mono opacity-50">Old: ${m.old || '-'}</div>
            </div>
            <div class="mt-2 pt-1.5 border-t border-slate-500/20 flex items-center justify-between">
                <button onclick="cycleInkPct('${m.code}')" title="Cycle Ink Percentage" class="text-[9px] mono ${inkColor}">💧${inkLabel}</button>
                <button onclick="autoBlend('${m.code}')" title="3-Marker Shading Blend" class="text-[10px] font-semibold text-amber-500 hover:underline">Blend</button>
                <button onclick="addToTray('${m.code}')" class="text-[10px] font-semibold text-indigo-400 hover:underline">+ Tray</button>
            </div>
        </div>
    `;
}

export function toggleSwatch(code) {
    state.swatched[code] = !state.swatched[code];
    saveState();
    renderChart();
    renderFavoritesTab();
}

export function toggleFavorite(code) {
    state.favorites[code] = !state.favorites[code];
    saveState();
    renderChart();
    renderFavoritesTab();
}

export function bulkSwatchVisible(val) {
    const visible = getFilteredMarkers();
    visible.forEach(m => { state.swatched[m.code] = val; });
    saveState();
    renderChart();
}

export function cycleInkPct(code) {
    const steps = [100, 75, 50, 25, 10, 0];
    const cur = state.ink[code] !== undefined ? state.ink[code] : 100;
    state.ink[code] = steps[(steps.indexOf(cur) + 1) % steps.length];
    saveState();
    renderChart();
    renderFavoritesTab();
}

export function copyRefillList() {
    const low = getAllMarkers().filter(m => (state.ink[m.code] !== undefined ? state.ink[m.code] : 100) <= 25);
    if (low.length === 0) return alert("No markers are at 25% ink or lower.");
    const txt = "Ohuhu Refill List:\n" + low.map(m => `- ${m.code} (Old: ${m.old}) ${m.name} [${state.ink[m.code] ?? 100}%]`).join("\n");
    navigator.clipboard.writeText(txt);
    alert(`Copied ${low.length} low/empty markers!`);
}

export function generateBlendRecipe(code) {
    const target = getAllMarkers().find(m => m.code === code);
    if (!target) return null;
    const family = getAllMarkers()
        .filter(m => m.fam === target.fam && m.code !== "0")
        .sort((a, b) => getLuma(b.hex) - getLuma(a.hex));
    const i = family.findIndex(m => m.code === code);
    return {
        highlight: family[Math.max(0, i - 2)],
        light: family[Math.max(0, i - 1)],
        base: target,
        dark: family[Math.min(family.length - 1, i + 1)],
        shadow: family[Math.min(family.length - 1, i + 2)]
    };
}

export function autoBlend(code) {
    const recipe = generateBlendRecipe(code);
    if (!recipe) return;
    const triad = Array.from(new Set([recipe.light.code, recipe.base.code, recipe.dark.code]));
    state.tray = triad;
    saveState();
    renderTray();
}
