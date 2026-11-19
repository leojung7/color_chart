import { state, saveState } from './data/state.js';
import {
    renderSetCheckboxes,
    toggleSet,
    debouncedSearch,
    renderChart,
    toggleSwatch,
    toggleFavorite,
    bulkSwatchVisible,
    cycleInkPct,
    copyRefillList,
    autoBlend
} from './chart/masterChart.js';
import {
    addToTray,
    removeFromTray,
    loadMoodPalette,
    renderTray,
    clearTray,
    copyPaletteCodes,
    saveCurrentTray,
    exportTrayPng,
    shareFullStateUrl
} from './tray/blendingTray.js';
import { renderFavoritesTab } from './favorites/favoritesTab.js';
import { renderValueMatrix, showSmartRecipe, loadRecipeToTray } from './matrix/valueMatrix.js';
import { updateGlazeLabUI, computeGlazeStack, saveGlazeRecipe, sendGlazeToTray } from './glaze/glazeLab.js';
import {
    loadPresetPalette,
    loadAllPresetToTray,
    analyzeWheelColor,
    generateFisherYatesChallenge,
    loadDailyChallenge
} from './wheel/colorWheelStudio.js';
import { handleImageUpload, pickColorFromCanvas } from './photo/photoMatcher.js';
import { renderDashboard } from './dashboard/dashboard.js';
import { renderOrganizerMap, findMarkerLocation } from './organizer/organizerMap.js';
import { addCustomMarker, deleteCustomMarker, renderCustomMarkers } from './custom/customMarkers.js';
import { loadSavedPalette, deleteSavedPalette, renderSavedPalettes } from './palette/savedPalettes.js';
import { exportBackup, importBackup } from './backup/backupSync.js';

function changePaper(c) {
    const body = document.getElementById('appBody');
    body.classList.remove('paper-dark', 'paper-white', 'paper-cream', 'paper-tan');
    body.classList.add(c);
    const paperSelect = document.getElementById('paperSelect');
    if (paperSelect) paperSelect.value = c;
}

function changeAccessibility(f) {
    const body = document.getElementById('appBody');
    body.classList.remove('filter-greyscale', 'filter-deuteranopia', 'filter-high-contrast');
    if (f !== 'normal') body.classList.add(f);
}

function restoreFromHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#studio=')) {
        try {
            const data = JSON.parse(atob(hash.replace('#studio=', '')));
            if (Array.isArray(data.tray)) state.tray = data.tray;
            if (Array.isArray(data.sets)) state.selectedSets = data.sets;
            if (data.paper) changePaper(data.paper);
            saveState();
        } catch (e) { /* ignore malformed hash */ }
    }
}

function switchTab(t) {
    ['chart', 'favorites', 'matrix', 'glaze', 'wheel', 'dashboard', 'organizer'].forEach(id => {
        document.getElementById(`view-${id}`).classList.toggle('hidden', id !== t);
        document.getElementById(`tab-${id}`).className = id === t
            ? "px-3 py-1.5 rounded-lg bg-indigo-600 text-white transition"
            : "px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition";
    });
    if (t === 'favorites') renderFavoritesTab();
    if (t === 'matrix') renderValueMatrix();
    if (t === 'glaze') updateGlazeLabUI();
    if (t === 'wheel') { analyzeWheelColor('#3B82F6'); loadDailyChallenge(); }
    if (t === 'dashboard') renderDashboard();
    if (t === 'organizer') { renderOrganizerMap(); renderCustomMarkers(); renderSavedPalettes(); }
}

// Expose handlers globally for inline HTML attributes
Object.assign(window, {
    switchTab,
    changePaper,
    changeAccessibility,
    toggleSet,
    debouncedSearch,
    renderChart,
    toggleSwatch,
    toggleFavorite,
    bulkSwatchVisible,
    cycleInkPct,
    copyRefillList,
    autoBlend,
    addToTray,
    removeFromTray,
    loadMoodPalette,
    clearTray,
    copyPaletteCodes,
    saveCurrentTray,
    exportTrayPng,
    shareFullStateUrl,
    showSmartRecipe,
    loadRecipeToTray,
    updateGlazeLabUI,
    computeGlazeStack,
    saveGlazeRecipe,
    sendGlazeToTray,
    loadPresetPalette,
    loadAllPresetToTray,
    analyzeWheelColor,
    generateFisherYatesChallenge,
    loadDailyChallenge,
    handleImageUpload,
    pickColorFromCanvas,
    renderOrganizerMap,
    findMarkerLocation,
    addCustomMarker,
    deleteCustomMarker,
    loadSavedPalette,
    deleteSavedPalette,
    exportBackup,
    importBackup
});

// Initialize Studio
restoreFromHash();
renderSetCheckboxes();
renderChart();
renderTray();
