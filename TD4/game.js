// Game Configuration - Easy to modify parameters
const GAME_CONFIG = {
    // Player settings
    PLAYER_SPEED: 0.3,
    PLAYER_FIRE_RATE: 200, // milliseconds between shots
    PLAYER_DAMAGE: 1, // damage per bullet
    PLAYER_HEALTH: 100,
    
    // Bullet settings
    BULLET_SPEED: 0.8,
    BULLET_LIFETIME: 3000, // milliseconds
    
    // Asteroid settings
    ASTEROID_SPEED: 0.1,
    ASTEROID_SPAWN_RATE: 2000, // milliseconds
    ASTEROID_STRENGTHS: {
        LARGE: { health: 3, size: 2, speed: 0.08, points: 30 },
        MEDIUM: { health: 2, size: 1.5, speed: 0.12, points: 20 },
        SMALL: { health: 1, size: 1, speed: 0.16, points: 10 }
    },
    
    // Level settings
    LEVEL_DURATION: 30000, // 30 seconds in milliseconds
    LEVELS_COUNT: 5,
    
    // Boss settings
    BOSS_HEALTH: 50,
    BOSS_SPEED: 0.05,
    BOSS_SIZE: 4,
    BOSS_FIRE_RATE: 1000,
    
    // Power-up settings
    POWERUP_DURATION: 10000, // 10 seconds
    POWERUP_EFFECTS: {
        RAPID_FIRE: { fireRate: 100, duration: 10000 },
        SHIELD: { healthBoost: 50, duration: 10000 },
        SPEED_BOOST: { speedMultiplier: 1.5, duration: 10000 }
    },

    // Drops
    HEALTH_DROP_CHANCE: 0.05, // 5% chance on asteroid destroy
    HEALTH_DROP_AMOUNT: 20,

    // End-of-level powerups
    POWERUP_ATTACK_SPEED_MULTIPLIER: 0.8, // 20% faster
    POWERUP_ATTACK_DAMAGE_INCREMENT: 1, // +1 damage
    POWERUP_HEALTH_BOOST: 30,
    
    // Optional model URLs (set to string URLs to use models; keep null to use primitives)
    MODELS: {
        PLANES: {
            fighter: { 
                name: 'Fighter Jet', 
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
                color: [0.8, 0.8, 0.9] 
            },
            spaceship: { 
                name: 'Space Fighter', 
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
                color: [0.2, 0.8, 1.0] 
            },
            stealth: { 
                name: 'Stealth Bomber', 
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
                color: [0.3, 0.3, 0.3] 
            }
        },
        ASTEROID: { 
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb'
        },
        BOSS: { 
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb'
        },
        PLANET: { 
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb'
        }
    }
};

// Global variables
let scene, engine, camera, player, bullets = [], asteroids = [], powerUps = [], healthDrops = [];
let keys = {}; // Global keys object
let map, selectedCountry = null, selectedPlane = 'fighter';
// Preview variables
let previewScene, previewEngine, previewCamera, previewPlane;
// Cached loaded model templates
const modelCache = {
    planes: {},
    asteroid: null,
    boss: null,
    planet: null
};
let gameState = {
    level: 1,
    score: 0,
    health: GAME_CONFIG.PLAYER_HEALTH,
    timeLeft: GAME_CONFIG.LEVEL_DURATION,
    gameRunning: true,
    lastShot: 0,
    lastAsteroidSpawn: 0,
    boss: null,
    bossHealth: 0,
    powerUpActive: null,
    powerUpEndTime: 0,
    awaitingPowerup: false
};

// High Scores System
const HIGH_SCORES_KEY = 'spaceShooterHighScores';
const MAX_HIGH_SCORES = 10;

// Country data with flag URLs
const COUNTRIES = {
    'US': { name: 'United States', flag: 'https://flagcdn.com/w80/us.png' },
    'GB': { name: 'United Kingdom', flag: 'https://flagcdn.com/w80/gb.png' },
    'FR': { name: 'France', flag: 'https://flagcdn.com/w80/fr.png' },
    'DE': { name: 'Germany', flag: 'https://flagcdn.com/w80/de.png' },
    'IT': { name: 'Italy', flag: 'https://flagcdn.com/w80/it.png' },
    'ES': { name: 'Spain', flag: 'https://flagcdn.com/w80/es.png' },
    'CA': { name: 'Canada', flag: 'https://flagcdn.com/w80/ca.png' },
    'AU': { name: 'Australia', flag: 'https://flagcdn.com/w80/au.png' },
    'JP': { name: 'Japan', flag: 'https://flagcdn.com/w80/jp.png' },
    'BR': { name: 'Brazil', flag: 'https://flagcdn.com/w80/br.png' },
    'IN': { name: 'India', flag: 'https://flagcdn.com/w80/in.png' },
    'CN': { name: 'China', flag: 'https://flagcdn.com/w80/cn.png' },
    'RU': { name: 'Russia', flag: 'https://flagcdn.com/w80/ru.png' },
    'MX': { name: 'Mexico', flag: 'https://flagcdn.com/w80/mx.png' },
    'KR': { name: 'South Korea', flag: 'https://flagcdn.com/w80/kr.png' }
};

