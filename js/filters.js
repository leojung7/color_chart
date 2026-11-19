/**
 * Memoized multi-stage marker filtering pipeline with stage telemetry.
 */
import { classifyTemperature } from './color-utils.js';

let cachedKey = null;
let cachedResult = null;

export function getFilteredMarkers(markers, state) {
    const key = JSON.stringify({
        len: markers.length,
        selectedSets: state.selectedSets,
        ownershipMode: state.ownershipMode,
        familyFilter: state.familyFilter,
        temperatureFilter: state.temperatureFilter,
        searchText: state.searchText
    });

    if (cachedKey === key && cachedResult) {
        return cachedResult;
    }

    const telemetry = {
        raw: markers.length,
        afterOwnership: 0,
        afterFamily: 0,
        afterTemperature: 0,
        afterSearch: 0
    };

    // Stage 1: Set / Ownership Filter
    const selected = state.selectedSets || [];
    let stage1 = markers;
    if (selected.length > 0 && !selected.includes('ALL')) {
        stage1 = markers.filter(m => {
            const mSets = m.sets || [];
            if (state.ownershipMode === 'all') {
                return selected.every(s => mSets.includes(s));
            }
            if (state.ownershipMode === 'exclusive') {
                return mSets.some(s => selected.includes(s)) && mSets.every(s => selected.includes(s));
            }
            // Default 'any' (union of selected sets)
            return selected.some(s => mSets.includes(s));
        });
    }
    telemetry.afterOwnership = stage1.length;

    // Stage 2: Color Family Filter
    let stage2 = stage1;
    if (state.familyFilter && state.familyFilter !== 'ALL') {
        stage2 = stage1.filter(m => m.fam === state.familyFilter);
    }
    telemetry.afterFamily = stage2.length;

    // Stage 3: Temperature Filter
    let stage3 = stage2;
    if (state.temperatureFilter && state.temperatureFilter !== 'ALL') {
        stage3 = stage2.filter(m => classifyTemperature(m) === state.temperatureFilter);
    }
    telemetry.afterTemperature = stage3.length;

    // Stage 4: Search Query Filter
    let stage4 = stage3;
    const q = (state.searchText || '').trim().toLowerCase();
    if (q) {
        stage4 = stage3.filter(m =>
            m.code.toLowerCase().includes(q) ||
            (m.old && m.old.toLowerCase().includes(q)) ||
            (m.copic && m.copic.toLowerCase().includes(q)) ||
            m.name.toLowerCase().includes(q)
        );
    }
    telemetry.afterSearch = stage4.length;

    cachedKey = key;
    cachedResult = {
        markers: stage4,
        telemetry
    };

    return cachedResult;
}
