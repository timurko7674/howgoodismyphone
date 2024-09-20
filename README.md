<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Device Performance Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    }

    #result, #fpsDisplay, #cubeCountDisplay, #timeToRender {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Rendering Performance Test</h1>
  
  <div id="settings">
    <label>Select Device Type:</label>
    <select id="deviceType">
      <option value="phone">Phone</option>
      <option value="laptop">Laptop</option>
      <option value="pc">PC</option>
      <option value="tablet">Tablet</option>
    </select>
  </div>

  <div>
    <label>Render Complexity:</label>
    <select id="complexity">
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
      <option value="superHard">Super Hard (Custom)</option>
    </select>
  </div>

  <div>
    <label>Number of Cubes:</label>
    <input type="number" id="cubeCount" min="0" value="0">
  </div>

  <div>
    <label>Number of Smoke Particles:</label>
    <input type="number" id="smokeCount" min="0" value="0">
  </div>

  <button onclick="startTest()">Start Test</button>

  <div id="cubeCountDisplay">Cubes: 0</div>
  <div id="fpsDisplay">FPS: 0</div>
  <div id="timeToRender">Time to Render Cubes: 0 ms</div>
  <div id="result"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  
  <script>
    let renderer, scene, camera;
    let maxFPS = 0;
    let cubes = [];
    let smokeParticles = [];
    let cubesRendered = 0;
    let testRunning = false;
    let testStartTime, startCubeRenderTime;
    const testDuration = 60000; // Run test for 60 seconds
    let fpsMeter, cubeRenderTime;

    // Initialize the 3D scene
    function init() {
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;
    }

    function getDeviceType() {
      return document.getElementById('deviceType').value;
    }

    function startTest() {
      const deviceType = getDeviceType();
      const complexity = document.getElementById('complexity').value;
      const numCubes = parseInt(document.getElementById('cubeCount').value);
      const numSmoke = parseInt(document.getElementById('smokeCount').value);

      if (isNaN(numCubes) || numCubes <= 0 || isNaN(numSmoke) || numSmoke <= 0) {
        alert("Please enter valid values for cubes and smoke particles.");
        return;
      }

      resetTest();
      createCubes(numCubes);
      createSmoke(numSmoke);

      let waitTime = (complexity === "superHard") ? Math.max(10000, numCubes * 5) : 10000; // Wait based on complexity or custom inputs
      setTimeout(startFPSMeter, waitTime); // Wait before starting FPS test
    }

    function resetTest() {
      // Clear the scene
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      cubes = [];
      smokeParticles = [];
      cubesRendered = 0;
      maxFPS = 0;
      testRunning = false;
      document.getElementById('cubeCountDisplay').innerText = 'Cubes: 0';
      document.getElementById('fpsDisplay').innerText = 'FPS: 0';
      document.getElementById('timeToRender').innerText = 'Time to Render Cubes: 0 ms';
      document.getElementById('result').innerText = '';
    }

    function createCubes(numCubes) {
      startCubeRenderTime = Date.now();
      let cubeInterval = setInterval(() => {
        if (cubesRendered < numCubes) {
          const geometry = new THREE.BoxGeometry();
          const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.x = (Math.random() - 0.5) * 10;
          cube.position.y = (Math.random() - 0.5) * 10;
          cube.position.z = (Math.random() - 0.5) * 10;
          cube.rotationSpeed = Math.random() * 0.05 + 0.01;
          scene.add(cube);
          cubes.push(cube);
          cubesRendered++;
          document.getElementById('cubeCountDisplay').innerText = `Cubes: ${cubesRendered}`;
        } else {
          clearInterval(cubeInterval);
          cubeRenderTime = Date.now() - startCubeRenderTime;
          document.getElementById('timeToRender').innerText = `Time to Render Cubes: ${cubeRenderTime} ms`;
        }
      }, 10);
    }

    function createSmoke(numSmoke) {
      for (let i = 0; i < numSmoke; i++) {
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x808080, opacity: 0.5, transparent: true });
        const smoke = new THREE.Mesh(geometry, material);
        smoke.position.x = (Math.random() - 0.5) * 10;
        smoke.position.y = (Math.random() - 0.5) * 10;
        smoke.position.z = (Math.random() - 0.5) * 10;
        scene.add(smoke);
        smokeParticles.push(smoke);
      }
    }

    function startFPSMeter() {
      testRunning = true;
      fpsMeter = new FPSMeter(getDeviceType());
      testStartTime = Date.now();
      renderer.setAnimationLoop(() => {
        if (testRunning) {
          renderScene();
          updateCubes();  // Spin the cubes
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

    function updateCubes() {
      cubes.forEach(cube => {
        cube.rotation.x += cube.rotationSpeed;
        cube.rotation.y += cube.rotationSpeed;
      });
    }

    function endTest() {
      testRunning = false;
      document.getElementById('result').innerText = `Test Finished! Highest FPS: ${maxFPS}`;
    }

    class FPSMeter {
      constructor(deviceType) {
        this.lastTime = performance.now();
        this.frames = 0;
        this.fps = 0;
        this.deviceType = deviceType;
      }

      getFPS() {
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
          this.fps = Math.round((this.frames / delta) * 1000);
          this.frames = 0;
          this.lastTime = now;
        }

        if (this.deviceType === 'tablet') {
          return Math.round(this.fps * 0.8); // FPS smoothing for tablets
        }
        this.frames++;
        return this.fps;
      }
    }

    // Initialize the scene
    init();

  </script>
</body>
</html>