// Menu System Functions
function showMainMenu() {
    console.log('showMainMenu called');
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('countrySelection').style.display = 'none';
    document.getElementById('highScores').style.display = 'none';
    document.getElementById('planeSelection').style.display = 'none';
}

function startGame() {
    console.log('startGame called');
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('ui').style.display = 'block';
    
    // Initialize the game if not already done
    if (!engine) {
        initGame();
    } else {
        // Reset game state and start
        resetGameState();
        startLevel();
    }
}

function showHighScores() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('highScores').style.display = 'flex';
    displayHighScores();
}

function hideHighScores() {
    document.getElementById('highScores').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}

function showCountrySelection() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('countrySelection').style.display = 'block';
    initMap();
}

function hideCountrySelection() {
    document.getElementById('countrySelection').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}

function showPlaneSelection() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('planeSelection').style.display = 'block';
    populatePlaneSelection();
    initPlanePreview();
}

function hidePlaneSelection() {
    document.getElementById('planeSelection').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}

function populatePlaneSelection() {
    const planeGrid = document.getElementById('planeGrid');
    planeGrid.innerHTML = '';
    
    Object.entries(GAME_CONFIG.MODELS.PLANES).forEach(([key, plane]) => {
        const planeCard = document.createElement('div');
        planeCard.className = 'plane-card';
        if (selectedPlane === key) {
            planeCard.classList.add('selected');
        }
        
        planeCard.innerHTML = `
            <div class="plane-name">${plane.name}</div>
            <div class="plane-description">Click to select this plane</div>
        `;
        
        planeCard.onclick = () => selectPlane(key);
        planeGrid.appendChild(planeCard);
    });
}

function selectPlane(planeKey) {
    selectedPlane = planeKey;
    
    // Update visual selection
    document.querySelectorAll('.plane-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.plane-card').classList.add('selected');
    
    // Update preview
    updatePlanePreview(planeKey);
    
    // Update player plane if it exists
    if (player && player.material) {
        updatePlayerModel();
    }
}

function updatePlayerModel() {
    if (selectedPlane && player) {
        const planeConfig = GAME_CONFIG.MODELS.PLANES[selectedPlane];
        
        // Apply flag texture if country is selected
        if (selectedCountry) {
            const flagTexture = new BABYLON.Texture(selectedCountry.flag, scene);
            player.material.diffuseTexture = flagTexture;
            player.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        } else {
            // Apply plane color to all child meshes
            player.getChildMeshes().forEach(mesh => {
                mesh.material.diffuseColor = new BABYLON.Color3(
                    planeConfig.color[0], 
                    planeConfig.color[1], 
                    planeConfig.color[2]
                );
            });
        }
    }
}

// Plane preview functions
function initPlanePreview() {
    const canvas = document.getElementById('planePreview');
    if (!canvas) return;
    
    previewEngine = new BABYLON.Engine(canvas, true);
    previewScene = new BABYLON.Scene(previewEngine);
    
    // Create camera - ArcRotateCamera doesn't need attachControls
    previewCamera = new BABYLON.ArcRotateCamera('previewCamera', 0, Math.PI / 3, 5, BABYLON.Vector3.Zero(), previewScene);
    previewCamera.setTarget(BABYLON.Vector3.Zero());
    
    // Create lighting
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), previewScene);
    light.intensity = 0.7;
    
    // Start render loop
    previewEngine.runRenderLoop(() => {
        previewScene.render();
    });
    
    // Update preview with current selection
    updatePlanePreview(selectedPlane);
}

function updatePlanePreview(planeKey) {
    if (!previewScene) return;
    
    // Clear existing preview plane
    if (previewPlane) {
        previewPlane.dispose();
    }
    
    const planeConfig = GAME_CONFIG.MODELS.PLANES[planeKey];
    
    // Create preview plane (simple box first)
    previewPlane = BABYLON.MeshBuilder.CreateBox('previewPlane', {
        width: 1,
        height: 0.5,
        depth: 2
    }, previewScene);
    
    // Apply color
    const material = new BABYLON.StandardMaterial('previewMaterial', previewScene);
    material.diffuseColor = new BABYLON.Color3(planeConfig.color[0], planeConfig.color[1], planeConfig.color[2]);
    previewPlane.material = material;
    
    // Try to load the actual model for preview
    const url = planeConfig.url;
    if (url) {
        loadModelForPreview(url, planeConfig);
    }
    
    // Update info
    const info = document.getElementById('planeInfo');
    if (info) {
        info.innerHTML = `
            <div style="font-weight:bold;color:#fff;margin-bottom:8px;">${planeConfig.name}</div>
            <div>Color: RGB(${Math.round(planeConfig.color[0]*255)}, ${Math.round(planeConfig.color[1]*255)}, ${Math.round(planeConfig.color[2]*255)})</div>
            <div id="loadingStatus" style="margin-top:5px;color:#9ca3af;font-size:0.9em;">Loading model...</div>
            <div style="margin-top:10px;">
                <button onclick="confirmPlaneSelection('${planeKey}')" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Select This Plane</button>
            </div>
        `;
    }
}

