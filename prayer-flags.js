// Prayer Flags — Three.js animated cloth simulation
(function() {
  const container = document.getElementById('prayer-flags');
  if (!container) return;

  const scene = new THREE.Scene();

  // Camera — orthographic-ish perspective for subtle depth
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.3, 4.2);
  camera.lookAt(0, -0.1, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xfff8f0, 0.7);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0xfff0e0, 0.2);
  backLight.position.set(-1, 1, -2);
  scene.add(backLight);

  // Prayer flag colors: blue, white, red, green, yellow
  const colors = [0x2B5797, 0xE8E4DF, 0xAA2222, 0x3A7D44, 0xD4A827];
  const flagCount = 5;
  const flagW = 1.1;
  const flagH = 0.85;
  const segW = 20;
  const segH = 15;
  const spacing = 1.25;
  const totalWidth = (flagCount - 1) * spacing;

  const flags = [];
  const ropePoints = [];

  // String/rope
  const ropeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-totalWidth / 2 - 0.8, 0.55, 0),
    new THREE.Vector3(-totalWidth / 4, 0.48, 0.05),
    new THREE.Vector3(0, 0.45, 0),
    new THREE.Vector3(totalWidth / 4, 0.48, -0.05),
    new THREE.Vector3(totalWidth / 2 + 0.8, 0.55, 0)
  ]);
  const ropeGeo = new THREE.TubeGeometry(ropeCurve, 40, 0.012, 6, false);
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
  scene.add(new THREE.Mesh(ropeGeo, ropeMat));

  for (var i = 0; i < flagCount; i++) {
    var geo = new THREE.PlaneGeometry(flagW, flagH, segW, segH);

    // Store original positions
    var posAttr = geo.attributes.position;
    var origY = new Float32Array(posAttr.count);
    for (var j = 0; j < posAttr.count; j++) {
      origY[j] = posAttr.getY(j);
    }
    geo.userData = { origY: origY };

    var mat = new THREE.MeshStandardMaterial({
      color: colors[i],
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0.0,
      transparent: true,
      opacity: 0.92
    });

    var mesh = new THREE.Mesh(geo, mat);
    var xPos = -totalWidth / 2 + i * spacing;
    mesh.position.set(xPos, 0, 0);
    mesh.userData.xOffset = xPos;
    mesh.userData.phaseOffset = i * 0.7;
    scene.add(mesh);
    flags.push(mesh);
  }

  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    for (var f = 0; f < flags.length; f++) {
      var mesh = flags[f];
      var geo = mesh.geometry;
      var pos = geo.attributes.position;
      var origY = geo.userData.origY;
      var phase = mesh.userData.phaseOffset;

      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i);
        var y = origY[i];

        // Normalized position (0 at top-left attached edge, 1 at free bottom-right)
        var nx = (x / flagW) + 0.5; // 0 to 1 across width
        var ny = 1.0 - ((y / flagH) + 0.5); // 0 at top, 1 at bottom

        // Wind wave — increases toward free end (right side) and bottom
        var freedom = nx * 0.7 + ny * 0.3;
        var wave1 = Math.sin(nx * 4.0 + t * 1.8 + phase) * 0.12 * freedom;
        var wave2 = Math.sin(nx * 7.0 + t * 2.5 + phase * 1.3) * 0.04 * freedom;
        var wave3 = Math.cos(ny * 3.0 + t * 1.2 + phase * 0.7) * 0.03 * freedom;

        pos.setZ(i, wave1 + wave2 + wave3);

        // Subtle vertical sway on bottom edge
        var sway = Math.sin(t * 1.0 + nx * 2.0 + phase) * 0.015 * ny;
        pos.setY(i, y + sway);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', function() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
})();
