const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');

// UI Elements
const levelTitle = document.getElementById('levelTitle');
const locationText = document.getElementById('locationText');
const levelNumber = document.getElementById('levelNumber');
const questContainer = document.getElementById('questContainer');
const questTitle = document.getElementById('questTitle');
const questDesc = document.getElementById('questDesc');
const questReward = document.getElementById('questReward');
const inventoryList = document.getElementById('inventoryList');
const healthBar = document.getElementById('healthFill');
const healthText = document.getElementById('healthText');
const ammoText = document.getElementById('ammoText');
const killsText = document.getElementById('killsText');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueSpeaker = document.getElementById('dialogueSpeaker');
const dialogueRole = document.getElementById('dialogueRole');
const dialogueText = document.getElementById('dialogueText');
const dialogueClose = document.getElementById('dialogueClose');
const questPopup = document.getElementById('questPopup');
const mapModal = document.getElementById('mapModal');
const levelCompleteModal = document.getElementById('levelCompleteModal');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const closeMapBtn = document.getElementById('closeMapBtn');
const continueLevelBtn = document.getElementById('continueLevelBtn');

// Game State
const gameState = {
  currentLevel: 1,
  player: {
    x: 0,
    y: 0,
    health: 100,
    maxHealth: 100,
    ammo: 12,
    maxAmmo: 12,
    angle: 0
  },
  inventory: ['liberty-pamphlet', 'powder-horn'],
  questLog: [],
  completedQuests: [],
  flags: {
    metMireille: false,
    hasGunpowder: false,
    gateChargeReady: false,
    bastilleStormed: false,
    rescuedPrisoners: false
  },
  stats: {
    kills: 0,
    questsCompleted: 0,
    timeElapsed: 0
  },
  dialogueIndex: 0,
  interactionCooldown: 0,
  gameTime: 0
};

const keys = {};
let currentMap = [];
let currentNPCs = [];
let currentEnemies = [];
let currentQuests = [];
let dialogueQueue = [];

// Initialization
function initLevel(levelId) {
  const levelData = GAME_DATA.levels[levelId - 1];
  if (!levelData) return;

  gameState.currentLevel = levelId;
  currentMap = levelData.map;
  currentNPCs = JSON.parse(JSON.stringify(levelData.npcs));
  currentEnemies = JSON.parse(JSON.stringify(levelData.enemies));
  currentQuests = JSON.parse(JSON.stringify(levelData.quests));

  gameState.player.x = levelData.playerStart.x;
  gameState.player.y = levelData.playerStart.y;
  gameState.player.health = gameState.player.maxHealth;
  gameState.player.ammo = gameState.player.maxAmmo;

  updateUI();
}

function updateUI() {
  const levelData = GAME_DATA.levels[gameState.currentLevel - 1];
  if (!levelData) return;

  levelTitle.textContent = levelData.title;
  locationText.textContent = levelData.location;
  levelNumber.textContent = `${gameState.currentLevel} / 4`;

  // Update health
  const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
  healthBar.style.width = healthPercent + '%';
  healthText.textContent = `${Math.ceil(gameState.player.health)} / ${gameState.player.maxHealth}`;

  // Update ammo
  ammoText.textContent = `${gameState.player.ammo} / ${gameState.player.maxAmmo}`;

  // Update kills
  killsText.textContent = gameState.stats.kills;

  // Update inventory
  inventoryList.innerHTML = gameState.inventory.map(itemId => {
    const item = GAME_DATA.items[itemId];
    return `<div class="inventory-item" title="${item.description}">${item.name}</div>`;
  }).join('');

  // Update active quest
  const activeQuest = gameState.questLog[0];
  if (activeQuest) {
    questTitle.textContent = activeQuest.title;
    questDesc.textContent = activeQuest.description;
    questReward.textContent = `Reward: ${activeQuest.reward} XP`;
  } else {
    questTitle.textContent = 'No Quest';
    questDesc.textContent = 'Complete objectives to receive new quests.';
    questReward.textContent = 'Reward: -';
  }
}

function addQuestLog(questId) {
  const quest = currentQuests.find(q => q.id === questId);
  if (quest && !gameState.questLog.find(q => q.id === questId)) {
    gameState.questLog.push(quest);
    updateUI();
  }
}

function showDialogue(speaker, role, text) {
  dialogueSpeaker.textContent = speaker;
  dialogueRole.textContent = role || '';
  dialogueText.textContent = text;
  dialogueBox.classList.remove('hidden');
}

function closeDialogue() {
  dialogueBox.classList.add('hidden');
}

function showQuestNotification(quest) {
  document.getElementById('popupQuestTitle').textContent = quest.title;
  document.getElementById('popupQuestText').textContent = quest.description;
  questPopup.classList.remove('hidden');
}