function loadModelForPreview(url, planeConfig) {
    console.log('Loading preview model:', url);
    
    // Load model specifically for preview using ImportMesh
    BABYLON.SceneLoader.ImportMesh('', url, '', previewScene, (meshes) => {
        if (previewPlane) {
            console.log('Preview model loaded successfully:', url, 'meshes:', meshes.length);
            
            // Store current position
            const currentPos = previewPlane.position.clone();
            
            // Dispose old preview plane
            previewPlane.dispose();
            
            // Create new preview plane from model
            const root = new BABYLON.TransformNode('previewRoot', previewScene);
            meshes.forEach(m => {
                m.parent = root;
            });
            previewPlane = root;
            previewPlane.position = currentPos;
            
            // Apply color to all child meshes
            previewPlane.getChildMeshes().forEach(mesh => {
                if (mesh.material) {
                    mesh.material.diffuseColor = new BABYLON.Color3(planeConfig.color[0], planeConfig.color[1], planeConfig.color[2]);
                }
            });
            
            // Update loading status
            const loadingStatus = document.getElementById('loadingStatus');
            if (loadingStatus) {
                loadingStatus.textContent = 'Model loaded!';
                loadingStatus.style.color = '#10b981';
            }
        }
    }, null, (scene, message, exception) => {
        console.error('Preview model load failed:', url, 'message:', message, 'exception:', exception);
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingStatus) {
            loadingStatus.textContent = 'Using default model';
            loadingStatus.style.color = '#f59e0b';
        }
    });
}

function confirmPlaneSelection(planeKey) {
    selectedPlane = planeKey;
    
    // Clean up preview
    if (previewEngine) {
        previewEngine.dispose();
    }
    
    // Show confirmation and go back to menu
    alert(`Selected: ${GAME_CONFIG.MODELS.PLANES[planeKey].name}`);
    hidePlaneSelection();
}

function backToMenu() {
    document.getElementById('gameOver').style.display = 'none';
    showMainMenu();
}

// High Scores Functions
function getHighScores() {
    const scores = localStorage.getItem(HIGH_SCORES_KEY);
    return scores ? JSON.parse(scores) : [];
}

function saveHighScore(score) {
    const scores = getHighScores();
    scores.push({
        score: score,
        date: new Date().toLocaleDateString(),
        country: selectedCountry ? selectedCountry.name : 'Unknown'
    });
    
    // Sort by score (highest first) and keep only top scores
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, MAX_HIGH_SCORES);
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
}

function displayHighScores() {
    const scores = getHighScores();
    const scoresList = document.getElementById('scoresList');
    
    if (scores.length === 0) {
        scoresList.innerHTML = '<div class="score-item">No scores yet. Play a game to set a record!</div>';
        return;
    }
    
    scoresList.innerHTML = scores.map((score, index) => `
        <div class="score-item">
            <span class="score-rank">#${index + 1}</span>
            <span>${score.score.toLocaleString()} pts</span>
            <span>${score.country}</span>
            <span>${score.date}</span>
        </div>
    `).join('');
}

// Map and Country Selection Functions
function initMap() {
    if (map) {
        map.remove();
    }
    
    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add country markers
    Object.entries(COUNTRIES).forEach(([code, country]) => {
        const latLng = getCountryCoordinates(code);
        if (latLng) {
            const marker = L.marker(latLng).addTo(map);
            marker.bindPopup(`
                <div style="text-align: center;">
                    <img src="${country.flag}" style="width: 40px; height: 25px; margin-bottom: 5px;">
                    <br><strong>${country.name}</strong>
                    <br><button onclick="selectCountry('${code}')" style="margin-top: 5px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">Select</button>
                </div>
            `);
        }
    });
}

function getCountryCoordinates(countryCode) {
    // Approximate coordinates for major countries
    const coordinates = {
        'US': [39.8283, -98.5795],
        'GB': [55.3781, -3.4360],
        'FR': [46.2276, 2.2137],
        'DE': [51.1657, 10.4515],
        'IT': [41.8719, 12.5674],
        'ES': [40.4637, -3.7492],
        'CA': [56.1304, -106.3468],
        'AU': [-25.2744, 133.7751],
        'JP': [36.2048, 138.2529],
        'BR': [-14.2350, -51.9253],
        'IN': [20.5937, 78.9629],
        'CN': [35.8617, 104.1954],
        'RU': [61.5240, 105.3188],
        'MX': [23.6345, -102.5528],
        'KR': [35.9078, 127.7669]
    };
    return coordinates[countryCode];
}

