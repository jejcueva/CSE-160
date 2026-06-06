import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const sceneData = window.ASSIGNMENT5_SCENE;
const canvas = document.querySelector("#sceneCanvas");
const counter = document.querySelector("#collectibleCounter");
const statusLine = document.querySelector("#statusLine");

if (!sceneData || !canvas) {
  throw new Error("Assignment 5 scene data or canvas is missing.");
}

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const camera = new THREE.PerspectiveCamera(
  sceneData.CAMERA.fov,
  2,
  sceneData.CAMERA.near,
  sceneData.CAMERA.far,
);
camera.position.set(...sceneData.CAMERA.position);

const controls = new OrbitControls(camera, canvas);
controls.target.set(...sceneData.CAMERA.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxDistance = 34;
controls.minDistance = 4;
controls.maxPolarAngle = Math.PI * 0.48;
controls.update();

const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const gltfLoader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const animatedObjects = [];
const animatedLights = [];
const collectibles = [];
const shrineMeshes = [];
let collectedIds = Object.freeze([]);
let shrineAwake = false;
let shrineAwakeStartedAt = 0;
let shrinePointLight = null;
let portalMesh = null;
let foxModel = null;
let shrineEffects = null;

const textures = Object.fromEntries(
  Object.entries(sceneData.TEXTURES).map(([key, path]) => [key, loadTexture(key, path)]),
);

scene.background = cubeTextureLoader.load(sceneData.SKYBOX_FACES);
scene.fog = new THREE.Fog(0x172014, 24, 58);

sceneData.LIGHTS.forEach((lightData) => {
  const light = createLight(lightData);
  scene.add(light);

  if (light.target) {
    scene.add(light.target);
  }

  if (lightData.animation) {
    animatedLights.push({ light, lightData, baseIntensity: light.intensity });
  }

  if (lightData.id === "shrine-point") {
    shrinePointLight = light;
  }
});

sceneData.PRIMARY_OBJECTS.forEach((objectData) => {
  const mesh = createPrimaryMesh(objectData);
  scene.add(mesh);

  if (objectData.animation) {
    animatedObjects.push(mesh);
  }

  if (objectData.collectible) {
    collectibles.push(mesh);
  }

  if (objectData.id.startsWith("shrine-")) {
    shrineMeshes.push(mesh);
  }

  if (objectData.id === "portal-ring") {
    portalMesh = mesh;
  }
});

shrineEffects = createAwakenedShrineEffects();
scene.add(shrineEffects.group);

loadFoxModel();
updateCollectibleCounter();
statusLine.textContent = "Grove ready. Collect the spirit flames.";

canvas.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("resize", resizeRendererToDisplaySize);
requestAnimationFrame(render);

function loadTexture(key, path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  if (key === "grass") {
    texture.repeat.set(10, 8);
  } else if (key === "stone") {
    texture.repeat.set(1.8, 1.8);
  } else if (key === "wood") {
    texture.repeat.set(1.2, 1.2);
  }

  return texture;
}

function createPrimaryMesh(objectData) {
  const mesh = new THREE.Mesh(
    createGeometry(objectData.geometry),
    createMaterial(objectData),
  );

  mesh.name = objectData.id;
  mesh.position.set(...objectData.position);
  mesh.rotation.set(...(objectData.rotation || [0, 0, 0]));
  mesh.scale.set(...objectData.scale);
  mesh.castShadow = Boolean(objectData.castShadow);
  mesh.receiveShadow = Boolean(objectData.receiveShadow);
  mesh.userData = {
    animation: objectData.animation || "",
    assignmentId: objectData.id,
    basePosition: mesh.position.clone(),
    baseRotation: mesh.rotation.clone(),
    baseScale: mesh.scale.clone(),
    collectible: Boolean(objectData.collectible),
    collected: false,
  };

  return mesh;
}

function createGeometry(geometryName) {
  if (geometryName === "box") {
    return new THREE.BoxGeometry(1, 1, 1);
  }

  if (geometryName === "sphere") {
    return new THREE.SphereGeometry(1, 32, 16);
  }

  if (geometryName === "cylinder") {
    return new THREE.CylinderGeometry(1, 1, 1, 32);
  }

  if (geometryName === "cone") {
    return new THREE.ConeGeometry(1, 1, 8);
  }

  if (geometryName === "torus") {
    return new THREE.TorusGeometry(1, 0.14, 16, 64);
  }

  throw new Error(`Unknown geometry: ${geometryName}`);
}

function createMaterial(objectData) {
  const materialData = sceneData.MATERIALS[objectData.materialKey];
  const texture = objectData.textureKey ? textures[objectData.textureKey] : null;

  return new THREE.MeshStandardMaterial({
    color: materialData.color,
    emissive: materialData.emissive || "#000000",
    emissiveIntensity: materialData.emissiveIntensity || 0,
    map: texture || null,
    opacity: materialData.opacity ?? 1,
    roughness: materialData.roughness ?? 0.7,
    metalness: 0.05,
    transparent: Boolean(materialData.transparent),
  });
}

function createLight(lightData) {
  let light;

  if (lightData.type === "AmbientLight") {
    light = new THREE.AmbientLight(lightData.color, lightData.intensity);
  } else if (lightData.type === "DirectionalLight") {
    light = new THREE.DirectionalLight(lightData.color, lightData.intensity);
    light.position.set(...lightData.position);
    light.target.position.set(...lightData.target);
  } else if (lightData.type === "HemisphereLight") {
    light = new THREE.HemisphereLight(lightData.skyColor, lightData.groundColor, lightData.intensity);
  } else if (lightData.type === "PointLight") {
    light = new THREE.PointLight(lightData.color, lightData.intensity, lightData.distance);
    light.position.set(...lightData.position);
  } else if (lightData.type === "SpotLight") {
    light = new THREE.SpotLight(
      lightData.color,
      lightData.intensity,
      lightData.distance,
      lightData.angle,
      lightData.penumbra,
    );
    light.position.set(...lightData.position);
    light.target.position.set(...lightData.target);
  } else {
    throw new Error(`Unknown light type: ${lightData.type}`);
  }

  light.name = lightData.id;
  light.castShadow = Boolean(lightData.castShadow);

  if (light.castShadow) {
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 45;
  }

  return light;
}

function createAwakenedShrineEffects() {
  const group = new THREE.Group();
  group.name = "awakened-shrine-effects";
  group.visible = false;

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: "#67e8f9",
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.34,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.72, 8.5, 48, 1, true),
    beamMaterial,
  );
  beam.name = "spirit-beam";
  beam.position.set(0, 5.1, -6.35);
  group.add(beam);

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: "#fef3c7",
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.26,
    transparent: true,
  });
  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.16, 8.7, 32, 1, true),
    coreMaterial,
  );
  beamCore.name = "spirit-beam-core";
  beamCore.position.copy(beam.position);
  group.add(beamCore);

  const rings = [1.05, 1.62, 2.24].map((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.035, 12, 96),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? "#fef3c7" : "#67e8f9",
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.45,
        transparent: true,
      }),
    );
    ring.name = `pulsing-shrine-ring-${index + 1}`;
    ring.position.set(0, 0.18 + (index * 0.55), -6.3);
    ring.rotation.x = Math.PI / 2;
    ring.userData = {
      baseScale: ring.scale.clone(),
      phase: index * 0.32,
    };
    group.add(ring);
    return ring;
  });

  const sparks = Array.from({ length: 22 }, (_, index) => {
    const phase = index * 0.76;
    const radius = 0.8 + ((index % 6) * 0.24);
    const height = 1.2 + ((index % 7) * 0.38);
    const material = new THREE.MeshBasicMaterial({
      color: index % 3 === 0 ? "#fef3c7" : "#67e8f9",
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.0,
      transparent: true,
    });
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), material);
    spark.name = `floating-spark-${index + 1}`;
    spark.userData = { height, phase, radius };
    group.add(spark);
    return spark;
  });

  return {
    beam,
    beamCore,
    group,
    rings,
    sparks,
  };
}