function movePlayer() {
  let dx = 0, dy = 0;

  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const speed = 2;
    const nextX = gameState.player.x + dx * speed;
    const nextY = gameState.player.y + dy * speed;

    if (!isWall(nextX, gameState.player.y)) gameState.player.x = nextX;
    if (!isWall(gameState.player.x, nextY)) gameState.player.y = nextY;
  }
}

function isWall(x, y) {
  const tileX = Math.floor(x / 32);
  const tileY = Math.floor(y / 32);
  if (tileY < 0 || tileY >= currentMap.length || tileX < 0 || tileX >= currentMap[0].length) return true;
  return currentMap[tileY][tileX] === '#';
}

function interact() {
  // Check NPC interaction
  for (const npc of currentNPCs) {
    const dist = Math.hypot(gameState.player.x - npc.x, gameState.player.y - npc.y);
    if (dist < 40) {
      const dialogue = npc.dialogues[0];
      showDialogue(npc.name, npc.role, dialogue);
      
      if (!gameState.flags[`met${npc.id}`]) {
        gameState.flags[`met${npc.id}`] = true;
        if (npc.questId) addQuestLog(npc.questId);
      }
      return;
    }
  }

  // Check item pickup (gunpowder cache)
  if (gameState.currentLevel === 2) {
    if (!gameState.inventory.includes('gunpowder')) {
      const gunX = 480, gunY = 100;
      const dist = Math.hypot(gameState.player.x - gunX, gameState.player.y - gunY);
      if (dist < 40) {
        gameState.inventory.push('gunpowder');
        gameState.flags.hasGunpowder = true;
        showDialogue('Narrator', '', 'You have secured the gunpowder. Now you can breach the gate.');
        updateUI();
        return;
      }
    }
  }

  // Check prisoner rescue
  if (gameState.currentLevel === 3) {
    for (const npc of currentNPCs) {
      const dist = Math.hypot(gameState.player.x - npc.x, gameState.player.y - npc.y);
      if (dist < 50) {
        gameState.flags.rescuedPrisoners = true;
      }
    }
  }
}