function selectCountry(countryCode) {
    selectedCountry = COUNTRIES[countryCode];
    
    // Update flag display
    const flagDisplay = document.getElementById('selectedFlag');
    flagDisplay.style.backgroundImage = `url(${selectedCountry.flag})`;
    flagDisplay.style.display = 'block';
    
    // Update player plane with flag
    if (player && player.material) {
        updatePlayerFlag();
    }
    
    // Show confirmation and go back to menu
    alert(`Selected: ${selectedCountry.name}`);
    hideCountrySelection();
}

function updatePlayerFlag() {
    if (selectedCountry && player) {
        // Create a flag texture for the player
        const flagTexture = new BABYLON.Texture(selectedCountry.flag, scene);
        player.material.diffuseTexture = flagTexture;
        player.material.diffuseColor = new BABYLON.Color3(1, 1, 1); // White to show flag properly
    }
}

function resetGameState() {
    gameState = {
        level: 1,
        score: 0,
        health: GAME_CONFIG.PLAYER_HEALTH,
        timeLeft: GAME_CONFIG.LEVEL_DURATION,
        gameRunning: true,
        lastShot: 0,
        lastAsteroidSpawn: 0,
        boss: null,
        bossHealth: 0,
        powerUpActive: null,
        powerUpEndTime: 0
    };
    
    // Clear all game objects
    bullets.forEach(bullet => bullet.mesh.dispose());
    bullets = [];
    asteroids.forEach(asteroid => asteroid.mesh.dispose());
    asteroids = [];
    
    if (gameState.boss) {
        gameState.boss.dispose();
        gameState.boss = null;
    }
}

// Initialize the game
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    
    // Set scene background to black
    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    
    // Create camera - Fixed camera for first-person view
    camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -15), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    // No camera controls needed for this game - player moves, camera stays fixed
    
    // Create lighting - Increased intensity
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
    
    // Add ambient light for better visibility
    const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, -1, 0), scene);
    ambientLight.intensity = 0.3;
    
    // Create starry skybox
    createStarrySkybox();

    // Create background planet (model if available)
    createBackgroundPlanet();

    // Create player plane (model if available)
    createPlayer();
    
    // Removed test sphere
    
    // Start game loop
    engine.runRenderLoop(() => {
        if (gameState.gameRunning) {
            updateGame();
        }
        scene.render();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        engine.resize();
    });
    
    // Keyboard input handling
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Start the first level
    startLevel();
    
    console.log('Game initialized successfully!');
}

function createStarrySkybox() {
    const skybox = BABYLON.MeshBuilder.CreateSphere('skybox', { diameter: 200, segments: 16 }, scene);
    const mat = new BABYLON.StandardMaterial('skyboxMaterial', scene);
    const dyn = new BABYLON.DynamicTexture('starTex', 1024, scene, true);
    const ctx = dyn.getContext();
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 1200; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const a = 0.3 + Math.random() * 0.7;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 1, 1);
    }
    dyn.update();
    mat.diffuseTexture = dyn;
    mat.emissiveTexture = dyn;
    mat.backFaceCulling = false;
    skybox.material = mat;
    skybox.isPickable = false;
}

function createBackgroundPlanet() {
    // Create planet synchronously to avoid loading errors
    const planet = BABYLON.MeshBuilder.CreateSphere('planet', { diameter: 8 }, scene);
    const m = new BABYLON.StandardMaterial('planetMat', scene);
    m.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    m.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);
    planet.material = m;
    planet.position = new BABYLON.Vector3(0, 0, 20);
}

function loadModel(url, name, onSuccess, onError) {
    console.log('Loading model:', url);
    
    // Use ImportMesh instead of Append for better control
    BABYLON.SceneLoader.ImportMesh('', url, '', scene, (meshes) => {
        console.log('Model loaded successfully:', url, 'meshes:', meshes.length);
        const root = new BABYLON.TransformNode(name, scene);
        meshes.forEach(m => {
            m.parent = root;
        });
        if (onSuccess) onSuccess(root);
    }, null, (scene, message, exception) => {
        console.error('Model load failed:', url, 'message:', message, 'exception:', exception);
        if (onError) onError(message);
    });
}

function createPlayer() {
    // Always create player synchronously first
    const planeConfig = GAME_CONFIG.MODELS.PLANES[selectedPlane] || GAME_CONFIG.MODELS.PLANES.fighter;
    
    // Create basic player immediately
    player = BABYLON.MeshBuilder.CreateBox('player', { width: 1, height: 0.5, depth: 2 }, scene);
    finalizePlayer(planeConfig);
    
    // Try to load model in background and replace if successful
    const url = planeConfig.url;
    if (url) {
        if (modelCache.planes[selectedPlane]) {
            // Use cached model
            replacePlayerWithModel(modelCache.planes[selectedPlane], planeConfig);
        } else {
            // Load model asynchronously
            loadModel(url, 'playerRoot', (root) => {
                modelCache.planes[selectedPlane] = root;
                replacePlayerWithModel(root, planeConfig);
            }, () => {
                console.log('Model load failed, keeping default box');
            });
        }
    }
}

