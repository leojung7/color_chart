/**
 * Studio physical case organizer layout builder (2x160 or 4x80 slots).
 */
import { getContrastColor } from './color-utils.js';

export function renderOrganizerView(container, markers, layout = '2x160') {
    const trayCount = layout === '4x80' ? 4 : 2;
    const traySize = Math.ceil(markers.length / trayCount) || 1;

    const trays = [];
    for (let i = 0; i < trayCount; i++) {
        const slice = markers.slice(i * traySize, (i + 1) * traySize);
        trays.push(`
            <div class="slot-card">
                <h3 style="margin-bottom: 0.5rem; font-size: 0.95rem;">
                    Case Tray ${i + 1} (${slice.length} markers)
                </h3>
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;">
                    ${slice.map(m => `
                        <div title="${m.code} - ${m.name}"
                             style="background:${m.hex}; color:${getContrastColor(m.hex)};
                                    font-size:0.65rem; font-weight:700; text-align:center;
                                    padding:6px 2px; border-radius:4px; border:1px solid rgba(0,0,0,0.12);">
                            ${m.code}
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    }

    container.innerHTML = `
        <div class="organizer-layout" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
            ${trays.join('')}
        </div>
    `;
}
