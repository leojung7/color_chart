/**
 * Catalog loader, validator, safe import merger, and developer diagnostics.
 */
import { isValidHex, classifyTemperature } from './color-utils.js';

const VALID_FAMILIES = new Set(['R', 'YR', 'Y', 'YG', 'G', 'BG', 'B', 'BV', 'V', 'RV', 'E', 'GREY', '0']);

let builtInMarkers = [];
let availableSets = [];
let lastValidationReport = null;
let mergedCatalogCache = null;
let lastImportedRef = null;

export async function loadCatalogData() {
    const [markersRes, setsRes] = await Promise.all([
        fetch('./data/markers.json'),
        fetch('./data/sets.json')
    ]);

    if (!markersRes.ok || !setsRes.ok) {
        throw new Error('Failed to load catalog JSON files from ./data/');
    }

    const rawMarkers = await markersRes.json();
    availableSets = await setsRes.json();

    // Run automatic startup validation
    lastValidationReport = validateCatalogRecords(rawMarkers, availableSets);
    console.groupCollapsed('[Catalog] Startup Validation Report');
    console.table({
        totalRecords: lastValidationReport.totalRecords,
        uniqueCodes: lastValidationReport.uniqueCodes,
        duplicateCodes: lastValidationReport.duplicateCodes.length,
        invalidHexValues: lastValidationReport.invalidHexValues.length,
        missingSetMemberships: lastValidationReport.missingSetMemberships.length,
        invalidFamilies: lastValidationReport.invalidFamilies.length,
        malformedRecords: lastValidationReport.malformedRecords.length
    });
    console.groupEnd();

    // Deduplicate built-in records safely (first canonical entry wins, sets unioned)
    const dedupMap = new Map();
    for (const item of rawMarkers) {
        if (!item || typeof item.code !== 'string') continue;
        const code = item.code.trim();
        if (!dedupMap.has(code)) {
            dedupMap.set(code, {
                ...item,
                code,
                sets: Array.isArray(item.sets) ? [...new Set(item.sets.map(String))] : [],
                source: 'builtin'
            });
        } else {
            const existing = dedupMap.get(code);
            const incomingSets = Array.isArray(item.sets) ? item.sets.map(String) : [];
            existing.sets = [...new Set([...existing.sets, ...incomingSets])];
        }
    }

    builtInMarkers = Array.from(dedupMap.values());
    mergedCatalogCache = null;
    return { builtInMarkers, availableSets, validationReport: lastValidationReport };
}

export function getAvailableSets() {
    return availableSets;
}

export function getValidationReport() {
    return lastValidationReport;
}

export function validateCatalogRecords(records, setsMeta = []) {
    const validSetIds = new Set(setsMeta.map(s => s.id));
    const seenCodes = new Set();
    const duplicateCodes = [];
    const invalidHexValues = [];
    const missingSetMemberships = [];
    const invalidFamilies = [];
    const malformedRecords = [];

    records.forEach((rec, idx) => {
        if (!rec || typeof rec !== 'object' || !rec.code || !rec.name) {
            malformedRecords.push({ index: idx, record: rec });
            return;
        }
        const code = String(rec.code).trim();
        if (seenCodes.has(code)) {
            duplicateCodes.push(code);
        } else {
            seenCodes.add(code);
        }

        if (!isValidHex(rec.hex)) {
            invalidHexValues.push({ code, hex: rec.hex });
        }

        if (!Array.isArray(rec.sets) || rec.sets.length === 0) {
            missingSetMemberships.push({ code, sets: rec.sets });
        } else if (validSetIds.size > 0) {
            const unknown = rec.sets.filter(s => !validSetIds.has(s));
            if (unknown.length > 0) {
                missingSetMemberships.push({ code, unknownSets: unknown });
            }
        }

        if (!VALID_FAMILIES.has(rec.fam)) {
            invalidFamilies.push({ code, fam: rec.fam });
        }
    });

    return {
        totalRecords: records.length,
        uniqueCodes: seenCodes.size,
        duplicateCodes,
        invalidHexValues,
        missingSetMemberships,
        invalidFamilies,
        malformedRecords
    };
}

/**
 * Safely merges imported markers without silently overriding built-in catalog data.
 */
