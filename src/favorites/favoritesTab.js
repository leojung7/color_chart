import { state, getAllMarkers } from '../data/state.js';
import { renderSwatchCard } from '../chart/masterChart.js';

export function renderFavoritesTab() {
    const container = document.getElementById('favoritesContainer');
    const favCodes = Object.keys(state.favorites || {}).filter(c => state.favorites[c]);
    const all = getAllMarkers();
    const favMarkers = all.filter(m => favCodes.includes(m.code));

    const favCountNav = document.getElementById('favCountNav');
    if (favCountNav) favCountNav.innerText = favMarkers.length;

    if (!container) return;
    if (!favMarkers.length) {
        container.innerHTML = `<div class="text-xs text-slate-500 col-span-full">No favorite markers starred yet. Click the star (★) on any swatch card.</div>`;
        return;
    }
    container.innerHTML = favMarkers.map(m => renderSwatchCard(m, 'owned')).join('');
}
