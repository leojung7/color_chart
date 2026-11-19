import { state, replaceState } from '../data/state.js';

export function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "ohuhu-ultimate-backup.json";
    a.click();
}

export function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
        try {
            const parsed = JSON.parse(ev.target.result);
            const required = ['selectedSets', 'swatched', 'ink', 'customMarkers', 'palettes'];
            const valid = required.every(k => parsed && Object.prototype.hasOwnProperty.call(parsed, k));
            if (!valid) {
                return alert("Backup missing required fields.");
            }
            if (!Array.isArray(parsed.tray)) parsed.tray = [];
            if (!parsed.favorites) parsed.favorites = {};
            if (!parsed.usage) parsed.usage = {};
            if (!Array.isArray(parsed.glazeHistory)) parsed.glazeHistory = [];
            replaceState(parsed);
            location.reload();
        } catch (err) {
            alert("Backup missing required fields.");
        }
    };
    r.readAsText(file);
}