function replacePlayerWithModel(modelRoot, planeConfig) {
    if (!player) return;
    
    // Store current position
    const currentPos = player.position.clone();
    
    // Dispose old player
    player.dispose();
    
    // Create new player from model
    player = modelRoot.clone('playerInstance');
    player.position = currentPos;
    
    // Apply finalization
    finalizePlayer(planeConfig);
    
    console.log('Player model replaced with loaded model');
}

function finalizePlayer(planeConfig) {
    
    player.position = new BABYLON.Vector3(0, 0, -10);
    // Apply appearance
    const color = planeConfig && planeConfig.color ? planeConfig.color : [0, 0.8, 1];
    const mat = new BABYLON.StandardMaterial('playerMaterial', scene);
    mat.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2]);
    if (player.material === undefined) {
        // apply to all child meshes
        player.getChildMeshes ? player.getChildMeshes().forEach(m => m.material = mat) : null;
    }
    player.material = mat;
    if (selectedCountry) updatePlayerFlag();
    
    // Add collision detection
    player.checkCollisions = true;
    
    console.log('Player created at position:', player.position);
}

function updateGame() {
    handleInput();
    updateBullets();
    updateAsteroids();
    updateBoss();
    updateHealthDrops();
    updatePowerUps();
    updateUI();
    checkCollisions();
    checkLevelComplete();
}

function handleInput() {
    // Check if player exists before handling input
    if (!player) return;
    
    // Movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.position.x -= GAME_CONFIG.PLAYER_SPEED;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.position.x += GAME_CONFIG.PLAYER_SPEED;
    }
    if (keys['ArrowUp'] || keys['KeyW']) {
        player.position.y += GAME_CONFIG.PLAYER_SPEED;
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        player.position.y -= GAME_CONFIG.PLAYER_SPEED;
    }
    
    // Shooting
    if ((keys['Space'] || keys['KeyF']) && Date.now() - gameState.lastShot > GAME_CONFIG.PLAYER_FIRE_RATE) {
        shoot();
        gameState.lastShot = Date.now();
    }
    
    // Keep player within visible bounds (much more restrictive)
    // Camera is at z=-15, looking at origin, so visible area is roughly -8 to +8 in x and -6 to +6 in y
    // Using smaller bounds to ensure plane stays well within visible area
    player.position.x = Math.max(-5, Math.min(5, player.position.x));
    player.position.y = Math.max(-2, Math.min(2, player.position.y));
}

function shoot() {
    const bullet = BABYLON.MeshBuilder.CreateSphere('bullet', { diameter: 0.2 }, scene);
    bullet.position = new BABYLON.Vector3(player.position.x, player.position.y, player.position.z + 1);
    bullet.material = new BABYLON.StandardMaterial('bulletMaterial', scene);
    bullet.material.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
    
    bullets.push({
        mesh: bullet,
        velocity: new BABYLON.Vector3(0, 0, GAME_CONFIG.BULLET_SPEED),
        lifeTime: Date.now() + GAME_CONFIG.BULLET_LIFETIME
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.mesh.position.addInPlace(bullet.velocity);
        
        // Remove bullets that are too old or out of bounds
        if (Date.now() > bullet.lifeTime || bullet.mesh.position.z > 10) {
            bullet.mesh.dispose();
            bullets.splice(i, 1);
        }
    }
}

function spawnAsteroid() {
    const asteroidType = gameState.level <= 2 ? 'LARGE' : 
                       gameState.level <= 4 ? 'MEDIUM' : 'SMALL';
    const config = GAME_CONFIG.ASTEROID_STRENGTHS[asteroidType];
    
    let asteroid;
    const asteroidUrl = GAME_CONFIG.MODELS.ASTEROID.url;
    if (asteroidUrl && modelCache.asteroid) {
        asteroid = modelCache.asteroid.clone('asteroid');
        asteroid.scaling = new BABYLON.Vector3(config.size, config.size, config.size);
    } else if (asteroidUrl && !modelCache.asteroid) {
        // Load model in background for next time
        loadModel(asteroidUrl, 'asteroidRoot', (root) => {
            modelCache.asteroid = root;
        }, () => {
            console.log('Asteroid model load failed');
        });
        asteroid = BABYLON.MeshBuilder.CreateSphere('asteroid', { diameter: config.size }, scene);
    } else {
        asteroid = BABYLON.MeshBuilder.CreateSphere('asteroid', { diameter: config.size }, scene);
    }
    
    // Spawn asteroids within visible bounds (matching player movement area)
    // Spawn from the front (positive z) but within the visible x,y area
    asteroid.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 10, // -5 to +5 (matching player bounds)
        (Math.random() - 0.5) * 4,  // -2 to +2 (matching player bounds)
        8 // Spawn from the front
    );
    
    if (!asteroid.material) {
        asteroid.material = new BABYLON.StandardMaterial('asteroidMaterial', scene);
        asteroid.material.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);
    }
    
    asteroids.push({
        mesh: asteroid,
        velocity: new BABYLON.Vector3(0, 0, -config.speed),
        health: config.health,
        maxHealth: config.health,
        points: config.points,
        type: asteroidType
    });
}

