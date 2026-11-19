export const MAX_PALETTES = 100;

export const availableSets = [
    { id: "320", label: "320 Master Set" }, { id: "216", label: "216 Set" },
    { id: "168", label: "168 Set" }, { id: "120", label: "120 Set" },
    { id: "104", label: "104 Set" }, { id: "80", label: "80 Set" },
    { id: "48", label: "48 Set" }, { id: "PASTEL48", label: "48 Pastels" },
    { id: "MID48", label: "48 Mid-Tones" }, { id: "SKIN36", label: "36 Skin Tones" }
];

export const familyTitles = {
    "R": "Reds (R)", "YR": "Yellow-Reds & Oranges (YR)", "Y": "Yellows (Y)",
    "YG": "Yellow-Greens (YG)", "G": "Greens (G)", "BG": "Blue-Greens (BG)",
    "B": "Blues (B)", "BV": "Blue-Violets (BV)", "V": "Violets (V)",
    "RV": "Red-Violets (RV)", "E": "Earth Tones (E)", "GREY": "Neutral & Tinted Greys",
    "0": "Achromatics & Blender"
};

export const moodPalettes = {
    cyberpunk: ["RV18", "BG211", "B09", "V112"],
    sunset: ["YR19", "YR38", "R210", "Y08"],
    fantasy: ["V07", "BV03", "RV18", "BG04"],
    forest: ["G012", "YG36", "E44", "G312"],
    ocean: ["BG211", "B02", "B09", "BG04"]
};

export const presetPalettes = {
    skin: ["E44", "YR37", "R12", "R22"],
    hair: ["Y110", "YR38", "E515", "YGY11"],
    eyes: ["BG011", "G312", "YR19", "BV312"],
    anime: ["RV18", "BG211", "V07", "R23"],
    floral: ["R23", "Y08", "V07", "G012"],
    seasonal: ["YR19", "G312", "B09", "E44"]
};
