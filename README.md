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

    select, button, input {
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
      </select>
    </div>

    <div class="options">
      <label for="complexity">Select rendering complexity:</label>
      <select id="complexity">
        <option value="easy">Easy (Low number of objects)</option>
        <option value="medium">Medium (Moderate number of objects)</option>
        <option value="hard">Hard (High number of objects)</option>
        <option value="custom">Custom (Define your own settings)</option>
      </select>
    </div>

    <div id="customSettings">
      <h3>Custom Settings:</h3>

      <div>
        <input type="checkbox" id="cubeCheckbox"> Render Cubes
        <label for="customCubes">Number of cubes:</label>
        <input type="number" id="customCubes" min="0" value="0">
      </div>

      <div>
        <input type="checkbox" id="smokeCheckbox"> Render Smoke
        <label for="customSmoke">Number of smoke particles:</label>
        <input type="number" id="customSmoke" min="0" value="0">
      </div>
    </div>

    <button id="startBtn">Start Test</button>
    <p id="cubeCountDisplay">Cubes: 0</p>
    <p id="fpsDisplay">FPS: 0</p>
    <p id="result" style="font-weight: bold;"></p>
    <p id="timeToRender">Time to Render Cubes: 0 ms</p>

    <div id="warnings" style="color: red;">Please pick at least one valid option (cubes or smoke) and set the amount to be greater than 0.</div>
  </div>

  <canvas id="testCanvas"></canvas>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    let scene, camera, renderer;
    let cubes = [];
    let smokeParticles = [];
    let fpsMeter, maxFPS = 0;
    let testDuration = 60000; // 60 seconds
    let cubeRenderTime, testStartTime, timeToRenderComplete = 0;
    let testRunning = false, cubesRendered = 0;
    let startCubeRenderTime;

    document.getElementById('complexity').addEventListener('change', function() {
      const complexity = document.getElementById('complexity').value;
      document.getElementById('customSettings').style.display = (complexity === 'custom') ? 'block' : 'none';
    });

    document.getElementById('startBtn').addEventListener('click', function() {
      const device = document.getElementById('device').value;
      const complexity = document.getElementById('complexity').value;
      const customCubes = parseInt(document.getElementById('customCubes').value, 10);
      const customSmoke = parseInt(document.getElementById('customSmoke').value, 10);
      const cubeChecked = document.getElementById('cubeCheckbox').checked;
      const smokeChecked = document.getElementById('smokeCheckbox').checked;

      // Validate the user input
      if (complexity === 'custom' && (!cubeChecked && !smokeChecked)) {
        document.getElementById('warnings').style.display = 'block';
        return;
      }

      if (complexity === 'custom' && ((cubeChecked && customCubes === 0) || (smokeChecked && customSmoke === 0))) {
        document.getElementById('warnings').style.display = 'block';
        return;
      }

      document.getElementById('warnings').style.display = 'none';

      startTest(device, complexity, customCubes, customSmoke, cubeChecked, smokeChecked);
    });

    function startTest(device, complexity, customCubes, customSmoke, cubeChecked, smokeChecked) {
      // Clear previous scene and cubes
      if (scene) {
        cubes.forEach(cube => scene.remove(cube));
        smokeParticles.forEach(smoke => scene.remove(smoke));
        cubes = [];
        smokeParticles = [];
      }

      document.getElementById('result').innerText = '';
      document.getElementById('cubeCountDisplay').innerText = 'Cubes: 0';
      document.getElementById('fpsDisplay').innerText = 'FPS: 0';
      document.getElementById('timeToRender').innerText = '';

      cubesRendered = 0;

      // Create the scene
      scene = new THREE.Scene();
      const canvas = document.getElementById('testCanvas');

      // Camera setup based on device type
      let aspect = window.innerWidth / window.innerHeight;
      if (device === 'phone') {
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      } else if (device === 'laptop') {
        camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
      } else {
        camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
      }

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth / 1.5, window.innerHeight / 1.5);

      let numCubes = 0, numSmoke = 0;

      // Select number of objects based on complexity
      if (complexity === 'easy') {
        numCubes = 50;
      } else if (complexity === 'medium') {
        numCubes = 200;
      } else if (complexity === 'hard') {
        numCubes = 500;
      } else if (complexity === 'custom') {
        if (cubeChecked) {
          numCubes = customCubes;
        }
        if (smokeChecked) {
          numSmoke = customSmoke;
        }
      }

      startCubeRenderTime = Date.now();

      // Generate cubes
      generateCubes(numCubes, complexity);
      if (numSmoke > 0) createSmoke(numSmoke);  // Add smoke if selected
    }

    function generateCubes(numCubes, complexity) {
      const cubeInterval = setInterval(() => {
        if (cubesRendered < numCubes) {
          // Create one cube at a time
          const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
          const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.x = (Math.random() - 0.5) * 20;
          cube.position.y = (Math.random() - 0.5) * 20;
          cube.position.z = (Math.random() - 0.5) * 20;

          scene.add(cube);
          cubes.push(cube);
          cubesRendered++;

          document.getElementById('cubeCountDisplay').innerText = `Cubes: ${cubesRendered}`;
        }

        if (cubesRendered === numCubes) {
          clearInterval(cubeInterval);

          cubeRenderTime = Date.now();
          timeToRenderComplete = cubeRenderTime - startCubeRenderTime;
          document.getElementById('timeToRender').innerText = `Time to Render Cubes: ${timeToRenderComplete} ms`;

          startFPSMeter(); // Start tracking FPS after cube rendering is complete
        }
      }, 10);
    }

    function createSmoke(numSmoke) {
      // Placeholder: Add code to generate smoke particles if enabled
      // For simplicity, you can make smoke basic spheres or other shapes
    }

    function startFPSMeter() {
      testRunning = true;
      fpsMeter = new FPSMeter();
      testStartTime = Date.now();

      renderer.setAnimationLoop(() => {
        if (testRunning) {
          renderScene();
          const fps = fpsMeter.getFPS();
          if (fps > maxFPS) {
            maxFPS = fps;
          }
          document.getElementById('fpsDisplay').innerText = `FPS: ${fps}`;

          if (Date.now() - testStartTime >= testDuration) {
            endTest();
          }
        }
      });
    }

    function renderScene() {
      renderer.render(scene, camera);
    }

    function endTest() {
      testRunning = false;
      document.getElementById('result').innerText = `Test Finished! Highest FPS: ${maxFPS}`;
    }

    // FPSMeter class
    class FPSMeter {
      constructor() {
        this.lastTime = performance.now();
        this.frames = 0;
        this.fps = 0;
      }

      getFPS() {
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
          this.fps = Math.round((this.frames / delta) * 1000);
          this.frames = 0;
          this.lastTime = now;
        }

        this.frames++;
        return this.fps;
      }
    }
  </script>
</body>
</html>
