import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';
import { prepareBloodHandsTexture } from '../Utils/umbrellaIconTexture';

/** Fine-tune placement on the white wall behind the chair (world units). */
const BLOOD_HANDS = {
    height: 1050,
    offsetFromChair: new THREE.Vector3(40, -180, 0),
    insetFromWall: 45,
};

export default class Environment {
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
            this.resources.items.gltfModel.environmentModel,
            this.resources.items.texture.environmentTexture,
            900
        );
    }

    setModel() {
        const model = this.bakedModel.getModel();
        const bloodTexture = prepareBloodHandsTexture(
            this.resources.items.texture.bloodHandsTexture
        );
        this.addBloodHandsOnWall(model, bloodTexture);
        this.scene.add(model);
    }

    addBloodHandsOnWall(root: THREE.Object3D, texture: THREE.Texture) {
        const background = root.getObjectByName('Background');
        const chair =
            root.getObjectByName('chair_seat') ||
            root.getObjectByName('chair_base');

        if (!background || !chair) return;

        root.updateMatrixWorld(true);

        const wallBox = new THREE.Box3().setFromObject(background);
        const chairBox = new THREE.Box3().setFromObject(chair);
        const chairCenter = chairBox.getCenter(new THREE.Vector3());

        const image = texture.image as HTMLCanvasElement | HTMLImageElement;
        const aspect =
            image.width && image.height ? image.width / image.height : 1.6;
        const worldHeight = BLOOD_HANDS.height;
        const worldWidth = worldHeight * aspect;

        const worldPos = new THREE.Vector3(
            chairCenter.x + BLOOD_HANDS.offsetFromChair.x,
            chairCenter.y + BLOOD_HANDS.offsetFromChair.y,
            wallBox.max.z - BLOOD_HANDS.insetFromWall
        );

        const decal = new THREE.Mesh(
            new THREE.PlaneGeometry(worldWidth, worldHeight),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.92,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -3,
                polygonOffsetUnits: -3,
            })
        );

        decal.position.copy(worldPos);
        decal.rotation.y = Math.PI;

        root.add(decal);
    }

    update() {}
}