function updateAsteroids() {
    // Spawn new asteroids
    if (Date.now() - gameState.lastAsteroidSpawn > GAME_CONFIG.ASTEROID_SPAWN_RATE) {
        spawnAsteroid();
        gameState.lastAsteroidSpawn = Date.now();
    }
    
    // Update asteroid positions
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.mesh.position.addInPlace(asteroid.velocity);
        
        // Keep asteroids within visible bounds (matching player bounds)
        asteroid.mesh.position.x = Math.max(-5, Math.min(5, asteroid.mesh.position.x));
        asteroid.mesh.position.y = Math.max(-2, Math.min(2, asteroid.mesh.position.y));
        
        // Remove asteroids that are behind the player or too far away
        if (asteroid.mesh.position.z < -15) {
            asteroid.mesh.dispose();
            asteroids.splice(i, 1);
        }
    }
}

function updateBoss() {
    if (gameState.boss && gameState.level === GAME_CONFIG.LEVELS_COUNT) {
        // Boss movement - move side to side within bounds (matching player bounds)
        const time = Date.now() * 0.001;
        gameState.boss.position.x = Math.max(-4, Math.min(4, Math.sin(time * 0.5) * 2));
        
        // Boss shooting
        if (Date.now() - gameState.bossLastShot > GAME_CONFIG.BOSS_FIRE_RATE) {
            bossShoot();
            gameState.bossLastShot = Date.now();
        }
    }
}

function bossShoot() {
    // Create boss bullets (asteroids)
    const asteroid = BABYLON.MeshBuilder.CreateSphere('bossAsteroid', { diameter: 1 }, scene);
    asteroid.position = new BABYLON.Vector3(
        Math.max(-5, Math.min(5, gameState.boss.position.x + (Math.random() - 0.5) * 2)),
        Math.max(-2, Math.min(2, gameState.boss.position.y + (Math.random() - 0.5) * 2)),
        gameState.boss.position.z - 1
    );
    
    asteroid.material = new BABYLON.StandardMaterial('bossAsteroidMaterial', scene);
    asteroid.material.diffuseColor = new BABYLON.Color3(1, 0.5, 0); // Orange color
    
    asteroids.push({
        mesh: asteroid,
        velocity: new BABYLON.Vector3(0, 0, -GAME_CONFIG.ASTEROID_SPEED * 1.5),
        health: 1,
        maxHealth: 1,
        points: 50,
        type: 'BOSS_ASTEROID'
    });
}

function checkCollisions() {
    // Check if player exists before checking collisions
    if (!player) return;
    
    // Bullet vs Asteroid collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            
            if (bullet.mesh.intersectsMesh(asteroid.mesh)) {
                // Hit!
                asteroid.health -= GAME_CONFIG.PLAYER_DAMAGE;
                bullet.mesh.dispose();
                bullets.splice(i, 1);
                
                if (asteroid.health <= 0) {
                    // Asteroid destroyed
                    gameState.score += asteroid.points;
                    
                    // Split asteroid if it's not the smallest type
                    if (asteroid.type !== 'SMALL' && asteroid.type !== 'BOSS_ASTEROID') {
                        splitAsteroid(asteroid);
                    }

                    // Chance to spawn health drop
                    maybeSpawnHealthDrop(asteroid.mesh.position.clone());
                    
                    asteroid.mesh.dispose();
                    asteroids.splice(j, 1);
                } else {
                    // Update asteroid color based on health
                    const healthRatio = asteroid.health / asteroid.maxHealth;
                    asteroid.mesh.material.diffuseColor = new BABYLON.Color3(
                        0.6 * healthRatio,
                        0.3 * healthRatio,
                        0.1 * healthRatio
                    );
                }
                break;
            }
        }
        
        // Bullet vs Boss collision
        if (gameState.boss && bullet.mesh.intersectsMesh(gameState.boss)) {
            gameState.bossHealth--;
            bullet.mesh.dispose();
            bullets.splice(i, 1);
            
            // Update boss color based on health
            const healthRatio = gameState.bossHealth / GAME_CONFIG.BOSS_HEALTH;
            gameState.boss.material.diffuseColor = new BABYLON.Color3(
                healthRatio,
                0,
                0
            );
            
            if (gameState.bossHealth <= 0) {
                // Boss defeated
                gameState.score += 1000;
                gameState.boss.dispose();
                gameState.boss = null;
            }
        }
    }
    
    // Player vs Asteroid collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        
        if (player.intersectsMesh(asteroid.mesh)) {
            gameState.health -= 20;
            asteroid.mesh.dispose();
            asteroids.splice(i, 1);
            
            if (gameState.health <= 0) {
                gameOver();
            }
        }
    }
}

