import { state, getAllMarkers } from '../data/state.js';
import { deltaE2000 } from '../data/colorMath.js';

export function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.classList.remove('hidden');
            document.getElementById('canvasPlaceholder').classList.add('hidden');
            extractTopColors(canvas, ctx);
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

export function extractTopColors(canvas, ctx) {
    const step = Math.max(1, Math.floor(canvas.width / 50));
    const colorCounts = {};
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const i = (y * canvas.width + x) * 4;
            const r = Math.min(255, Math.round(imgData[i] / 32) * 32);
            const g = Math.min(255, Math.round(imgData[i+1] / 32) * 32);
            const b = Math.min(255, Math.round(imgData[i+2] / 32) * 32);
            const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
    }
    const sorted = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const area = document.getElementById('extractedPaletteArea');
    area.classList.remove('hidden');
    const ownedOnly = document.getElementById('matchOwnedOnly').checked;
    const pool = getAllMarkers().filter(m => m.code !== "0" && (!ownedOnly || !m.sets || m.sets.some(s => state.selectedSets.includes(s))));

    document.getElementById('extractedColorsList').innerHTML = sorted.map(([hex]) => {
        let best = pool[0], bestD = Infinity;
        pool.forEach(m => {
            const d = deltaE2000(hex, m.hex);
            if (d < bestD) { bestD = d; best = m; }
        });
        return `
            <div onclick="addToTray('${best.code}')" class="cursor-pointer bg-slate-900 border border-slate-800 rounded p-1.5 text-center hover:border-indigo-500">
                <div class="h-6 rounded mb-1" style="background-color:${best.hex}"></div>
                <div class="text-[9px] font-bold mono">${best.code}</div>
            </div>
        `;
    }).join('');
}

export function pickColorFromCanvas(e) {
    const canvas = document.getElementById('imageCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    const p = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    const sampledHex = "#" + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

    const ownedOnly = document.getElementById('matchOwnedOnly').checked;
    const pool = getAllMarkers().filter(m => {
        if (m.code === "0") return false;
        if (!ownedOnly) return true;
        return !m.sets || m.sets.some(s => state.selectedSets.includes(s));
    });

    const ranked = pool.map(m => ({ ...m, dist: deltaE2000(sampledHex, m.hex) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

    document.getElementById('matchResults').innerHTML = ranked.map(m => `
        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-lg">
            <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded border border-slate-700" style="background-color:${m.hex}"></span>
                <div>
                    <div class="text-xs font-bold mono text-slate-200">${m.code} <span class="text-[10px] font-normal text-slate-400">(ΔE2k ${m.dist.toFixed(1)})</span></div>
                    <div class="text-[10px] text-slate-400">${m.name}</div>
                </div>
            </div>
            <button onclick="addToTray('${m.code}')" class="text-[11px] text-indigo-400 hover:underline">+ Tray</button>
        </div>
    `).join('');
}
