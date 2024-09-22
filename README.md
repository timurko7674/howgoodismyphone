<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Device Performance Test</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: Arial, sans-serif;
      background-color: #f0f0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    canvas {
      display: block;
      margin-top: 20px;
      background-color: #333;
    }

    .info {
      margin-bottom: 10px;
      text-align: center;
    }

    select, button, input, label {
      padding: 10px;
      font-size: 16px;
    }

    .options {
      margin-bottom: 10px;
    }

    #customSettings, #warnings {
      display: none;
      margin-top: 10px;
    }

    #warnings {
      color: red;
    }

    .checkbox-group {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .checkbox-group label {
      margin-right: 10px;
    }

    .checkbox-group input[type="number"] {
      width: 60px;
    }
  </style>
</head>
<body>
  <div class="info">
    <h1>Test Your Device Performance</h1>

    <div class="options">
      <label for="device">Select your device:</label>
      <select id="device">
        <option value="pc">PC</option>
        <option value="laptop">Laptop</option>
        <option value="phone">Phone</option>
        <option value="tablet">Tablet</option> <!-- Added tablet option -->
      </select>
    </div>

    <div class="options">
      <label for="complexity">Select rendering complexity:</label>
      <select id="complexity">
        <option value="easy">Easy (Low number of objects)</option>
        <option value="medium">Medium (Moderate number of objects)</option>
        <option value="hard">Hard (High number of objects)</option>
        <option value="superhard">Super Hard (Massive number of objects)</option>
        <option value="custom">Custom (Define your own settings)</option> <!-- Custom option -->
      </select>
    </div>

    <div id="customSettings">
      <h3>Custom Settings:</h3>

      <!-- Cube settings on one line -->
      <div class="checkbox-group">
        <input type="checkbox" id="useCubes">
        <label for="useCubes">Enable custom number of cubes:</label>
        <input type="number" id="customCubes" min="0" value="0">
      </div>

      <!-- Smoke settings on one line -->
      <div class="checkbox-group">
        <input type="checkbox" id="useSmoke">
        <label for="useSmoke">Enable custom number of smoke particles:</label>
        <input type="number" id="customSmoke" min="0" value="0">
      </div>
    </div>

    <div class="options">
      <label for="testDuration">Test duration (seconds):</label>
      <input type="number" id="testDuration" min="1" value="10">
    </div>

    <button id="startBtn">Start Test</button>
    <p id="fpsDisplay">FPS: 0</p>
    <p id="result" style="font-weight: bold;"></p>
    <p id="timeToRender">Time to Render Cubes: 0 ms</p>

    <div id="warnings">Please enable at least one option and provide a value greater than 0.</div>
  </div>

  <canvas id="testCanvas"></canvas>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    let scene, camera, renderer;
    let cubes = [];
    let smokeParticles = [];
    let testRunning = false;
    let startTime, fpsCounter, lastTime, frameCount = 0, renderEndTime;

    document.getElementById('complexity').addEventListener('change', function() {
      const complexity = document.getElementById('complexity').value;
      document.getElementById('customSettings').style.display = (complexity === 'custom') ? 'block' : 'none';
    });

    document.getElementById('startBtn').addEventListener('click', function() {
      const device = document.getElementById('device').value;
      const complexity = document.getElementById('complexity').value;
      const testDuration = parseInt(document.getElementById('testDuration').value) * 1000; // Convert seconds to ms

      const useCubes = document.getElementById('useCubes').checked;
      const useSmoke = document.getElementById('useSmoke').checked;

      const customCubes = parseInt(document.getElementById('customCubes').value, 10);
      const customSmoke = parseInt(document.getElementById('customSmoke').value, 10);

      if (complexity === 'custom' && !validateCustomSettings(useCubes, useSmoke, customCubes, customSmoke)) {
        document.getElementById('warnings').style.display = 'block';
        return;
      }

      document.getElementById('warnings').style.display = 'none';
      startTest(device, complexity, customCubes, customSmoke, useCubes, useSmoke, testDuration);
    });

    function validateCustomSettings(useCubes, useSmoke, customCubes, customSmoke) {
      // Ensure at least one checkbox is checked and that the number is greater than 0
      if ((useCubes && customCubes > 0) || (useSmoke && customSmoke > 0)) {
        return true;
      }
      return false;
    }

    function startTest(device, complexity, customCubes = 0, customSmoke = 0, useCubes = false, useSmoke = false, testDuration) {
      // Re-enable device selection after the test finishes
      document.getElementById('device').disabled = true;
      document.getElementById('startBtn').disabled = true;

      // Clear previous scene and objects
      if (scene) {
        cubes.forEach(cube => scene.remove(cube));
        smokeParticles.forEach(smoke => scene.remove(smoke));
        cubes = [];
        smokeParticles = [];
      }

      document.getElementById('fpsDisplay').innerText = 'FPS: 0';
      document.getElementById('result').innerText = '';
      document.getElementById('timeToRender').innerText = '';

      // Create the scene
      scene = new THREE.Scene();
      const canvas = document.getElementById('testCanvas');
      const aspect = window.innerWidth / window.innerHeight;

      // Camera setup based on device type
      if (device === 'phone') {
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      } else if (device === 'laptop') {
        camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
      } else if (device === 'tablet') {
        camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000); // Camera setup for tablet
      } else {
        camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
      }

      camera.position.z = 5;

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth / 1.5, window.innerHeight / 1.5);

      // Measure time to render cubes/smoke
      startTime = performance.now();
      generateObjects(complexity, customCubes, customSmoke, useCubes, useSmoke);

      renderEndTime = performance.now();
      document.getElementById('timeToRender').innerText = `Time to Render Objects: ${(renderEndTime - startTime).toFixed(2)} ms`;

      // Start the animation
      fpsCounter = setInterval(updateFPS, 1000);
      animate(testDuration);
    }

    function generateObjects(complexity, customCubes, customSmoke, useCubes, useSmoke) {
      let numCubes = 0;
      let numSmoke = 0;

      if (complexity === 'easy') {
        numCubes = 500;
      } else if (complexity === 'medium') {
        numCubes = 200;
      } else if (complexity === 'hard') {
        numCubes = 5000;
      } else if (complexity === 'superhard') {
        numCubes = 15000;
        numSmoke = 1500
      } else if (complexity === 'custom') {
        if (useCubes) numCubes = customCubes;
        if (useSmoke) numSmoke = customSmoke;
      }

      // Create cubes
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      for (let i = 0; i < numCubes; i++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = (Math.random() - 0.5) * 10;
        cube.position.y = (Math.random() - 0.5) * 10;
        cube.position.z = (Math.random() - 0.5) * 10;
        scene.add(cube);
        cubes.push(cube);
      }

      // Create smoke particles if enabled
      if (numSmoke > 0) {
        createSmoke(numSmoke);
      }
    }

    function createSmoke(numParticles) {
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x808080 });
      for (let i = 0; i < numParticles; i++) {
        const smoke = new THREE.Mesh(geometry, material);
        smoke.position.x = (Math.random() - 0.5) * 10;
        smoke.position.y = (Math.random() - 0.5) * 10;
        smoke.position.z = (Math.random() - 0.5) * 10;
        scene.add(smoke);
        smokeParticles.push(smoke);
      }
    }

    function animate(testDuration) {
      lastTime = performance.now();

      const testEndTime = performance.now() + testDuration;
      function loop() {
        const now = performance.now();
        if (now >= testEndTime) {
          endTest();
          return;
        }

        requestAnimationFrame(loop);

        cubes.forEach(cube => {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
        });

        renderer.render(scene, camera);

        frameCount++;
      }

      loop();
    }

    function updateFPS() {
      const now = performance.now();
      const fps = (frameCount / ((now - lastTime) / 1000)).toFixed(2);
      document.getElementById('fpsDisplay').innerText = `FPS: ${fps}`;
      frameCount = 0;
      lastTime = now;
    }

    function endTest() {
      clearInterval(fpsCounter);
      document.getElementById('result').innerText = "Test completed!";
      document.getElementById('device').disabled = false; // Allow re-selection of the device
      document.getElementById('startBtn').disabled = false;
    }
  </script>
</body>
</html>
