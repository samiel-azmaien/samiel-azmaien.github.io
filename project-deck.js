import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("[data-project-canvas]");
const shell = document.querySelector("[data-deck-shell]");
const projectViewer = document.querySelector("[data-project-viewer]");
const loading = document.querySelector("[data-model-loading]");
const projectVideo = document.querySelector("[data-project-video]");
const projectStatus = document.querySelector("[data-project-status]");
const projectNumber = document.querySelector("[data-project-number]");
const projectCategory = document.querySelector("[data-project-category]");
const projectTitle = document.querySelector("[data-project-title]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && shell) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 150);
  camera.position.set(0, 0, 24);

  const rig = new THREE.Group();
  const hardware = new THREE.Group();
  rig.add(hardware);
  scene.add(rig);

  scene.add(new THREE.HemisphereLight(0xb4c4d2, 0x020305, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(-7, 10, 13);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb8ff00, 1.35);
  rim.position.set(11, -2, 8);
  scene.add(rim);
  const fill = new THREE.PointLight(0x548dff, 10, 28, 2);
  fill.position.set(-2, 0, 9);
  scene.add(fill);

  let modelReady = false;
  let screenMesh = null;
  let screenTexture = null;
  let targetRotationX = 0;
  let targetRotationY = 0;
  let orbitVelocityX = 0;
  let orbitVelocityY = 0;
  let orbitPointerId = null;
  let orbitStartX = 0;
  let orbitStartY = 0;
  let orbitBaseRotationX = 0;
  let orbitBaseRotationY = 0;
  let orbitLastX = 0;
  let orbitLastY = 0;
  let orbitDragging = false;
  let hoveredControl = null;
  let pressedControlAction = null;
  let pressedControlMesh = null;
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const interactiveControls = [];
  const controlActions = new Map([
    [1, "previous"],
    [2, "next"],
    [3, "next"],
    [4, "previous"],
    [5, "next"],
    [6, "next"],
    [7, "open"],
    [8, "previous"],
  ]);

  const screenSurface = document.createElement("canvas");
  screenSurface.width = 960;
  screenSurface.height = 544;
  const screenContext = screenSurface.getContext("2d");

  const drawCover = (source) => {
    const width = source.videoWidth || source.width || 1;
    const height = source.videoHeight || source.height || 1;
    const sourceRatio = width / height;
    const targetRatio = screenSurface.width / screenSurface.height;
    let drawWidth;
    let drawHeight;
    let x;
    let y;

    if (sourceRatio > targetRatio) {
      drawHeight = screenSurface.height;
      drawWidth = drawHeight * sourceRatio;
      x = (screenSurface.width - drawWidth) / 2;
      y = 0;
    } else {
      drawWidth = screenSurface.width;
      drawHeight = drawWidth / sourceRatio;
      x = 0;
      y = (screenSurface.height - drawHeight) / 2;
    }
    screenContext.drawImage(source, x, y, drawWidth, drawHeight);
  };

  const paintProjectScreen = () => {
    screenContext.setTransform(1, 0, 0, 1, 0, 0);
    screenContext.fillStyle = "#020303";
    screenContext.fillRect(0, 0, screenSurface.width, screenSurface.height);

    if (projectVideo?.readyState >= 2) {
      screenContext.save();
      screenContext.filter = "grayscale(78%) contrast(1.25) brightness(0.8)";
      drawCover(projectVideo);
      screenContext.restore();
    }

    const shade = screenContext.createLinearGradient(0, 0, 0, screenSurface.height);
    shade.addColorStop(0, "rgba(0,0,0,.12)");
    shade.addColorStop(0.48, "rgba(0,0,0,.08)");
    shade.addColorStop(1, "rgba(0,0,0,.9)");
    screenContext.fillStyle = shade;
    screenContext.fillRect(0, 0, screenSurface.width, screenSurface.height);

    screenContext.fillStyle = "rgba(255,255,255,.9)";
    screenContext.font = "700 19px 'Space Mono', monospace";
    screenContext.textBaseline = "top";
    screenContext.fillText((projectStatus?.textContent || "SELECTED PROJECT").toUpperCase(), 72, 30);
    screenContext.textAlign = "right";
    screenContext.fillText("REC", 838, 30);
    screenContext.fillStyle = "#ff3b30";
    screenContext.beginPath();
    screenContext.arc(862, 41, 7, 0, Math.PI * 2);
    screenContext.fill();

    const openControlActive = hoveredControl?.userData.controlAction === "open" || pressedControlAction === "open";
    screenContext.lineWidth = 2;
    if (openControlActive) {
      screenContext.fillStyle = "#dfff00";
      screenContext.fillRect(742, 132, 146, 42);
      screenContext.fillStyle = "#050505";
    } else {
      screenContext.strokeStyle = "rgba(223,255,0,.88)";
      screenContext.strokeRect(742, 132, 146, 42);
      screenContext.fillStyle = "#dfff00";
    }
    screenContext.font = "700 16px 'Space Mono', monospace";
    screenContext.textAlign = "center";
    screenContext.fillText("OPEN PROJECT ↗", 815, 144);

    screenContext.fillStyle = "rgba(223,255,0,.86)";
    screenContext.fillRect(0, 306, screenSurface.width, 3);
    screenContext.textAlign = "left";
    screenContext.fillStyle = "#dfff00";
    screenContext.font = "700 22px 'Space Mono', monospace";
    screenContext.fillText(projectNumber?.textContent || "01", 72, 326);
    screenContext.fillStyle = "rgba(255,255,255,.9)";
    screenContext.fillText("/ 05", 112, 326);
    screenContext.font = "700 18px 'Space Mono', monospace";
    screenContext.fillText((projectCategory?.textContent || "SYSTEM").toUpperCase(), 194, 328);

    const titleText = projectTitle?.textContent || "Project";
    const titleSize = titleText.length > 17 ? 48 : titleText.length > 10 ? 58 : 70;
    screenContext.font = `${titleSize}px VT323, monospace`;
    screenContext.fillStyle = "#fff";
    screenContext.fillText(titleText, 70, 365);
    screenTexture.needsUpdate = true;
  };

  const triangleNormal = (mesh) => {
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const index = geometry.getIndex();
    const total = index ? index.count : position.count;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const edgeA = new THREE.Vector3();
    const edgeB = new THREE.Vector3();
    const cross = new THREE.Vector3();
    const winner = new THREE.Vector3(0, 0, 1);
    let largest = 0;

    for (let offset = 0; offset < total; offset += 3) {
      const ia = index ? index.getX(offset) : offset;
      const ib = index ? index.getX(offset + 1) : offset + 1;
      const ic = index ? index.getX(offset + 2) : offset + 2;
      a.fromBufferAttribute(position, ia);
      b.fromBufferAttribute(position, ib);
      c.fromBufferAttribute(position, ic);
      cross.crossVectors(edgeA.subVectors(b, a), edgeB.subVectors(c, a));
      const area = cross.lengthSq();
      if (area > largest) {
        largest = area;
        winner.copy(cross).normalize();
      }
    }

    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    return winner.applyMatrix3(normalMatrix).normalize();
  };

  const centreOf = (object) => new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());

  const rebuildScreenUv = (mesh) => {
    mesh.geometry = mesh.geometry.clone();
    mesh.updateWorldMatrix(true, false);
    const position = mesh.geometry.getAttribute("position");
    const projected = [];
    const point = new THREE.Vector3();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let index = 0; index < position.count; index += 1) {
      point.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
      projected.push(point.clone());
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const uv = new Float32Array(position.count * 2);
    projected.forEach((vertex, index) => {
      uv[index * 2] = (vertex.x - minX) / width;
      uv[index * 2 + 1] = (vertex.y - minY) / height;
    });
    mesh.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  };

  const orientHardware = (source, buttons) => {
    source.updateWorldMatrix(true, true);
    const deviceCentre = centreOf(source);
    const screenCentre = centreOf(screenMesh);
    const outward = triangleNormal(screenMesh);
    if (outward.dot(screenCentre.clone().sub(deviceCentre)) < 0) outward.negate();

    const lowerControls = buttons.filter(({ number }) => number >= 9).map(({ mesh }) => centreOf(mesh));
    const lowerCentre = lowerControls.length
      ? lowerControls.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(lowerControls.length)
      : deviceCentre.clone().add(new THREE.Vector3(0, -1, 0));
    const up = screenCentre.clone().sub(lowerCentre).projectOnPlane(outward).normalize();
    const right = new THREE.Vector3().crossVectors(up, outward).normalize();
    up.crossVectors(outward, right).normalize();

    const frame = new THREE.Matrix4().makeBasis(right, up, outward);
    hardware.quaternion.setFromRotationMatrix(frame).invert();
    hardware.updateWorldMatrix(true, true);

    let box = new THREE.Box3().setFromObject(hardware);
    const size = box.getSize(new THREE.Vector3());
    hardware.scale.setScalar(15.6 / Math.max(size.x, size.y));
    hardware.updateWorldMatrix(true, true);
    box = new THREE.Box3().setFromObject(hardware);
    hardware.position.sub(box.getCenter(new THREE.Vector3()));
    hardware.position.y += 0.08;
    hardware.updateWorldMatrix(true, true);
  };

  const fitCamera = () => {
    const width = Math.max(1, shell.clientWidth);
    const height = Math.max(1, shell.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 29 : 27;
    camera.position.z = width < 700 ? 17 : 23;
    camera.updateProjectionMatrix();
  };

  new GLTFLoader().load(
    "./assets/models/sony-psp.glb?v=20260917-psp3",
    ({ scene: source }) => {
      const buttons = [];
      const discarded = [];

      source.traverse((object) => {
        if (!object.isMesh) return;
        object.frustumCulled = false;
        const name = object.name.toLowerCase();
        if (name.startsWith("ground")) {
          discarded.push(object);
          return;
        }
        if (name.startsWith("screen")) screenMesh = object;
        const match = name.match(/^button(\d+)/);
        if (match) {
          const number = Number(match[1]);
          buttons.push({ number, mesh: object });
          const action = controlActions.get(number);
          if (action) {
            object.userData.controlAction = action;
            interactiveControls.push(object);
          }
        }

        if (object.material) {
          object.material = object.material.clone();
          object.material.metalness = Math.min(1, (object.material.metalness || 0.3) + 0.16);
          object.material.roughness = Math.max(0.18, (object.material.roughness || 0.55) * 0.78);
          object.material.envMapIntensity = 1.2;
        }
      });


      const controlMeshes = [...interactiveControls];
      interactiveControls.length = 0;
      controlMeshes.forEach((mesh) => {
        mesh.geometry.computeBoundingSphere();
        const bounds = mesh.geometry.boundingSphere;
        if (!bounds) return;
        const hitTarget = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(bounds.radius * 1.45, 0.42), 12, 8),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
        );
        hitTarget.position.copy(bounds.center);
        hitTarget.userData.controlAction = mesh.userData.controlAction;
        hitTarget.userData.controlMesh = mesh;
        mesh.add(hitTarget);
        interactiveControls.push(hitTarget);
      });


      discarded.forEach((object) => object.parent?.remove(object));
      hardware.add(source);

      if (screenMesh) {
        orientHardware(source, buttons);
        rebuildScreenUv(screenMesh);
        screenTexture = new THREE.CanvasTexture(screenSurface);
        screenTexture.colorSpace = THREE.SRGBColorSpace;
        screenTexture.flipY = true;
        screenTexture.minFilter = THREE.LinearFilter;
        screenTexture.magFilter = THREE.LinearFilter;
        screenMesh.material = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
        screenMesh.renderOrder = 3;
        screenMesh.userData.controlAction = "open";
        interactiveControls.push(screenMesh);
        paintProjectScreen();
      }


      modelReady = true;
      loading?.classList.add("is-hidden");
      shell.classList.add("model-ready");
      projectViewer?.dispatchEvent(new CustomEvent("psp-ready"));
      fitCamera();
    },
    undefined,
    () => {
      if (loading) loading.textContent = "HARDWARE OFFLINE";
      shell.classList.add("model-failed");
    }
  );

  const restoreControl = (mesh) => {
    if (!mesh?.material?.emissive || !mesh.userData.baseEmissive) return;
    mesh.material.emissive.copy(mesh.userData.baseEmissive);
    mesh.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity;
  };

  const highlightControl = (mesh) => {
    mesh = mesh?.userData.controlMesh || mesh;
    if (mesh === hoveredControl) return;
    restoreControl(hoveredControl);
    hoveredControl = mesh;
    if (!mesh?.material?.emissive) return;
    if (!mesh.userData.baseEmissive) {
      mesh.userData.baseEmissive = mesh.material.emissive.clone();
      mesh.userData.baseEmissiveIntensity = mesh.material.emissiveIntensity;
    }
    mesh.material.emissive.set(0xdfff00);
    mesh.material.emissiveIntensity = 0.75;
  };

  const pickControl = (event) => {
    if (!modelReady || !interactiveControls.length) return null;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(interactiveControls, false)[0]?.object || null;
  };

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId === orbitPointerId) {
      const totalX = event.clientX - orbitStartX;
      const totalY = event.clientY - orbitStartY;
      if (!orbitDragging && Math.hypot(totalX, totalY) > 6) {
        orbitDragging = true;
        clearPressedControl();
        highlightControl(null);
        delete canvas.dataset.cursor;
        canvas.dataset.orbiting = "";
      }
      if (orbitDragging) {
        event.preventDefault();
        const deltaX = event.clientX - orbitLastX;
        const deltaY = event.clientY - orbitLastY;
        orbitVelocityY = THREE.MathUtils.clamp(deltaX * 0.007, -0.045, 0.045);
        orbitVelocityX = THREE.MathUtils.clamp(deltaY * 0.005, -0.035, 0.035);
        targetRotationY = orbitBaseRotationY + totalX * 0.007;
        targetRotationX = THREE.MathUtils.clamp(orbitBaseRotationX + totalY * 0.005, -0.72, 0.72);
        canvas.dataset.rotation = targetRotationY.toFixed(2);
        orbitLastX = event.clientX;
        orbitLastY = event.clientY;
        return;
      }
    }
    const control = pickControl(event);
    highlightControl(control);
    if (control) canvas.dataset.cursor = control.userData.controlAction.toUpperCase();
    else delete canvas.dataset.cursor;
  });

  const clearPressedControl = () => {
    if (pressedControlMesh) {
      restoreControl(pressedControlMesh);
      if (pressedControlMesh === hoveredControl && pressedControlMesh.material?.emissive) {
        pressedControlMesh.material.emissive.set(0xdfff00);
        pressedControlMesh.material.emissiveIntensity = 0.75;
      }
    }
    pressedControlAction = null;
    pressedControlMesh = null;
    delete canvas.dataset.pressed;
  };

  canvas.addEventListener("pointerleave", () => {
    if (pressedControlAction || orbitPointerId !== null) return;
    highlightControl(null);
    delete canvas.dataset.cursor;
  });

  canvas.addEventListener("pointerdown", (event) => {
    const control = pickControl(event);
    const action = control?.userData.controlAction;
    event.preventDefault();
    orbitPointerId = event.pointerId;
    orbitStartX = orbitLastX = event.clientX;
    orbitStartY = orbitLastY = event.clientY;
    orbitBaseRotationX = targetRotationX;
    orbitBaseRotationY = targetRotationY;
    orbitDragging = false;
    orbitVelocityX = 0;
    orbitVelocityY = 0;
    if (action) {
      highlightControl(control);
      pressedControlAction = action;
      pressedControlMesh = control.userData.controlMesh || control;
      canvas.dataset.pressed = action.toUpperCase();
      if (pressedControlMesh.material?.emissive) {
        pressedControlMesh.material.emissive.set(0xdfff00);
        pressedControlMesh.material.emissiveIntensity = 1.45;
      }
    }
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (_) {
      // Pointer capture is optional; touch still receives the release handler.
    }
  });

  canvas.addEventListener("pointerup", (event) => {
    const control = pickControl(event);
    const action = orbitDragging ? null : (control?.userData.controlAction || pressedControlAction);
    if (action && event.pointerId === orbitPointerId) {
      event.preventDefault();
      projectViewer?.dispatchEvent(new CustomEvent("project-control", { detail: { action } }));
    }
    orbitPointerId = null;
    orbitDragging = false;
    delete canvas.dataset.orbiting;
    clearPressedControl();
    try {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    } catch (_) {
      // The pointer may already have been released by the browser.
    }
    if (coarsePointer) {
      highlightControl(null);
      delete canvas.dataset.cursor;
    }
  });

  canvas.addEventListener("pointercancel", () => {
    orbitPointerId = null;
    orbitDragging = false;
    orbitVelocityX = 0;
    orbitVelocityY = 0;
    delete canvas.dataset.orbiting;
    clearPressedControl();
    highlightControl(null);
    delete canvas.dataset.cursor;
  });

  canvas.addEventListener("dblclick", (event) => {
    if (pickControl(event)) return;
    targetRotationX = 0;
    targetRotationY = 0;
    orbitVelocityX = 0;
    orbitVelocityY = 0;
    canvas.dataset.rotation = "0.00";
  });

  const clock = new THREE.Clock();
  let lastScreenPaint = 0;
  const render = () => {
    requestAnimationFrame(render);
    const time = clock.getElapsedTime();
    if (modelReady) {
      if (!orbitDragging && !reduceMotion) {
        targetRotationY += orbitVelocityY;
        targetRotationX = THREE.MathUtils.clamp(targetRotationX + orbitVelocityX, -0.72, 0.72);
        orbitVelocityX *= 0.91;
        orbitVelocityY *= 0.91;
        if (Math.abs(orbitVelocityX) < 0.0001) orbitVelocityX = 0;
        if (Math.abs(orbitVelocityY) < 0.0001) orbitVelocityY = 0;
        if (orbitVelocityX || orbitVelocityY) canvas.dataset.rotation = targetRotationY.toFixed(2);
      }
      rig.rotation.x += (targetRotationX - rig.rotation.x) * 0.1;
      rig.rotation.y += (targetRotationY - rig.rotation.y) * 0.1;
      hardware.position.y += ((reduceMotion ? 0.08 : 0.08 + Math.sin(time * 0.8) * 0.045) - hardware.position.y) * 0.05;
      if (screenTexture && time - lastScreenPaint > 1 / 24) {
        paintProjectScreen();
        lastScreenPaint = time;
      }
    }
    renderer.render(scene, camera);
  };

  window.addEventListener("resize", fitCamera, { passive: true });
  fitCamera();
  render();
}
