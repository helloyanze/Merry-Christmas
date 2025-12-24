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
  const positions = [];
  const colors = [];
  const sizes = [];
  const particleTargets = [];

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
    positions.push(0, -30, 0);

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

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
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

  const startShow = () => {
    if (state !== "IDLE") return;
    state = "FORMING"; // 直接进入组成阶段

    // 尝试请求重力感应权限 (iOS 13+)
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

    // 显示粒子和雪花
    material.opacity = 1;
    new TWEEN.Tween(snowMat).to({ opacity: 0.8 }, 2000).start();

    // 直接开始生长
    animateTreeGrowth();
  };

  document.addEventListener("click", startShow);
  document.addEventListener("touchstart", startShow);

  function animateTreeGrowth() {
    const posAttribute = geometry.attributes.position;

    particleTargets.forEach((target, i) => {
      // 动画起始状态
      const animState = {
        r: 0,
        theta: target.theta - Math.PI * 6, // 旋转3圈
        y: -30, // 从发射点高度开始
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
          const x = animState.r * Math.cos(animState.theta);
          const z = animState.r * Math.sin(animState.theta);

          posAttribute.setXYZ(i, x, animState.y, z);
          posAttribute.needsUpdate = true;
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

  // 渲染循环
  let mouseX = 0,
    mouseY = 0;
  let time = 0;

  // 重力感应处理函数
  const handleOrientation = (event) => {
    const gamma = event.gamma; // 左到右 -90 到 90
    const beta = event.beta; // 前到后 -180 到 180

    if (gamma === null || beta === null) return;

    // 限制角度范围，避免过度旋转
    const clampedGamma = Math.max(-45, Math.min(45, gamma));
    const clampedBeta = Math.max(15, Math.min(105, beta)); // 假设手机竖持，倾斜范围

    // 映射到 mouseX/mouseY 的范围 (-0.5 到 0.5 左右)
    // gamma: 0 -> 0, -45 -> -0.5, 45 -> 0.5
    mouseX = clampedGamma / 90;

    // beta: 60度为中心点 (手机自然手持角度)
    // 60 -> 0, 15 -> 0.5 (向上看), 105 -> -0.5 (向下看)
    // 注意：原来的 mouseY 逻辑是 (e.clientY - height/2). 鼠标在上方(y小) -> mouseY负 -> camera.y变大(向上)
    // 这里 beta 小 (手机向后仰/屏幕朝上) -> 类似鼠标在上方
    mouseY = (beta - 60) / 90;
  };

  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
  });

  const animate = (t) => {
    requestAnimationFrame(animate);
    TWEEN.update(t);
    time += 0.01;

    if (state === "FORMING") {
      particleSystem.rotation.y += 0.002;
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