function splitAsteroid(asteroid) {
    const newType = asteroid.type === 'LARGE' ? 'MEDIUM' : 'SMALL';
    const config = GAME_CONFIG.ASTEROID_STRENGTHS[newType];
    
    // Create two smaller asteroids
    for (let i = 0; i < 2; i++) {
        const newAsteroid = BABYLON.MeshBuilder.CreateSphere('asteroid', { diameter: config.size }, scene);
        newAsteroid.position = asteroid.mesh.position.clone();
        newAsteroid.position.x += (i === 0 ? -0.5 : 0.5);
        
        newAsteroid.material = new BABYLON.StandardMaterial('asteroidMaterial', scene);
        newAsteroid.material.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);
        
        asteroids.push({
            mesh: newAsteroid,
            velocity: new BABYLON.Vector3(0, 0, -config.speed),
            health: config.health,
            maxHealth: config.health,
            points: config.points,
            type: newType
        });
    }
}

function updatePowerUps() {
    // Check if power-up should end
    if (gameState.powerUpActive && Date.now() > gameState.powerUpEndTime) {
        gameState.powerUpActive = null;
    }
}

// Health drops
function maybeSpawnHealthDrop(position) {
    if (Math.random() < GAME_CONFIG.HEALTH_DROP_CHANCE) {
        const drop = BABYLON.MeshBuilder.CreateSphere('healthDrop', { diameter: 0.5 }, scene);
        drop.position = position.add(new BABYLON.Vector3(0, 0, 0));
        const mat = new BABYLON.StandardMaterial('healthDropMat', scene);
        mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        drop.material = mat;
        healthDrops.push({ mesh: drop, velocity: new BABYLON.Vector3(0, 0, -0.05) });
    }
}

function updateHealthDrops() {
    for (let i = healthDrops.length - 1; i >= 0; i--) {
        const drop = healthDrops[i];
        drop.mesh.position.addInPlace(drop.velocity);
        // Constrain within bounds
        drop.mesh.position.x = Math.max(-5, Math.min(5, drop.mesh.position.x));
        drop.mesh.position.y = Math.max(-2, Math.min(2, drop.mesh.position.y));
        
        // Pickup
        if (player && drop.mesh && player.intersectsMesh(drop.mesh)) {
            gameState.health = Math.min(100, gameState.health + GAME_CONFIG.HEALTH_DROP_AMOUNT);
            drop.mesh.dispose();
            healthDrops.splice(i, 1);
            continue;
        }
        
        // Cleanup when past player
        if (drop.mesh.position.z < -15) {
            drop.mesh.dispose();
            healthDrops.splice(i, 1);
        }
    }
}

function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('health').textContent = gameState.health;
    
    // Update time
    const timeLeft = Math.max(0, gameState.timeLeft - (Date.now() - gameState.levelStartTime));
    document.getElementById('time').textContent = Math.ceil(timeLeft / 1000);
    
    // Show boss health if boss exists
    if (gameState.boss) {
        const bossHealthElement = document.getElementById('bossHealth');
        if (!bossHealthElement) {
            const ui = document.getElementById('ui');
            const bossHealthDiv = document.createElement('div');
            bossHealthDiv.id = 'bossHealth';
            bossHealthDiv.innerHTML = 'Boss Health: <span id="bossHealthValue">50</span>';
            ui.appendChild(bossHealthDiv);
        }
        document.getElementById('bossHealthValue').textContent = gameState.bossHealth;
    }
}

function startLevel() {
    gameState.levelStartTime = Date.now();
    gameState.timeLeft = GAME_CONFIG.LEVEL_DURATION;
    
    // Clear existing asteroids
    asteroids.forEach(asteroid => asteroid.mesh.dispose());
    asteroids = [];
    // Clear health drops
    healthDrops.forEach(drop => drop.mesh.dispose());
    healthDrops = [];
    
    if (gameState.level === GAME_CONFIG.LEVELS_COUNT) {
        // Boss level
        createBoss();
    }
}

function createBoss() {
    // Create boss immediately with box
    gameState.boss = BABYLON.MeshBuilder.CreateBox('boss', { width: GAME_CONFIG.BOSS_SIZE, height: GAME_CONFIG.BOSS_SIZE, depth: GAME_CONFIG.BOSS_SIZE }, scene);
    finalizeBoss();
    
    // Try to load model in background and replace if successful
    const bossUrl = GAME_CONFIG.MODELS.BOSS.url;
    if (bossUrl) {
        if (modelCache.boss) {
            replaceBossWithModel(modelCache.boss);
        } else {
            loadModel(bossUrl, 'bossRoot', (root) => {
                modelCache.boss = root;
                replaceBossWithModel(root);
            }, () => {
                console.log('Boss model load failed, keeping default box');
            });
        }
    }
}

function replaceBossWithModel(modelRoot) {
    if (!gameState.boss) return;
    
    // Store current position
    const currentPos = gameState.boss.position.clone();
    
    // Dispose old boss
    gameState.boss.dispose();
    
    // Create new boss from model
    gameState.boss = modelRoot.clone('bossInstance');
    gameState.boss.position = currentPos;
    gameState.boss.scaling = new BABYLON.Vector3(GAME_CONFIG.BOSS_SIZE, GAME_CONFIG.BOSS_SIZE, GAME_CONFIG.BOSS_SIZE);
    
    // Apply finalization
    finalizeBoss();
    
    console.log('Boss model replaced with loaded model');
}

