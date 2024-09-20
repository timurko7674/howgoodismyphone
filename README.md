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

    select, button {
      padding: 10px;
      font-size: 16px;
    }

    .options {
      margin-bottom: 10px;
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
      </select>
    </div>
    
    <button id="startBtn">Start Test</button>
    <p id="fpsDisplay">FPS: 0</p>
  </div>

  <canvas id="testCanvas"></canvas>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="js/fpsMeter.js"></script>
  <script>
    let scene, camera, renderer;
    let cubes = [];
    let fpsMeter;
    
    document.getElementById('startBtn').addEventListener('click', function() {
      const device = document.getElementById('device').value;
      const complexity = document.getElementById('complexity').value;
      startTest(device, complexity);
    });

    function startTest(device, complexity) {
      // Clear the scene if already running
      if (scene) {
        cubes.forEach(cube => scene.remove(cube));
        cubes = [];
      }

      // Create the scene
      scene = new THREE.Scene();
      const canvas = document.getElementById('testCanvas');

      // Create the camera based on the selected device
      let aspect = window.innerWidth / window.innerHeight;
      if (device === 'phone') {
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      } else if (device === 'laptop') {
        camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
      } else {
        camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
      }
      
      // Setup renderer
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setSize(window.innerWidth / 1.5, window.innerHeight / 1.5);
      
      // Create cubes based on complexity
      let numObjects;
      if (complexity === 'easy') {
        numObjects = 50;
      } else if (complexity === 'medium') {
        numObjects = 200;
      } else {
        numObjects = 500;
      }

      // Generate random cubes
      for (let i = 0; i < numObjects; i++) {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.x = (Math.random() - 0.5) * 20;
        cube.position.y = (Math.random() - 0.5) * 20;
        cube.position.z = (Math.random() - 0.5) * 20;

        scene.add(cube);
        cubes.push(cube);
      }

      camera.position.z = 10;

      // Initialize FPS meter
      fpsMeter = new FPSMeter();

      // Start rendering loop
      animate();
    }

    function animate() {
      requestAnimationFrame(animate);

      // Rotate each cube
      cubes.forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });

      // Render the scene
      renderer.render(scene, camera);

      // Calculate and display FPS
      const fps = fpsMeter.getFPS();
      document.getElementById('fpsDisplay').innerText = 'FPS: ' + fps;
    }
  </script>
</body>
</html>