export function getActiveCatalog(importedMarkers = []) {
    if (mergedCatalogCache && lastImportedRef === importedMarkers) {
        return mergedCatalogCache;
    }

    const builtInMap = new Map(builtInMarkers.map(m => [m.code, m]));
    const result = builtInMarkers.map(m => ({ ...m, hasConflict: false }));
    const resultIndexMap = new Map(result.map((m, idx) => [m.code, idx]));

    const conflicts = [];
    const addedCustom = [];

    if (Array.isArray(importedMarkers)) {
        for (const imp of importedMarkers) {
            if (!imp || typeof imp.code !== 'string' || !imp.code.trim()) continue;
            const code = imp.code.trim();

            if (builtInMap.has(code)) {
                // Never overwrite built-in record; flag conflict for user review
                const idx = resultIndexMap.get(code);
                result[idx].hasConflict = true;
                result[idx].conflictDetail = imp;
                conflicts.push({
                    code,
                    builtInName: builtInMap.get(code).name,
                    importedName: imp.name || '(unnamed)'
                });
            } else if (!resultIndexMap.has(code)) {
                const customEntry = {
                    code,
                    old: imp.old || '',
                    copic: imp.copic || '',
                    name: imp.name || `Custom ${code}`,
                    hex: isValidHex(imp.hex) ? imp.hex : '#94a3b8',
                    fam: VALID_FAMILIES.has(imp.fam) ? imp.fam : '0',
                    sets: Array.isArray(imp.sets) && imp.sets.length ? imp.sets.map(String) : ['CUSTOM'],
                    source: 'imported',
                    hasConflict: false
                };
                resultIndexMap.set(code, result.length);
                result.push(customEntry);
                addedCustom.push(code);
            }
        }
    }

    mergedCatalogCache = {
        markers: result,
        conflicts,
        addedCustomCount: addedCustom.length
    };
    lastImportedRef = importedMarkers;
    return mergedCatalogCache;
}

export function validateImportPayload(rawJson) {
    let parsed;
    try {
        parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    } catch (e) {
        return { valid: false, error: 'Invalid JSON syntax.' };
    }

    const list = Array.isArray(parsed) ? parsed : parsed?.markers;
    if (!Array.isArray(list)) {
        return { valid: false, error: 'JSON must be an array of marker objects or { "markers": [...] }.' };
    }

    const builtInCodes = new Set(builtInMarkers.map(m => m.code));
    const seenInImport = new Set();
    const validRecords = [];
    const conflicts = [];
    const duplicatesInFile = [];
    const invalidRecords = [];

    for (const item of list) {
        if (!item || typeof item.code !== 'string' || !item.code.trim()) {
            invalidRecords.push(item);
            continue;
        }
        const code = item.code.trim();
        if (seenInImport.has(code)) {
            duplicatesInFile.push(code);
            continue;
        }
        seenInImport.add(code);

        if (builtInCodes.has(code)) {
            conflicts.push(code);
        }
        validRecords.push(item);
    }

    return {
        valid: true,
        records: validRecords,
        conflicts,
        duplicatesInFile,
        invalidRecords
    };
}

/**
 * Developer-only diagnostic report.
 */
export function generateDeveloperCatalogReport(importedMarkers = []) {
    const { markers, conflicts, addedCustomCount } = getActiveCatalog(importedMarkers);
    const setCounts = {};
    const familyCounts = {};
    const tempCounts = { warm: 0, cool: 0, neutral: 0 };

    for (const s of availableSets) {
        setCounts[s.id] = 0;
    }

    for (const m of markers) {
        for (const s of m.sets) {
            setCounts[s] = (setCounts[s] || 0) + 1;
        }
        familyCounts[m.fam] = (familyCounts[m.fam] || 0) + 1;
        const temp = classifyTemperature(m);
        tempCounts[temp] = (tempCounts[temp] || 0) + 1;
    }

    return {
        timestamp: new Date().toISOString(),
        startupValidation: lastValidationReport,
        activeSummary: {
            totalActiveMarkers: markers.length,
            builtInCount: builtInMarkers.length,
            customImportedCount: addedCustomCount,
            importConflictsBlocked: conflicts.length
        },
        countBySet: setCounts,
        countByFamily: familyCounts,
        countByTemperature: tempCounts
    };
}