function fireWeapon() {
  if (gameState.player.ammo <= 0) return;

  gameState.player.ammo -= 1;

  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = 300;

  for (const enemy of currentEnemies) {
    if (enemy.health <= 0) continue;
    const dist = Math.hypot(gameState.player.x - enemy.x, gameState.player.y - enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (nearestEnemy) {
    nearestEnemy.health -= (nearestEnemy.isBoss ? 15 : 30);
    if (nearestEnemy.health <= 0) {
      gameState.stats.kills += 1;
      if (nearestEnemy.isBoss) {
        gameState.flags.bastilleStormed = true;
      }
    }
  }

  updateUI();
}

function updateEnemies() {
  for (const enemy of currentEnemies) {
    if (enemy.health <= 0) continue;

    // Simple AI: move towards player
    const dx = gameState.player.x - enemy.x;
    const dy = gameState.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0 && dist < 200) {
      const speed = enemy.isBoss ? 0.8 : 1.2;
      enemy.x += (dx / dist) * speed;
      enemy.y += (dy / dist) * speed;
    }

    // Enemy deals damage
    if (dist < 25 && gameState.gameTime % 40 === 0) {
      gameState.player.health -= (enemy.isBoss ? 5 : 2);
    }
  }
}

function drawLevel() {
  const tileSize = 32;

  // Draw background
  ctx.fillStyle = '#0a1020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw map
  for (let row = 0; row < currentMap.length; row++) {
    for (let col = 0; col < currentMap[row].length; col++) {
      const tile = currentMap[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      if (tile === '#') {
        // Wall
        ctx.fillStyle = '#4a5d6f';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.strokeStyle = '#2a3d4f';
        ctx.strokeRect(x, y, tileSize, tileSize);
      } else if (tile === 'P') {
        // Objective marker
        ctx.fillStyle = '#c9a961';
        ctx.fillRect(x + 8, y + 8, 16, 16);
      } else {
        // Floor
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  // Draw enemies
  for (const enemy of currentEnemies) {
    if (enemy.health <= 0) continue;

    if (enemy.isBoss) {
      ctx.fillStyle = '#d95454';
      ctx.fillRect(enemy.x - 14, enemy.y - 14, 28, 28);
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.strokeRect(enemy.x - 14, enemy.y - 14, 28, 28);
    } else {
      ctx.fillStyle = '#d95454';
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
    }

    // Enemy health bar
    const healthPercent = enemy.health / (enemy.isBoss ? 100 : 40);
    ctx.fillStyle = '#5dbe6f';
    ctx.fillRect(enemy.x - 12, enemy.y - 20, healthPercent * 24, 3);
  }

  // Draw NPCs
  for (const npc of currentNPCs) {
    ctx.fillStyle = '#c9a961';
    ctx.fillRect(npc.x - 10, npc.y - 10, 20, 20);
    ctx.fillStyle = '#f0e6d2';
    ctx.font = '10px Arial';
    ctx.fillText(npc.name, npc.x - 25, npc.y - 15);
  }

  // Draw player
  ctx.fillStyle = '#5dbe6f';
  ctx.beginPath();
  ctx.arc(gameState.player.x, gameState.player.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7add9c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw player direction
  const angle = gameState.player.angle;
  const endX = gameState.player.x + Math.cos(angle) * 15;
  const endY = gameState.player.y + Math.sin(angle) * 15;
  ctx.strokeStyle = '#7add9c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gameState.player.x, gameState.player.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawMap() {
  const tileSize = 20;
  mapCtx.fillStyle = '#0a1020';
  mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

  for (let row = 0; row < currentMap.length; row++) {
    for (let col = 0; col < currentMap[row].length; col++) {
      const tile = currentMap[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      if (tile === '#') {
        mapCtx.fillStyle = '#4a5d6f';
      } else {
        mapCtx.fillStyle = '#1a2a3a';
      }
      mapCtx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Draw enemies
  mapCtx.fillStyle = '#d95454';
  for (const enemy of currentEnemies) {
    if (enemy.health > 0) {
      mapCtx.fillRect((enemy.x / 32) * tileSize - 2, (enemy.y / 32) * tileSize - 2, 4, 4);
    }
  }

  // Draw player
  mapCtx.fillStyle = '#5dbe6f';
  mapCtx.fillRect((gameState.player.x / 32) * tileSize - 3, (gameState.player.y / 32) * tileSize - 3, 6, 6);
}

function checkLevelComplete() {
  const levelData = GAME_DATA.levels[gameState.currentLevel - 1];
  if (levelData && levelData.levelCompleteCondition()) {
    completeLevel();
  }

  if (gameState.player.health <= 0) {
    gameState.player.health = 0;
    showGameOver();
  }
}

function completeLevel() {
  const stats = {
    kills: gameState.stats.kills,
    health: Math.ceil(gameState.player.health),
    ammo: gameState.player.ammo
  };

  document.getElementById('completeTitle').textContent = `Chapter ${gameState.currentLevel} Complete!`;
  document.getElementById('completeStats').innerHTML = `
    <div>Enemies Defeated: ${stats.kills}</div>
    <div>Remaining Health: ${stats.health}%</div>
    <div>Ammo: ${stats.ammo}</div>
    <div style="margin-top: 10px; font-weight: 700; color: #5dbe6f;">Quest Completed!</div>
  `;

  levelCompleteModal.classList.remove('hidden');

  if (gameState.currentLevel < 4) {
    continueLevelBtn.textContent = 'Continue to Next Level';
    continueLevelBtn.onclick = () => {
      levelCompleteModal.classList.add('hidden');
      initLevel(gameState.currentLevel + 1);
    };
  } else {
    continueLevelBtn.textContent = 'End Game';
    continueLevelBtn.onclick = () => {
      window.location.reload();
    };
  }
}

function showGameOver() {
  alert('You have been defeated. The Bastille remains... for now.');
  location.reload();
}

function loop(timestamp) {
  gameState.gameTime++;
  gameState.stats.timeElapsed += 0.016;

  movePlayer();
  updateEnemies();
  checkLevelComplete();

  drawLevel();
  updateUI();

  requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE') interact();
  if (e.code === 'Space') fireWeapon();
  if (e.code === 'KeyM') {
    mapModal.classList.remove('hidden');
    drawMap();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  gameState.player.angle = Math.atan2(y - gameState.player.y, x - gameState.player.x);
});

canvas.addEventListener('click', () => {
  fireWeapon();
});

dialogueClose.addEventListener('click', closeDialogue);
closeMapBtn.addEventListener('click', () => {
  mapModal.classList.add('hidden');
});

document.getElementById('acceptQuestBtn').addEventListener('click', () => {
  questPopup.classList.add('hidden');
});

saveBtn.addEventListener('click', async () => {
  const save = {
    currentLevel: gameState.currentLevel,
    player: gameState.player,
    inventory: gameState.inventory,
    questLog: gameState.questLog,
    completedQuests: gameState.completedQuests,
    flags: gameState.flags,
    stats: gameState.stats
  };

  await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot: 'default', save })
  });

  showDialogue('System', '', 'Game saved successfully.');
});

loadBtn.addEventListener('click', async () => {
  const response = await fetch('/api/save/default');
  const { save } = await response.json();

  Object.assign(gameState, save);
  initLevel(gameState.currentLevel);
  showDialogue('System', '', 'Game loaded successfully.');
});

// Initialize
window.addEventListener('load', () => {
  initLevel(1);
  requestAnimationFrame(loop);
});
