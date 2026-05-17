import * as THREE from 'three';
import Application from '../Application';

type SurgeType = 'power' | 'alarm' | 'terminal';

export default class Storm {
    application: Application;
    scene: THREE.Scene;
    darkOverlay: HTMLElement | null;
    surgeOverlay: HTMLElement | null;
    nextSurgeAt: number;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.darkOverlay = null;
        this.surgeOverlay = null;
        this.nextSurgeAt = performance.now() + 8000;

        this.setupScene();
        this.setupDom();
    }

    setupScene() {
        const fogColor = 0x060504;
        this.scene.background = new THREE.Color(fogColor);
        this.scene.fog = new THREE.FogExp2(fogColor, 0.000032);

        const darken = new THREE.Color(0x3a3634);
        this.scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                const mat = obj.material;
                if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
                    mat.color.copy(darken);
                }
            }
        });
    }

    setupDom() {
        const webgl = document.getElementById('webgl');
        if (!webgl?.parentNode) return;

        document.getElementById('storm-lightning')?.remove();

        let dark = document.getElementById('storm-dark');
        if (!dark) {
            dark = document.createElement('div');
            dark.id = 'storm-dark';
            webgl.parentNode.insertBefore(dark, webgl.nextSibling);
        }

        let surge = document.getElementById('storm-surge');
        if (!surge) {
            surge = document.createElement('div');
            surge.id = 'storm-surge';
            const overlay = document.getElementById('overlay');
            if (overlay) {
                webgl.parentNode.insertBefore(surge, overlay);
            } else {
                webgl.parentNode.appendChild(surge);
            }
        }

        this.darkOverlay = dark;
        this.surgeOverlay = surge;
    }

    triggerSurge(type: SurgeType) {
        if (!this.surgeOverlay) return;

        this.surgeOverlay.classList.remove('alarm', 'terminal', 'active');
        void this.surgeOverlay.offsetWidth;
        this.surgeOverlay.classList.add('active', type);

        const duration =
            type === 'power' ? 35 + Math.random() * 45 : 55 + Math.random() * 70;

        window.setTimeout(() => {
            this.surgeOverlay?.classList.remove('active', 'alarm', 'terminal');
        }, duration);
    }

    triggerPowerDip() {
        if (!this.darkOverlay) return;
        this.darkOverlay.classList.add('dip');
        window.setTimeout(() => {
            this.darkOverlay?.classList.remove('dip');
        }, 60 + Math.random() * 80);
    }

    pickSurgeType(): SurgeType {
        const roll = Math.random();
        if (roll < 0.3) return 'power';
        if (roll < 0.7) return 'alarm';
        return 'terminal';
    }

    scheduleNextSurge() {
        this.nextSurgeAt = performance.now() + 10000 + Math.random() * 20000;
    }

    update() {
        if (performance.now() < this.nextSurgeAt) return;

        const type = this.pickSurgeType();

        if (type === 'power') {
            this.triggerPowerDip();
            if (Math.random() < 0.15) {
                window.setTimeout(() => this.triggerPowerDip(), 90);
            }
        } else {
            this.triggerSurge(type);
            if (type === 'alarm' && Math.random() < 0.1) {
                window.setTimeout(
                    () => this.triggerSurge('alarm'),
                    70 + Math.random() * 90
                );
            }
        }

        this.scheduleNextSurge();
    }
}
