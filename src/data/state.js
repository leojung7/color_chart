import { masterMarkers } from './masterCatalog.js';

let cachedMarkers = null;

export const defaultState = {
    selectedSets: ["320"],
    swatched: {},
    favorites: {},
    ink: {},
    usage: {},
    tray: [],
    customMarkers: [],
    glazeHistory: [],
    palettes: [{ name: "Sakura Blush Triad", codes: ["R22", "R23", "R38"] }]
};

function loadInitialState() {
    try {
        const parsed = JSON.parse(localStorage.getItem('ohuhu_ultimate_v5') || 'null');
        if (!parsed) return structuredClone(defaultState);
        return {
            selectedSets: Array.isArray(parsed.selectedSets) && parsed.selectedSets.length ? parsed.selectedSets : ["320"],
            swatched: parsed.swatched || {},
            favorites: parsed.favorites || {},
            ink: parsed.ink || {},
            usage: parsed.usage || {},
            tray: Array.isArray(parsed.tray) ? parsed.tray : [],
            customMarkers: Array.isArray(parsed.customMarkers) ? parsed.customMarkers : [],
            glazeHistory: Array.isArray(parsed.glazeHistory) ? parsed.glazeHistory : [],
            palettes: Array.isArray(parsed.palettes) ? parsed.palettes : structuredClone(defaultState.palettes)
        };
    } catch (e) {
        return structuredClone(defaultState);
    }
}

export let state = loadInitialState();

export function replaceState(newState) {
    state = newState;
    saveState();
}

export function saveState() {
    cachedMarkers = null;
    localStorage.setItem('ohuhu_ultimate_v5', JSON.stringify(state));
}

export function getAllMarkers() {
    if (!cachedMarkers) {
        cachedMarkers = [...masterMarkers, ...(state.customMarkers || [])];
    }
    return cachedMarkers;
}

export function trackUsage(code) {
    state.usage[code] = (state.usage[code] || 0) + 1;
    saveState();
}
