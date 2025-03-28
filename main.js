/* main.js: Creative Surge */

// Global variables
let scene, camera, renderer;
let player, targetX;
let obstacles = [];
let orbs = [];
let score = 0;
let gameOver = false;
let gameSpeed = 0.1; // Initial game speed
let lastTime = performance.now();
let obstacleTimer = 0;
let orbTimer = 0;

// Initialise Three.js Scene
function init() {
  scene = new THREE.Scene();

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 20);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 50, 50);
  scene.add(directionalLight);

  // Create ground plane
  const groundGeometry = new THREE.PlaneGeometry(20, 1000);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -500;
  scene.add(ground);

  // Create player cube
  const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
  const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.set(0, 0.5, 10);
  scene.add(player);
  targetX = player.position.x;

  // Add event listeners
  document.addEventListener('keydown', onKeyDown);

  // Start the game loop
  animate();
}

// Handle keydown events
function onKeyDown(event) {
  if (!gameOver) {
    const step = 1;
    if (event.key === 'ArrowLeft' || event.key === 'a') {
      targetX = Math.max(targetX - step, -8);
    } else if (event.key === 'ArrowRight' || event.key === 'd') {
      targetX = Math.min(targetX + step, 8);
    }
  } else if (gameOver && event.key === ' ') {
    restartGame();
  }
}

// Function to generate an obstacle
function generateObstacle() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.x = (Math.random() - 0.5) * 16;
  obstacle.position.y = 0.5;
  // Position obstacle ahead of the player
  obstacle.position.z = player.position.z - 50;
  scene.add(obstacle);
  obstacles.push(obstacle);
}

// Function to generate an Inspiration Orb
function generateOrb() {
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const orb = new THREE.Mesh(geometry, material);
  orb.position.x = (Math.random() - 0.5) * 16;
  orb.position.y = 0.5;
  orb.position.z = player.position.z - 70;
  scene.add(orb);
  orbs.push(orb);
}

// Collision detection function using bounding boxes
function checkCollisions(object) {
  const playerBox = new THREE.Box3().setFromObject(player);
  const objectBox = new THREE.Box3().setFromObject(object);
  return playerBox.intersectsBox(objectBox);
}

// Trigger game over state
function triggerGameOver() {
  gameOver = true;
  document.getElementById('gameOver').style.display = 'block';
}

// Restart the game
function restartGame() {
  // Reset game variables
  gameOver = false;
  score = 0;
  gameSpeed = 0.1;
  // Remove obstacles
  obstacles.forEach(obs => scene.remove(obs));
  obstacles = [];
  // Remove orbs
  orbs.forEach(orb => scene.remove(orb));
  orbs = [];
  // Reset player position
  player.position.set(0, 0.5, 10);
  targetX = player.position.x;
  document.getElementById('gameOver').style.display = 'none';
  lastTime = performance.now();
  animate();
}

// Main game loop
function animate() {
  if (gameOver) return;

  requestAnimationFrame(animate);

  // Calculate delta time
  let currentTime = performance.now();
  let deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Update score based on time/distance (normalised to 60fps)
  score += gameSpeed * (deltaTime / 16.67);
  document.getElementById('score').innerText = 'Score: ' + Math.floor(score);

  // Smoothly move the player towards targetX
  player.position.x += (targetX - player.position.x) * 0.1;

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.position.z += gameSpeed * (deltaTime / 16.67);
    // Remove obstacles that have passed the player
    if (obs.position.z > camera.position.z + 10) {
      scene.remove(obs);
      obstacles.splice(i, 1);
    } else if (checkCollisions(obs)) {
      triggerGameOver();
    }
  }

  // Update orbs
  for (let i = orbs.length - 1; i >= 0; i--) {
    let orb = orbs[i];
    orb.position.z += gameSpeed * (deltaTime / 16.67);
    // Remove orbs that have passed the player
    if (orb.position.z > camera.position.z + 10) {
      scene.remove(orb);
      orbs.splice(i, 1);
    } else if (checkCollisions(orb)) {
      // Play a sound effect if available (ensure orb-collect.mp3 is in your folder)
      // new Audio('orb-collect.mp3').play();
      score += 50; // Bonus points for collecting an orb
      scene.remove(orb);
      orbs.splice(i, 1);
    }
  }

  // Update spawn timers
  obstacleTimer -= deltaTime;
  orbTimer -= deltaTime;
  if (obstacleTimer <= 0) {
    generateObstacle();
    obstacleTimer = 1500 / gameSpeed; // Adjust interval as speed increases
  }
  if (orbTimer <= 0) {
    generateOrb();
    orbTimer = 3000 / gameSpeed;
  }

  // Gradually increase game speed to ramp up difficulty
  gameSpeed += 0.0001 * deltaTime;

  renderer.render(scene, camera);
}

// Handle window resize events
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
init();
