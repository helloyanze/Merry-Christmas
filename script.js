/**
 * Three.js 3D 圣诞树 - 烟花点直接螺旋生长版
 */

// --- 音乐播放逻辑 ---
const bgMusic = document.getElementById("bgMusic");
const endMessage = document.getElementById("endMessage");

// --- Three.js 场景逻辑 ---
const initThreeJS = () => {
  const container = document.getElementById("canvas-container");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090a0f, 0.002);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 60;
  camera.position.y = 10;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  function createParticleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  const particleTexture = createParticleTexture();

  // 3. 粒子系统
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  
  // 初始化数组
  const positions = new Float32Array(particleCount * 3);
  const colors = [];
  const sizes = [];
  const particleTargets = [];
  
  // 物理系统数组
  const targetPositions = new Float32Array(particleCount * 3); // Tween的目标位置（"家"）
  const velocities = new Float32Array(particleCount * 3);      // 物理速度
  const physicsOffsets = new Float32Array(particleCount * 3);  // 物理偏移

  const colorPalette = [
    new THREE.Color("#ff0000"),
    new THREE.Color("#00ff00"),
    new THREE.Color("#ffff00"),
    new THREE.Color("#00ffff"),
    new THREE.Color("#ff00ff"),
  ];

  const treeHeight = 40;
  const treeRadius = 15;

  for (let i = 0; i < particleCount; i++) {
    // 初始位置：全部在底部中心 (发射点)
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -30;
    positions[i * 3 + 2] = 0;
    
    // 初始化目标位置也为起点
    targetPositions[i * 3] = 0;
    targetPositions[i * 3 + 1] = -30;
    targetPositions[i * 3 + 2] = 0;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors.push(color.r, color.g, color.b);
    sizes.push(Math.random() * 1.5 + 0.5);

    // 计算螺旋目标
    const ratio = i / particleCount;
    const baseAngle = ratio * Math.PI * 25;
    const y = ratio * treeHeight - treeHeight / 2;
    const r = (1 - ratio) * treeRadius;
    const randomAngleOffset = (Math.random() - 0.5) * 0.5;
    const randomRadiusOffset = (Math.random() - 0.5) * 2;
    const finalAngle = baseAngle + randomAngleOffset;
    const finalRadius = Math.max(0, r + randomRadiusOffset);

    particleTargets.push({
      r: finalRadius,
      theta: finalAngle,
      y: y,
    });
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    map: particleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0, // 初始隐藏
  });

  const particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // 树顶星星
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, treeHeight / 2 + 1, 0], 3)
  );
  const starMat = new THREE.PointsMaterial({
    size: 0.0,
    color: 0xffff00,
    map: particleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const topStar = new THREE.Points(starGeo, starMat);
  scene.add(topStar);

  // 发射点提示
  const launchGeo = new THREE.BufferGeometry();
  launchGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, -30, 0], 3)
  );
  const launchMat = new THREE.PointsMaterial({
    size: 5.0,
    color: 0xffffff,
    map: particleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 1,
  });
  const launcher = new THREE.Points(launchGeo, launchMat);
  scene.add(launcher);

  const tip = document.createElement("div");
  tip.innerText = "点击 🎆 燃放烟花";
  tip.className =
    "absolute z-30 text-white text-2xl animate-pulse cursor-pointer select-none";
  tip.style.bottom = "15%";
  tip.style.left = "50%";
  tip.style.transform = "translateX(-50%)";
  tip.style.fontFamily = "'ZCOOL KuaiLe', cursive";
  document.body.appendChild(tip);

  // 下雪系统
  const snowCount = 1000;
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = [];
  for (let i = 0; i < snowCount; i++)
    snowPos.push(
      Math.random() * 200 - 100,
      Math.random() * 100 - 50,
      Math.random() * 200 - 100
    );
  snowGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(snowPos, 3)
  );
  const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.8,
    map: particleTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const snowSystem = new THREE.Points(snowGeo, snowMat);
  scene.add(snowSystem);

  // --- 状态与动画 ---
  let state = "IDLE";

  // 渲染循环变量
  let mouseX = 0,
    mouseY = 0;
  let time = 0;

  // --- 交互逻辑 (Raycaster & Physics) ---
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 5.0; // 增大检测半径
  const pointer = new THREE.Vector2(999, 999);
  
  // 鼠标移动向量 (NDC)
  let lastPointerX = 999;
  let lastPointerY = 999;
  let pointerVelocity = new THREE.Vector2(0, 0);

  // 备份原始粒子大小
  const originalSizes = new Float32Array(sizes);

  function onPointerMove(event) {
    const clientX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
    const clientY = event.clientY || (event.touches ? event.touches[0].clientY : 0);

    const newX = (clientX / window.innerWidth) * 2 - 1;
    const newY = -(clientY / window.innerHeight) * 2 + 1;

    // 计算鼠标速度
    if (lastPointerX !== 999) {
        pointerVelocity.x = newX - lastPointerX;
        pointerVelocity.y = newY - lastPointerY;
    }
    
    pointer.x = newX;
    pointer.y = newY;
    
    lastPointerX = newX;
    lastPointerY = newY;

    if (!event.touches) {
      mouseX = (clientX - window.innerWidth / 2) * 0.001;
      mouseY = (clientY - window.innerHeight / 2) * 0.001;
    }
  }

  // 绑定交互事件
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("touchmove", onPointerMove, { passive: false });

  // 重力感应处理
  const handleOrientation = (event) => {
    const gamma = event.gamma;
    const beta = event.beta;
    if (gamma === null || beta === null) return;
    const clampedGamma = Math.max(-45, Math.min(45, gamma));
    const clampedBeta = Math.max(15, Math.min(105, beta)); 
    mouseX = clampedGamma / 90;
    mouseY = (beta - 60) / 90;
  };

  const startShow = () => {
    if (state !== "IDLE") return;
    state = "FORMING";

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    tip.style.display = "none";
    scene.remove(launcher);
    if (bgMusic) {
      bgMusic.volume = 0.5;
      bgMusic.play().catch((e) => console.log("Audio play failed", e));
    }

    material.opacity = 1;
    new TWEEN.Tween(snowMat).to({ opacity: 0.8 }, 2000).start();
    animateTreeGrowth();
  };

  document.addEventListener("click", startShow);
  document.addEventListener("touchstart", startShow);

  function animateTreeGrowth() {
    particleTargets.forEach((target, i) => {
      const animState = {
        r: 0,
        theta: target.theta - Math.PI * 6,
        y: -30,
      };

      const delay = i * 1.5;
      const duration = 2000 + Math.random() * 500;

      new TWEEN.Tween(animState)
        .to(
          {
            r: target.r,
            theta: target.theta,
            y: target.y,
          },
          duration
        )
        .delay(delay)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          // 只更新目标位置，不直接操作 geometry
          const x = animState.r * Math.cos(animState.theta);
          const z = animState.r * Math.sin(animState.theta);
          
          targetPositions[i * 3] = x;
          targetPositions[i * 3 + 1] = animState.y;
          targetPositions[i * 3 + 2] = z;
        })
        .start();
    });

    setTimeout(() => {
      new TWEEN.Tween(topStar.material)
        .to({ size: 4.0 }, 1000)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
      if (endMessage) endMessage.style.opacity = 1;
    }, particleCount * 1.5 + 2000);
  }

  const animate = (t) => {
    requestAnimationFrame(animate);
    TWEEN.update(t);
    time += 0.01;

    // 自动旋转
    if (state === "FORMING") {
      particleSystem.rotation.y += 0.002;
    }

    if (state === "FORMING") {
        raycaster.setFromCamera(pointer, camera);
        const ray = raycaster.ray;

        // 物理参数：纯流体无弹性
        const repulsionRadius = 3.5;
        const repulsionForce = 0.5;
        const friction = 0.92;
        const returnSpeed = 0.02; // 极缓慢的线性回归速度 (无弹簧力)

        const positionsArray = geometry.attributes.position.array;
        
        // Ray 转到 Object Space
        const inverseMatrix = new THREE.Matrix4().copy(particleSystem.matrixWorld).invert();
        const localRay = ray.clone().applyMatrix4(inverseMatrix);
        const closestPoint = new THREE.Vector3();

        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            
            // 粒子当前位置（含物理偏移）
            const px = targetPositions[idx] + physicsOffsets[idx];
            const py = targetPositions[idx + 1] + physicsOffsets[idx + 1];
            const pz = targetPositions[idx + 2] + physicsOffsets[idx + 2];
            const pVec = new THREE.Vector3(px, py, pz);

            // 1. 计算鼠标排斥力 (只影响速度)
            const distSq = localRay.distanceSqToPoint(pVec);
            if (distSq < repulsionRadius * repulsionRadius) {
                const dist = Math.sqrt(distSq);
                localRay.closestPointToPoint(pVec, closestPoint);
                const dir = new THREE.Vector3().subVectors(pVec, closestPoint).normalize();
                if (dir.lengthSq() < 0.001) dir.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
                
                const factor = (1 - dist / repulsionRadius);
                const randomScale = 0.8 + Math.random() * 0.4;
                
                velocities[idx] += dir.x * factor * repulsionForce * randomScale;
                velocities[idx + 1] += dir.y * factor * repulsionForce * randomScale;
                velocities[idx + 2] += dir.z * factor * repulsionForce * randomScale;
            }

            // 2. 摩擦力 (自然减速)
            velocities[idx] *= friction;
            velocities[idx + 1] *= friction;
            velocities[idx + 2] *= friction;

            // 3. 更新偏移量 (由速度驱动)
            physicsOffsets[idx] += velocities[idx];
            physicsOffsets[idx + 1] += velocities[idx + 1];
            physicsOffsets[idx + 2] += velocities[idx + 2];

            // 4. 缓慢回归 (线性插值，无弹簧物理，模拟"飘"回去)
            // 只有当没有受到强力推开(速度较小)时，才显现出回归效果，避免对抗
            const speedSq = velocities[idx]*velocities[idx] + velocities[idx+1]*velocities[idx+1] + velocities[idx+2]*velocities[idx+2];
            if (speedSq < 0.01) {
                 physicsOffsets[idx] -= physicsOffsets[idx] * returnSpeed;
                 physicsOffsets[idx + 1] -= physicsOffsets[idx + 1] * returnSpeed;
                 physicsOffsets[idx + 2] -= physicsOffsets[idx + 2] * returnSpeed;
            }

            // 最终位置
            positionsArray[idx] = targetPositions[idx] + physicsOffsets[idx];
            positionsArray[idx + 1] = targetPositions[idx + 1] + physicsOffsets[idx + 1];
            positionsArray[idx + 2] = targetPositions[idx + 2] + physicsOffsets[idx + 2];
        }
        
        geometry.attributes.position.needsUpdate = true;
    }

    if (topStar.material.size > 0.1)
      topStar.material.size = 4.0 + Math.sin(time * 2) * 1.0;

    camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 50 + 10 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    if (snowMat.opacity > 0) {
      const snowPos = snowSystem.geometry.attributes.position.array;
      for (let i = 1; i < snowPos.length; i += 3) {
        snowPos[i] -= 0.1;
        if (snowPos[i] < -50) snowPos[i] = 50;
      }
      snowSystem.geometry.attributes.position.needsUpdate = true;
      snowSystem.rotation.y += 0.001;
    }

    renderer.render(scene, camera);
  };

  animate();
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

initThreeJS();