function finalizeBoss() {
    gameState.boss.position = new BABYLON.Vector3(0, 0, 8);
    if (!gameState.boss.material) {
        gameState.boss.material = new BABYLON.StandardMaterial('bossMaterial', scene);
        gameState.boss.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    }
    
    gameState.bossHealth = GAME_CONFIG.BOSS_HEALTH;
    gameState.bossLastShot = Date.now();
}

function checkLevelComplete() {
    const timeLeft = Math.max(0, gameState.timeLeft - (Date.now() - gameState.levelStartTime));
    
    // Check if boss is defeated
    if (gameState.level === GAME_CONFIG.LEVELS_COUNT && gameState.boss === null) {
        gameComplete();
        return;
    }
    
    if (timeLeft <= 0) {
        if (gameState.level < GAME_CONFIG.LEVELS_COUNT) {
            // Level complete - show power-up choices
            gameState.awaitingPowerup = true;
            showPowerupModal();
        } else {
            // Game complete
            gameComplete();
        }
    }
}

function givePowerUp() {
    const powerUpTypes = Object.keys(GAME_CONFIG.POWERUP_EFFECTS);
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    gameState.powerUpActive = randomType;
    gameState.powerUpEndTime = Date.now() + GAME_CONFIG.POWERUP_DURATION;
    
    // Apply power-up effect
    switch (randomType) {
        case 'RAPID_FIRE':
            GAME_CONFIG.PLAYER_FIRE_RATE = GAME_CONFIG.POWERUP_EFFECTS.RAPID_FIRE.fireRate;
            break;
        case 'SHIELD':
            gameState.health = Math.min(100, gameState.health + GAME_CONFIG.POWERUP_EFFECTS.SHIELD.healthBoost);
            break;
        case 'SPEED_BOOST':
            GAME_CONFIG.PLAYER_SPEED *= GAME_CONFIG.POWERUP_EFFECTS.SPEED_BOOST.speedMultiplier;
            break;
    }
}

// End-of-level powerup modal flow
function showPowerupModal() {
    // Clear all asteroids and bullets when showing power-up menu
    asteroids.forEach(asteroid => asteroid.mesh.dispose());
    asteroids = [];
    bullets.forEach(bullet => bullet.mesh.dispose());
    bullets = [];
    
    const modal = document.getElementById('powerupModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hidePowerupModal() {
    const modal = document.getElementById('powerupModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function choosePowerUp(type) {
    // Apply chosen permanent per-level power-up
    if (type === 'attack_speed') {
        GAME_CONFIG.PLAYER_FIRE_RATE = Math.max(50, Math.floor(GAME_CONFIG.PLAYER_FIRE_RATE * GAME_CONFIG.POWERUP_ATTACK_SPEED_MULTIPLIER));
    } else if (type === 'attack_damage') {
        GAME_CONFIG.PLAYER_DAMAGE += GAME_CONFIG.POWERUP_ATTACK_DAMAGE_INCREMENT;
    } else if (type === 'health_boost') {
        gameState.health = Math.min(100, gameState.health + GAME_CONFIG.POWERUP_HEALTH_BOOST);
    }
    hidePowerupModal();
    gameState.awaitingPowerup = false;
    gameState.level++;
    startLevel();
}

function gameComplete() {
    gameState.gameRunning = false;
    
    // Save high score
    saveHighScore(gameState.score);
    
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = gameState.score;
}

function gameOver() {
    gameState.gameRunning = false;
    
    // Save high score
    saveHighScore(gameState.score);
    
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = gameState.score;
}

function restartGame() {
    // Reset game state
    resetGameState();
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Restart
    startLevel();
}

// Start the game when page loads
window.addEventListener('load', () => {
    try {
        // Show main menu instead of starting game directly
        showMainMenu();
        console.log('Main menu loaded successfully!');
        
        // Test if functions are available
        console.log('Functions available:', {
            showMainMenu: typeof showMainMenu,
            startGame: typeof startGame,
            showHighScores: typeof showHighScores,
            showCountrySelection: typeof showCountrySelection,
            showPlaneSelection: typeof showPlaneSelection
        });
    } catch (error) {
        console.error('Error loading main menu:', error);
        alert('Error loading game. Please check the console for details.');
    }
});

// Make functions globally available
window.showMainMenu = showMainMenu;
window.startGame = startGame;
window.showHighScores = showHighScores;
window.hideHighScores = hideHighScores;
window.showCountrySelection = showCountrySelection;
window.hideCountrySelection = hideCountrySelection;
window.showPlaneSelection = showPlaneSelection;
window.hidePlaneSelection = hidePlaneSelection;
window.selectPlane = selectPlane;
window.confirmPlaneSelection = confirmPlaneSelection;
window.selectCountry = selectCountry;
window.backToMenu = backToMenu;
window.restartGame = restartGame;
window.choosePowerUp = choosePowerUp;