function loadFoxModel() {
  gltfLoader.load(
    sceneData.MODEL_ASSET.path,
    (gltf) => {
      const holder = new THREE.Group();
      const model = gltf.scene;
      const fallbackTexture = textures[sceneData.MODEL_ASSET.textureFallbackKey];

      model.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        child.castShadow = true;
        child.receiveShadow = true;
        child.material = createModelMaterial(child.material, fallbackTexture);
      });

      centerAndScaleModel(model, 2.0);
      holder.position.set(...sceneData.MODEL_ASSET.position);
      holder.rotation.set(...sceneData.MODEL_ASSET.rotation);
      holder.name = sceneData.MODEL_ASSET.id;
      holder.add(model);
      holder.userData = { baseRotationY: holder.rotation.y };
      foxModel = holder;
      scene.add(holder);
      statusLine.textContent = "Fox model loaded. Collect the spirit flames.";
    },
    undefined,
    () => {
      statusLine.textContent = "The grove loaded, but the fox model could not be loaded.";
    },
  );
}

function createModelMaterial(existingMaterial, fallbackTexture) {
  if (!existingMaterial || !existingMaterial.map) {
    return new THREE.MeshStandardMaterial({
      color: "#d97706",
      map: fallbackTexture,
      roughness: 0.78,
      metalness: 0.05,
    });
  }

  const material = existingMaterial.clone();
  material.map.colorSpace = THREE.SRGBColorSpace;
  material.roughness = material.roughness ?? 0.78;
  material.metalness = material.metalness ?? 0.05;
  return material;
}

function centerAndScaleModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDimension;

  model.position.sub(center);
  model.scale.setScalar(scale);
  model.position.y += (size.y * scale) / 2;
}

function handlePointerDown(event) {
  const activeCollectibles = collectibles.filter((mesh) => !mesh.userData.collected);

  if (activeCollectibles.length === 0) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(activeCollectibles, false)[0];
  if (!hit) {
    return;
  }

  collectFlame(hit.object);
}

function collectFlame(mesh) {
  const flameId = mesh.userData.assignmentId;
  if (collectedIds.includes(flameId)) {
    return;
  }

  mesh.userData.collected = true;
  mesh.material.transparent = true;
  mesh.material.opacity = 0.28;
  mesh.material.emissiveIntensity = 0.35;
  collectedIds = Object.freeze([...collectedIds, flameId]);
  updateCollectibleCounter();

  if (collectedIds.length === sceneData.WOW_FEATURE.collectibleCount) {
    shrineAwake = true;
    shrineAwakeStartedAt = performance.now() * 0.001;
    activateAwakenedShrineEffects();
    statusLine.textContent = sceneData.WOW_FEATURE.awakenedStatus;
  } else {
    statusLine.textContent = "Spirit flame collected.";
  }
}

function activateAwakenedShrineEffects() {
  if (shrineEffects) {
    shrineEffects.group.visible = true;
  }

  shrineMeshes.forEach((mesh) => {
    mesh.material.emissive.set("#67e8f9");
    mesh.material.emissiveIntensity = 0.5;
  });

  if (portalMesh) {
    portalMesh.material.emissive.set("#fef3c7");
    portalMesh.material.emissiveIntensity = 1.65;
  }

  if (shrinePointLight) {
    shrinePointLight.color.set("#67e8f9");
    shrinePointLight.intensity += 1.2;
    shrinePointLight.distance = Math.max(shrinePointLight.distance, 20);
  }
}

function updateCollectibleCounter() {
  counter.textContent = `Flames collected: ${collectedIds.length} / ${sceneData.WOW_FEATURE.collectibleCount}`;
}

function resizeRendererToDisplaySize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const shouldResize = canvas.width !== width || canvas.height !== height;

  if (shouldResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return shouldResize;
}

