import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';
import { prepareDecalTexture } from '../Utils/umbrellaIconTexture';

const PAPER_MESHES = [
    'paper',
    'paper_stack_1',
    'paper_stack_2',
    'paper_holder_top',
];

/** Meshes removed from the scene (baked shadows may remain in the texture). */
const HIDDEN_DECOR_MESHES = ['plant'];

export default class Decor {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    bakedModel: BakedModel;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;

        this.bakeModel();
        this.setModel();
    }

    bakeModel() {
        this.bakedModel = new BakedModel(
            this.resources.items.gltfModel.decorModel,
            this.resources.items.texture.decorTexture,
            900
        );
    }

    setModel() {
        const model = this.bakedModel.getModel();
        this.hideDecorMeshes(model);
        this.coverPlantShadow(
            model,
            prepareDecalTexture(
                this.resources.items.texture.plantShadowPatchTexture
            )
        );
        const umbrellaTexture = prepareDecalTexture(
            this.resources.items.texture.umbrellaDecalTexture
        );
        this.addUmbrellaDecals(model, umbrellaTexture);
        this.scene.add(model);
    }

    hideDecorMeshes(root: THREE.Object3D) {
        root.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            if (HIDDEN_DECOR_MESHES.includes(child.name)) {
                child.visible = false;
            }
        });
    }

    /** Covers the plant’s baked shadow — use `static/textures/decor/plant_shadow_patch.png`. */
    coverPlantShadow(root: THREE.Object3D, patchTexture: THREE.Texture) {
        const plant = root.getObjectByName('plant') as THREE.Mesh | undefined;
        if (!plant) return;

        root.updateMatrixWorld(true);
        const plantBox = new THREE.Box3().setFromObject(plant);
        const size = plantBox.getSize(new THREE.Vector3());
        const center = plantBox.getCenter(new THREE.Vector3());

        const patchSpan = Math.max(size.x, size.z) * 1.15;
        const patch = new THREE.Mesh(
            new THREE.PlaneGeometry(patchSpan, patchSpan),
            new THREE.MeshBasicMaterial({
                map: patchTexture,
                transparent: true,
                opacity: 1,
                alphaTest: 0.08,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -2,
                polygonOffsetUnits: -2,
            })
        );

        patch.rotation.x = -Math.PI / 2;
        patch.position.set(center.x, plantBox.min.y + 3, center.z);
        root.add(patch);
    }

    addUmbrellaDecals(root: THREE.Object3D, texture: THREE.Texture) {
        root.updateMatrixWorld(true);

        root.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            if (!PAPER_MESHES.includes(child.name)) return;

            child.geometry.computeBoundingBox();

            // World box accounts for the 900× mesh scale so placement stays on the surface.
            const worldBox = new THREE.Box3().setFromObject(child);
            const worldSize = worldBox.getSize(new THREE.Vector3());
            const worldCenter = worldBox.getCenter(new THREE.Vector3());

            const thinAxis =
                worldSize.x <= worldSize.y && worldSize.x <= worldSize.z
                    ? 'x'
                    : worldSize.y <= worldSize.z
                      ? 'y'
                      : 'z';

            const footprint =
                thinAxis === 'x'
                    ? Math.min(worldSize.y, worldSize.z)
                    : thinAxis === 'y'
                      ? Math.min(worldSize.x, worldSize.z)
                      : Math.min(worldSize.x, worldSize.y);

            const meshScale = child.scale.x || 1;
            const decalSize =
                (footprint * (child.name === 'paper' ? 0.38 : 0.28)) / meshScale;

            const worldPos = worldCenter.clone();
            const worldUp = new THREE.Vector3();

            if (thinAxis === 'y') {
                worldUp.set(0, 1, 0);
                worldPos.y = worldBox.max.y + worldSize.y * 0.015;
            } else if (thinAxis === 'z') {
                worldUp.set(0, 0, 1);
                worldPos.z = worldBox.max.z + worldSize.z * 0.015;
            } else {
                worldUp.set(1, 0, 0);
                worldPos.x = worldBox.max.x + worldSize.x * 0.015;
            }

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                alphaTest: 0.08,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                polygonOffsetUnits: -4,
            });

            const decal = new THREE.Mesh(
                new THREE.PlaneGeometry(decalSize, decalSize),
                material
            );

            const localPos = child.worldToLocal(worldPos);
            const localUp = worldUp
                .clone()
                .transformDirection(
                    new THREE.Matrix4().copy(child.matrixWorld).invert()
                )
                .normalize();

            decal.position.copy(localPos);
            decal.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                localUp
            );

            child.add(decal);
        });
    }
}
