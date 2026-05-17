import * as THREE from 'three';

/** Settings for paper decal images (PNG with transparency recommended). */
export function prepareDecalTexture(texture: THREE.Texture): THREE.Texture {
    texture.encoding = THREE.sRGBEncoding;
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
}

/** Black background → transparent; keeps red blood visible on white walls. */
export function prepareBloodHandsTexture(source: THREE.Texture): THREE.Texture {
    const image = source.image as HTMLImageElement | HTMLCanvasElement;
    const w = image.width;
    const h = image.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const alpha = Math.max(r, g * 0.35, b * 0.35);
        d[i + 3] = alpha > 22 ? Math.min(255, alpha * 1.15) : 0;
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
}
