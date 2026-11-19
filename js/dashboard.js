/**
 * UI rendering module for catalog grid, filters, conflict banners, and debug console.
 */
import { getContrastColor, classifyTemperature } from './color-utils.js';
import { renderOrganizerView } from './organizer.js';
import { generateDeveloperCatalogReport } from './catalog.js';

const FAMILIES = ['ALL', 'R', 'YR', 'Y', 'YG', 'G', 'BG', 'B', 'BV', 'V', 'RV', 'E', 'GREY', '0'];

export function renderSetPills(container, sets, selectedSets, onToggleSet) {
    container.innerHTML = sets.map(s => {
        const isActive = selectedSets.includes(s.id);
        return `<button type="button" class="pill ${isActive ? 'active' : ''}" data-set="${s.id}">
            ${s.label} (${s.expectedCount})
        </button>`;
    }).join('');

    container.querySelectorAll('.pill').forEach(btn => {
        btn.addEventListener('click', () => onToggleSet(btn.dataset.set));
    });
}

export function renderFamilyPills(container, activeFamily, onSelectFamily) {
    container.innerHTML = FAMILIES.map(fam => `
        <button type="button" class="pill ${activeFamily === fam ? 'active' : ''}" data-fam="${fam}">
            ${fam}
        </button>
    `).join('');

    container.querySelectorAll('.pill').forEach(btn => {
        btn.addEventListener('click', () => onSelectFamily(btn.dataset.fam));
    });
}

export function renderMainContent(container, state, filterResult, activeCatalog) {
    if (state.activeTab === 'organizer') {
        renderOrganizerView(container, filterResult.markers, state.caseLayout);
        return;
    }

    if (state.activeTab === 'debug') {
        const report = generateDeveloperCatalogReport(state.importedMarkers);
        report.filterPipelineTelemetry = filterResult.telemetry;
        container.innerHTML = `<div class="debug-panel">${JSON.stringify(report, null, 2)}</div>`;
        return;
    }

    if (filterResult.markers.length === 0) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:#64748b;">
            No markers match current filter criteria. Try resetting filters.
        </div>`;
        return;
    }

    container.innerHTML = `
        <div class="marker-grid">
            ${filterResult.markers.map(m => {
                const fg = getContrastColor(m.hex);
                const temp = classifyTemperature(m);
                return `
                    <article class="marker-card">
                        <div class="swatch" style="background:${m.hex}; color:${fg};">
                            <span>${m.code}</span>
                            <span style="font-size:0.7rem; opacity:0.85;">${m.fam}</span>
                        </div>
                        <div class="card-body">
                            <div class="card-title">${m.name}</div>
                            <div class="card-meta">Old: ${m.old || '—'} · Copic: ${m.copic || '—'} · ${temp}</div>
                            <div class="badge-row">
                                ${m.sets.map(s => `<span class="badge">${s}</span>`).join('')}
                                ${m.hasConflict ? `<span class="badge badge-conflict" title="Built-in record preserved over conflicting import">Import Conflict</span>` : ''}
                            </div>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}