function render(time) {
  const seconds = time * 0.001;

  resizeRendererToDisplaySize();
  animateObjects(seconds);
  animateLights(seconds);
  animateShrineEffects(seconds);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function animateObjects(seconds) {
  animatedObjects.forEach((mesh) => {
    if (mesh.userData.animation === "spiritPulse") {
      animateSpirit(mesh, seconds);
    } else if (mesh.userData.animation === "portalSpin") {
      mesh.rotation.z = mesh.userData.baseRotation.z + (seconds * 0.85);
      mesh.material.emissiveIntensity = shrineAwake ? 1.25 + (Math.sin(seconds * 3) * 0.3) : 0.65;
    } else if (mesh.userData.animation === "gentleBob") {
      mesh.position.y = mesh.userData.basePosition.y + (Math.sin(seconds * 2.2) * 0.08);
      mesh.rotation.y = mesh.userData.baseRotation.y + (seconds * 0.35);
    }
  });

  if (foxModel) {
    foxModel.rotation.y = foxModel.userData.baseRotationY + (Math.sin(seconds * 0.8) * 0.08);
  }
}

function animateSpirit(mesh, seconds) {
  const wobble = Math.sin((seconds * 3.2) + mesh.userData.basePosition.x);
  const scale = mesh.userData.collected ? 0.24 : 1 + (wobble * 0.18);

  mesh.position.y = mesh.userData.basePosition.y + (wobble * 0.14);
  mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(scale);
  mesh.rotation.y = seconds * 1.8;

  if (!mesh.userData.collected) {
    mesh.material.emissiveIntensity = 1.05 + (Math.abs(wobble) * 0.45);
  }
}

function animateLights(seconds) {
  animatedLights.forEach(({ light, baseIntensity }) => {
    const pulse = Math.sin(seconds * 2.6) * 0.35;
    light.intensity = baseIntensity + pulse + (shrineAwake ? 0.9 : 0);
  });

  if (shrineAwake && shrinePointLight && portalMesh) {
    shrinePointLight.color.set("#67e8f9");
    portalMesh.scale.copy(portalMesh.userData.baseScale).multiplyScalar(1.08 + (Math.sin(seconds * 3.4) * 0.04));
  }
}

function animateShrineEffects(seconds) {
  if (!shrineAwake || !shrineEffects) {
    return;
  }

  const age = Math.max(0, seconds - shrineAwakeStartedAt);
  const intro = Math.min(age / 1.1, 1);
  const beamPulse = 1 + (Math.sin(seconds * 5.2) * 0.08);

  shrineEffects.beam.scale.set(beamPulse, intro, beamPulse);
  shrineEffects.beam.material.opacity = 0.2 + (intro * 0.24) + (Math.sin(seconds * 3.8) * 0.04);
  shrineEffects.beamCore.scale.set(0.75 + (beamPulse * 0.18), intro, 0.75 + (beamPulse * 0.18));
  shrineEffects.beamCore.material.opacity = 0.16 + (intro * 0.22);

  shrineEffects.rings.forEach((ring, index) => {
    const cycle = ((seconds * 0.55) + ring.userData.phase) % 1;
    const ringScale = 0.65 + (cycle * 1.2);

    ring.scale.copy(ring.userData.baseScale).multiplyScalar(ringScale);
    ring.rotation.z = seconds * (0.35 + (index * 0.12));
    ring.material.opacity = Math.max(0.08, (1 - cycle) * 0.55) * intro;
  });

  shrineEffects.sparks.forEach((spark, index) => {
    const { height, phase, radius } = spark.userData;
    const orbit = seconds * (0.65 + ((index % 4) * 0.12)) + phase;
    const bob = Math.sin((seconds * 2.1) + phase) * 0.18;

    spark.position.set(
      Math.cos(orbit) * radius,
      height + bob,
      -6.35 + (Math.sin(orbit) * radius),
    );
    spark.scale.setScalar(0.75 + (Math.sin((seconds * 4.6) + phase) * 0.22));
    spark.material.opacity = intro * (0.42 + (Math.sin((seconds * 3.4) + phase) * 0.16));
  });
}
