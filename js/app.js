/**
 * Application bootstrapper and event coordinator.
 */
import { store } from './state.js';
import {
    loadCatalogData,
    getAvailableSets,
    getActiveCatalog,
    validateImportPayload
} from './catalog.js';
import { getFilteredMarkers } from './filters.js';
import { renderSetPills, renderFamilyPills, renderMainContent } from './dashboard.js';

async function init() {
    const contentEl = document.getElementById('main-content');
    try {
        const { validationReport } = await loadCatalogData();

        if (validationReport.malformedRecords.length > 0 || validationReport.invalidHexValues.length > 0) {
            showBanner('errorBanner', `Catalog startup audit detected ${validationReport.malformedRecords.length} malformed records and ${validationReport.invalidHexValues.length} invalid hex codes.`);
        }

        bindStaticControls();
        store.subscribe(render);
        render(store.getState());
    } catch (err) {
        console.error(err);
        contentEl.innerHTML = `<div style="color:#dc2626; padding:2rem;">Error initializing catalog: ${err.message}</div>`;
    }
}

function showBanner(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelector('.banner-text').textContent = message;
    el.classList.add('visible');
}

function bindStaticControls() {
    document.getElementById('ownershipMode').addEventListener('change', e => {
        store.setState({ ownershipMode: e.target.value });
    });

    document.getElementById('temperatureFilter').addEventListener('change', e => {
        store.setState({ temperatureFilter: e.target.value });
    });

    document.getElementById('searchInput').addEventListener('input', e => {
        store.setState({ searchText: e.target.value });
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        store.resetFilters();
    });

    document.getElementById('resetImportBtn').addEventListener('click', () => {
        store.resetImportedCatalog();
        document.getElementById('conflictBanner').classList.remove('visible');
    });

    document.getElementById('importFileInput').addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const check = validateImportPayload(text);
        if (!check.valid) {
            alert(`Import rejected: ${check.error}`);
            e.target.value = '';
            return;
        }
        store.setState({ importedMarkers: check.records });
        if (check.conflicts.length > 0) {
            showBanner(
                'conflictBanner',
                `Safe Import: ${check.conflicts.length} imported code(s) conflicted with built-in markers (${check.conflicts.slice(0, 5).join(', ')}...) and were blocked from overriding master data.`
            );
        }
        e.target.value = '';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            store.setState({ activeTab: btn.dataset.tab });
        });
    });
}

function render(state) {
    const activeCatalog = getActiveCatalog(state.importedMarkers);
    const filterResult = getFilteredMarkers(activeCatalog.markers, state);

    // Sync controls
    document.getElementById('ownershipMode').value = state.ownershipMode;
    document.getElementById('temperatureFilter').value = state.temperatureFilter;
    document.getElementById('searchInput').value = state.searchText;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });

    renderSetPills(
        document.getElementById('setPills'),
        getAvailableSets(),
        state.selectedSets,
        setId => {
            const exists = state.selectedSets.includes(setId);
            const next = exists
                ? state.selectedSets.filter(s => s !== setId)
                : [...state.selectedSets, setId];
            store.setState({ selectedSets: next.length ? next : ['320'] });
        }
    );

    renderFamilyPills(
        document.getElementById('familyPills'),
        state.familyFilter,
        fam => store.setState({ familyFilter: fam })
    );

    const { raw, afterOwnership, afterFamily, afterTemperature, afterSearch } = filterResult.telemetry;
    document.getElementById('statsSummary').textContent =
        `Displaying ${afterSearch} markers (Raw: ${raw} → Set Filter: ${afterOwnership} → Family: ${afterFamily} → Temp: ${afterTemperature})`;

    document.getElementById('resetImportBtn').style.display =
        state.importedMarkers.length > 0 ? 'inline-block' : 'none';

    renderMainContent(
        document.getElementById('main-content'),
        state,
        filterResult,
        activeCatalog
    );
}

init();
