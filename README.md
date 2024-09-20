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

    #cubeAmount {
      display: none;
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
        <option value="superHard">Super Hard (Custom cubes and smoke)</option>
      </select>
    </div>

    <div class="options" id="cubeAmount">
      <label for="customCubes">Enter number of cubes:</label>
      <input type="number" id="customCubes" min="100" max="1000" value="300">
    </div>
    
    <button id="startBtn">Start Test</button>
    <p id="cubeCountDisplay">Cubes: 0</p>
    <p id="fpsDisplay">FPS: 0</p>
    <p id="result" style="font-weight: bold;"></p>
    <p id="timeToRender">Time to Render Cubes: 0 ms</p>
  </div>

  <canvas id="testCanvas"></canvas>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="js/fpsMeter.js"></script>
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
      document.getElementById('cubeAmount').style.display = (complexity === 'superHard') ? 'block' : 'none';
    });

    document.getElementById('startBtn').addEventListener('click', function() {
      const device = document.getElementById('device').value;
      const complexity = document.getElementById('complexity').value;
      const customCubes = parseInt(document.getElementById('customCubes').value, 10);

      startTest(device, complexity, customCubes);
    });

    function startTest(device, complexity, customCubes) {
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

      // Select number of objects based on complexity
      let numObjects;
      if (complexity === 'easy') {
        numObjects = 50;
      } else if (complexity === 'medium') {
        numObjects = 200;
      } else if (complexity === 'hard') {
        numObjects = 500;
      } else if (complexity === 'superHard') {
        numObjects = customCubes;
        createSmoke();  // Add smoke in Super Hard mode
      }

      startCubeRenderTime = Date.now();

      // Generate cubes
      generateCubes(numObjects, complexity);
    }

    function generateCubes(numObjects, complexity) {
      const cubeInterval = setInterval(() => {
        if (cubesRendered < numObjects) {
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

        if (cubesRendered === numObjects) {
          clearInterval(cubeInterval);

          cubeRenderTime = Date.now();
          timeToRenderComplete = cubeRenderTime - startCubeRenderTime;
          document.getElementById('timeToRender').innerText = `Time to Render Cubes: ${timeToRenderComplete} ms`;

          startFPSMeter(); // Start tracking FPS after cube rendering is complete
        }
      }, 10);  // Adjust this interval for smoother cube rendering
    }

    function startFPSMeter() {
      fpsMeter = new FPSMeter();
      maxFPS = 0;

      testStartTime = Date.now();
      testRunning = true;
      animate();  // Start the animation loop
    }

    function createSmoke() {
      const smokeTexture = new THREE.TextureLoader().load('https://threejsfundamentals.org/threejs/resources/images/smoke.png');
      const smokeMaterial = new THREE.SpriteMaterial({ map: smokeTexture });

      for (let i = 0; i < 100; i++) {
        const smoke = new THREE.Sprite(smokeMaterial);
        smoke.position.x = (Math.random() - 0.5) * 20;
        smoke.position.y = (Math.random() - 0.5) * 20;
        smoke.position.z = (Math.random() - 0.5) * 20;
        smoke.scale.set(3, 3, 3);

        scene.add(smoke);
        smokeParticles.push(smoke);
      }
    }

    function animate() {
      if (!testRunning) return;

      requestAnimationFrame(animate);

      // Rotate the cubes
      cubes.forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });

      // Render the scene
      renderer.render(scene, camera);

      // Calculate real-time FPS
      const fps = fpsMeter.getFPS();
      document.getElementById('fpsDisplay').innerText = 'FPS: ' + fps;
      if (fps > maxFPS) maxFPS = fps;

      // Check if 60 seconds have passed since cube rendering completion
      if (Date.now() - testStartTime >= testDuration) {
        endTest();
      }
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
