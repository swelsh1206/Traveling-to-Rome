import { Profession } from '../types';

/**
 * Collection of pre-generated pixel art character sprites
 * Each sprite is a data URI encoded SVG with a retro 16-bit aesthetic
 */

// Pixel art sprite generator helper
const createPixelSprite = (pixels: string[][], colors: Record<string, string>): string => {
    const pixelSize = 10;
    const width = pixels[0].length * pixelSize;
    const height = pixels.length * pixelSize;
    const padding = 20;
    const totalWidth = width + (padding * 2);
    const totalHeight = height + (padding * 2);

    let rects = '';
    pixels.forEach((row, y) => {
        row.forEach((pixel, x) => {
            if (pixel !== ' ') {
                const color = colors[pixel] || '#000000';
                rects += `<rect x="${x * pixelSize + padding}" y="${y * pixelSize + padding}" width="${pixelSize}" height="${pixelSize}" fill="${color}" rx="1"/>`;
            }
        });
    });

    const svg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="${totalWidth}" height="${totalHeight}" fill="#1a1a1a" rx="12"/>
        <rect x="4" y="4" width="${totalWidth - 8}" height="${totalHeight - 8}" fill="#2d2d2d" rx="10"/>
        <g filter="url(#shadow)">${rects}</g>
    </svg>`;

    return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

// Merchant Sprites (5 variations)
const merchantSprites = [
    // Merchant 1 - Gold and Red
    createPixelSprite([
        [' ',' ','H','H','H',' ',' '],
        [' ',' ','H','S','H',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','M','G','G','G','M',' '],
        [' ','M','G','R','G','M',' '],
        [' ','M','G','R','G','M',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { H: '#8B4513', S: '#FFE4C4', M: '#2F4F4F', G: '#D4AF37', R: '#DC143C', B: '#654321' }),

    // Merchant 2 - Wealthy
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','G','P','P','P','G',' '],
        [' ','G','P','Y','P','G',' '],
        [' ','G','P','Y','P','G',' '],
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { B: '#654321', S: '#FFE4C4', G: '#D4AF37', P: '#800080', Y: '#FFD700' }),

    // Merchant 3 - Traveler
    createPixelSprite([
        [' ',' ','H','H','H',' ',' '],
        [' ',' ','H','E','H',' ',' '],
        [' ',' ','E','E','E',' ',' '],
        [' ','B','R','R','R','B',' '],
        [' ','B','R','G','R','B',' '],
        [' ','B','R','G','R','B',' '],
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { H: '#A0522D', E: '#F5DEB3', B: '#696969', R: '#8B0000', G: '#D4AF37' }),

    // Merchant 4 - Female Merchant
    createPixelSprite([
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','R','S','R',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','Y','G','G','G','Y',' '],
        [' ','Y','G','W','G','Y',' '],
        [' ','Y','G','W','G','Y',' '],
        [' ',' ','P','P','P',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { R: '#8B4513', S: '#FFE4C4', Y: '#FFD700', G: '#228B22', W: '#FFFFFF', P: '#8B4513', B: '#654321' }),

    // Merchant 5 - Elder Merchant
    createPixelSprite([
        [' ',' ','W','W','W',' ',' '],
        [' ',' ','W','S','W',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','G','B','B','B','G',' '],
        [' ','G','B','Y','B','G',' '],
        [' ','G','B','Y','B','G',' '],
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { W: '#E0E0E0', S: '#FFE4C4', G: '#D4AF37', B: '#2F4F4F', Y: '#FFD700' }),
];

// Priest Sprites (5 variations)
const priestSprites = [
    // Priest 1 - Brown Robes
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','R','R','R','R','R',' '],
        [' ','R','R','W','R','R',' '],
        [' ','R','R','W','R','R',' '],
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','R',' ','R',' ',' '],
    ], { B: '#654321', S: '#FFE4C4', R: '#8B7355', W: '#FFFFFF' }),

    // Priest 2 - With Hood
    createPixelSprite([
        [' ','R','R','R','R','R',' '],
        [' ','R','R','S','R','R',' '],
        [' ','R','S','S','S','R',' '],
        [' ','R','R','R','R','R',' '],
        [' ','R','R','Y','R','R',' '],
        [' ','R','R','Y','R','R',' '],
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','R',' ','R',' ',' '],
    ], { R: '#654321', S: '#FFE4C4', Y: '#FFD700' }),

    // Priest 3 - Elder Priest
    createPixelSprite([
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G','S','G',' ',' '],
        [' ',' ','S','B','S',' ',' '],
        [' ','B','B','B','B','B',' '],
        [' ','B','B','W','B','B',' '],
        [' ','B','B','W','B','B',' '],
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { G: '#C0C0C0', S: '#FFE4C4', B: '#8B7355', W: '#FFFFFF' }),

    // Priest 4 - Female Priest
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ','W','B','S','B','W',' '],
        [' ','W','S','S','S','W',' '],
        [' ','R','R','R','R','R',' '],
        [' ','R','R','C','R','R',' '],
        [' ','R','R','C','R','R',' '],
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','R',' ','R',' ',' '],
    ], { B: '#8B4513', W: '#F5F5F5', S: '#FFE4C4', R: '#8B7355', C: '#FFD700' }),

    // Priest 5 - Wandering Monk
    createPixelSprite([
        [' ',' ','D','D','D',' ',' '],
        [' ',' ','D','S','D',' ',' '],
        [' ',' ','S','B','S',' ',' '],
        [' ','R','R','R','R','R',' '],
        [' ','R','R','R','R','R',' '],
        [' ','R','R','R','R','R',' '],
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','R',' ','R',' ',' '],
    ], { D: '#654321', S: '#FFE4C4', B: '#FFFFFF', R: '#A0522D' }),
];

// Soldier Sprites (5 variations)
const soldierSprites = [
    // Soldier 1 - Knight
    createPixelSprite([
        [' ',' ','M','M','M',' ',' '],
        [' ',' ','M','S','M',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','R','A','A','A','R',' '],
        [' ','R','A','M','A','R',' '],
        [' ','R','A','M','A','R',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { M: '#696969', S: '#FFE4C4', R: '#DC143C', A: '#A9A9A9', G: '#2F4F4F' }),

    // Soldier 2 - Armored
    createPixelSprite([
        [' ','M','M','M','M','M',' '],
        [' ','M','M','E','M','M',' '],
        [' ','M','E','E','E','M',' '],
        [' ','A','A','A','A','A',' '],
        [' ','A','A','R','A','A',' '],
        [' ','A','A','R','A','A',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { M: '#2F4F4F', E: '#FFE4C4', A: '#A9A9A9', R: '#DC143C', G: '#696969', B: '#654321' }),

    // Soldier 3 - Veteran
    createPixelSprite([
        [' ',' ','H','H','H',' ',' '],
        [' ',' ','H','S','H',' ',' '],
        [' ',' ','S','B','S',' ',' '],
        [' ','R','L','L','L','R',' '],
        [' ','R','L','M','L','R',' '],
        [' ','R','L','M','L','R',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { H: '#654321', S: '#FFE4C4', B: '#FFFFFF', R: '#8B0000', L: '#B8860B', M: '#696969', G: '#2F4F4F' }),

    // Soldier 4 - Scout
    createPixelSprite([
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G','S','G',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','B','L','L','L','B',' '],
        [' ','B','L','G','L','B',' '],
        [' ','B','L','G','L','B',' '],
        [' ',' ','D','D','D',' ',' '],
        [' ',' ','D',' ','D',' ',' '],
    ], { G: '#556B2F', S: '#FFE4C4', B: '#654321', L: '#8B7355', D: '#2F4F4F' }),

    // Soldier 5 - Captain
    createPixelSprite([
        [' ','R','M','M','M','R',' '],
        [' ','R','M','S','M','R',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','Y','A','A','A','Y',' '],
        [' ','Y','A','R','A','Y',' '],
        [' ','Y','A','R','A','Y',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { R: '#DC143C', M: '#696969', S: '#FFE4C4', Y: '#FFD700', A: '#A9A9A9', G: '#2F4F4F' }),
];

// Blacksmith Sprites (5 variations)
const blacksmithSprites = [
    // Blacksmith 1 - Traditional
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','H','S',' ',' '],
        [' ','L','D','D','D','L',' '],
        [' ','L','D','A','D','L',' '],
        [' ','L','D','A','D','L',' '],
        [' ',' ','D','D','D',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { B: '#654321', S: '#FFE4C4', H: '#000000', L: '#8B4513', D: '#2F4F4F', A: '#696969' }),

    // Blacksmith 2 - Master Smith
    createPixelSprite([
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G','S','G',' ',' '],
        [' ',' ','S','B','S',' ',' '],
        [' ','R','D','D','D','R',' '],
        [' ','R','D','M','D','R',' '],
        [' ','R','D','M','D','R',' '],
        [' ',' ','L','L','L',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { G: '#808080', S: '#FFE4C4', B: '#FFFFFF', R: '#8B0000', D: '#2F4F4F', M: '#696969', L: '#8B4513' }),

    // Blacksmith 3 - Young Apprentice
    createPixelSprite([
        [' ',' ','Y','Y','Y',' ',' '],
        [' ',' ','Y','S','Y',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','B','G','G','G','B',' '],
        [' ','B','G','D','G','B',' '],
        [' ','B','G','D','G','B',' '],
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { Y: '#D2691E', S: '#FFE4C4', B: '#8B4513', G: '#696969', D: '#2F4F4F' }),

    // Blacksmith 4 - Female Smith
    createPixelSprite([
        [' ',' ','R','R','R',' ',' '],
        [' ','R','R','S','R','R',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','L','D','D','D','L',' '],
        [' ','L','D','G','D','L',' '],
        [' ','L','D','G','D','L',' '],
        [' ',' ','D','D','D',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { R: '#8B4513', S: '#FFE4C4', L: '#654321', D: '#2F4F4F', G: '#696969', B: '#654321' }),

    // Blacksmith 5 - Armorer
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','M','S',' ',' '],
        [' ','A','D','D','D','A',' '],
        [' ','A','D','L','D','A',' '],
        [' ','A','D','L','D','A',' '],
        [' ',' ','D','D','D',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { B: '#654321', S: '#FFE4C4', M: '#000000', A: '#A9A9A9', D: '#2F4F4F', L: '#8B4513', G: '#696969' }),
];

// Scholar Sprites (5 variations)
const scholarSprites = [
    // Scholar 1 - Classic
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','E','S',' ',' '],
        [' ','D','L','L','L','D',' '],
        [' ','D','L','Y','L','D',' '],
        [' ','D','L','Y','L','D',' '],
        [' ',' ','L','L','L',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { B: '#654321', S: '#FFE4C4', E: '#000000', D: '#4169E1', L: '#191970', Y: '#FFD700', G: '#2F4F4F' }),

    // Scholar 2 - Elder Scholar
    createPixelSprite([
        [' ',' ','W','W','W',' ',' '],
        [' ',' ','W','S','W',' ',' '],
        [' ','W','S','E','S','W',' '],
        [' ','P','P','P','P','P',' '],
        [' ','P','P','B','P','P',' '],
        [' ','P','P','B','P','P',' '],
        [' ',' ','P','P','P',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { W: '#E0E0E0', S: '#FFE4C4', E: '#000000', P: '#4B0082', B: '#FFD700', G: '#654321' }),

    // Scholar 3 - Young Student
    createPixelSprite([
        [' ',' ','Y','Y','Y',' ',' '],
        [' ',' ','Y','S','Y',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','G','B','B','B','G',' '],
        [' ','G','B','L','B','G',' '],
        [' ','G','B','L','B','G',' '],
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { Y: '#D2691E', S: '#FFE4C4', G: '#228B22', B: '#4169E1', L: '#FFD700' }),

    // Scholar 4 - Female Scholar
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ','B','B','S','B','B',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','P','P','P','P','P',' '],
        [' ','P','P','W','P','P',' '],
        [' ','P','P','W','P','P',' '],
        [' ',' ','P','P','P',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { B: '#8B4513', S: '#FFE4C4', P: '#4B0082', W: '#FFFFFF', G: '#654321' }),

    // Scholar 5 - Astronomer
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','E','S',' ',' '],
        [' ','N','N','N','N','N',' '],
        [' ','N','N','Y','N','N',' '],
        [' ','N','N','Y','N','N',' '],
        [' ',' ','N','N','N',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { B: '#2F4F4F', S: '#FFE4C4', E: '#000000', N: '#191970', Y: '#FFD700' }),
];

// Apothecary Sprites (5 variations)
const apothecarySprites = [
    // Apothecary 1 - Herbalist
    createPixelSprite([
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G','S','G',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','L','R','R','R','L',' '],
        [' ','L','R','Y','R','L',' '],
        [' ','L','R','Y','R','L',' '],
        [' ',' ','R','R','R',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { G: '#556B2F', S: '#FFE4C4', L: '#8B4513', R: '#228B22', Y: '#90EE90', B: '#654321' }),

    // Apothecary 2 - Healer
    createPixelSprite([
        [' ',' ','B','B','B',' ',' '],
        [' ',' ','B','S','B',' ',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','W','G','G','G','W',' '],
        [' ','W','G','R','G','W',' '],
        [' ','W','G','R','G','W',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { B: '#8B4513', S: '#FFE4C4', W: '#F5F5F5', G: '#228B22', R: '#DC143C' }),

    // Apothecary 3 - Alchemist
    createPixelSprite([
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G','S','G',' ',' '],
        [' ',' ','S','B','S',' ',' '],
        [' ','P','D','D','D','P',' '],
        [' ','P','D','G','D','P',' '],
        [' ','P','D','G','D','P',' '],
        [' ',' ','D','D','D',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { G: '#654321', S: '#FFE4C4', B: '#000000', P: '#4B0082', D: '#2F4F4F' }),

    // Apothecary 4 - Female Healer
    createPixelSprite([
        [' ',' ','Y','Y','Y',' ',' '],
        [' ','Y','Y','S','Y','Y',' '],
        [' ',' ','S','S','S',' ',' '],
        [' ','W','G','G','G','W',' '],
        [' ','W','G','L','G','W',' '],
        [' ','W','G','L','G','W',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','B',' ','B',' ',' '],
    ], { Y: '#8B4513', S: '#FFE4C4', W: '#F5F5F5', G: '#32CD32', L: '#90EE90', B: '#654321' }),

    // Apothecary 5 - Wise Healer
    createPixelSprite([
        [' ',' ','W','W','W',' ',' '],
        [' ',' ','W','S','W',' ',' '],
        [' ','W','S','S','S','W',' '],
        [' ','G','G','G','G','G',' '],
        [' ','G','G','Y','G','G',' '],
        [' ','G','G','Y','G','G',' '],
        [' ',' ','G','G','G',' ',' '],
        [' ',' ','G',' ','G',' ',' '],
    ], { W: '#D3D3D3', S: '#FFE4C4', G: '#228B22', Y: '#FFD700' }),
];

// Export all sprites by profession
export const CHARACTER_SPRITES: Record<Profession, string[]> = {
    [Profession.Merchant]: merchantSprites,
    [Profession.Priest]: priestSprites,
    [Profession.Soldier]: soldierSprites,
    [Profession.Blacksmith]: blacksmithSprites,
    [Profession.Scholar]: scholarSprites,
    [Profession.Apothecary]: apothecarySprites,
};

// Helper function to get a random sprite for a profession
export const getRandomSprite = (profession: Profession): string => {
    const sprites = CHARACTER_SPRITES[profession];
    return sprites[Math.floor(Math.random() * sprites.length)];
};
