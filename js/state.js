/**
 * Centralized reactive application state and safe localStorage persistence.
 * Ensures catalog definitions are never corrupted or masked by stale storage.
 */

const STORAGE_KEY = 'ohuhu_organizer_state_v2';
const LEGACY_KEYS = ['ohuhu_state', 'ohuhuMarkers', 'selectedSets', 'ohuhu_catalog'];

const defaultState = {
    selectedSets: ['320'],
    ownershipMode: 'any', // 'any' | 'all' | 'exclusive'
    familyFilter: 'ALL',
    temperatureFilter: 'ALL',
    searchText: '',
    activeTab: 'catalog', // 'catalog' | 'organizer' | 'debug'
    caseLayout: '2x160', // '2x160' | '4x80'
    importedMarkers: [] // Stored separately; never overwrites built-in master catalog
};

class Store {
    constructor() {
        this.listeners = new Set();
        this.state = this.loadState();
    }

    loadState() {
        // Purge legacy keys that previously masked catalog updates
        for (const legacyKey of LEGACY_KEYS) {
            if (localStorage.getItem(legacyKey) !== null) {
                console.info(`[State] Purging legacy localStorage key: ${legacyKey}`);
                localStorage.removeItem(legacyKey);
            }
        }

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultState };
            const parsed = JSON.parse(raw);

            // Guard against corrupted or empty selectedSets
            const validSets = Array.isArray(parsed.selectedSets) && parsed.selectedSets.length > 0
                ? parsed.selectedSets.map(String)
                : ['320'];

            return {
                ...defaultState,
                ...parsed,
                selectedSets: validSets,
                importedMarkers: Array.isArray(parsed.importedMarkers) ? parsed.importedMarkers : []
            };
        } catch (err) {
            console.warn('[State] Failed to parse saved state; resetting to defaults.', err);
            return { ...defaultState };
        }
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (err) {
            console.error('[State] Failed to persist state:', err);
        }
    }

    getState() {
        return this.state;
    }

    setState(partial) {
        this.state = { ...this.state, ...partial };
        this.saveState();
        this.notify();
    }

    resetFilters() {
        this.setState({
            selectedSets: ['320'],
            ownershipMode: 'any',
            familyFilter: 'ALL',
            temperatureFilter: 'ALL',
            searchText: ''
        });
    }

    resetImportedCatalog() {
        this.setState({ importedMarkers: [] });
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    notify() {
        for (const fn of this.listeners) {
            fn(this.state);
        }
    }
}

export const store = new Store();
