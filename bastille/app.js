const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const missionTitle = document.getElementById('missionTitle');
const objectiveText = document.getElementById('objectiveText');
const storyText = document.getElementById('storyText');
const healthValue = document.getElementById('healthValue');
const ammoValue = document.getElementById('ammoValue');
const goalValue = document.getElementById('goalValue');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueText = document.getElementById('dialogueText');
const dialogueClose = document.getElementById('dialogueClose');

const map = [
  '####################',
  '#..................#',
  '#.##...........##.#',
  '#.............#....#',
  '#.####....#....#..#',
  '#....#....#....#..#',
  '#....#....#....#..#',
  '#.##.#........#...#',
  '#....#..###...#...#',
  '#....#.....#...#..#',
  '#......G....#......#',
  '####################'
];

const state = {
  player: { x: 72, y: 72, health: 100, ammo: 8 },
  mission: 'Uprising',
  objective: 'Find the gate lever in the outer courtyard.',
  story: 'The city waits in silence beneath the Bastille walls.',
  gateOpened: false,
  objectiveStage: 'courtyard',
  hasFoundMarker: false,
  hasOpenedGate: false
};

const npcs = [
  { id: 'mireille', x: 170, y: 350, name: 'Mireille', lines: ['The gate lever is hidden in the courtyard. We can still win this.'] },
  { id: 'renault', x: 430, y: 160, name: 'Renault', lines: ['The Bastille can still be taken. Break the lock and the city follows.'] },
  { id: 'sentry', x: 510, y: 356, name: 'Sentry', lines: ['Use the wall cannon and open the gate before the royalists regroup.'] }
];

const guards = [
  { x: 240, y: 220, health: 40 },
  { x: 410, y: 270, health: 40 },
  { x: 500, y: 420, health: 40 }
];

const keys = {};

function updateHud() {
  missionTitle.textContent = state.mission;
  objectiveText.textContent = state.objective;
  storyText.textContent = state.story;
  healthValue.textContent = Math.max(0, Math.ceil(state.player.health));
  ammoValue.textContent = state.player.ammo;
  goalValue.textContent = state.objectiveStage;
}

function isWall(x, y) {
  const tileX = Math.floor(x / 32);
  const tileY = Math.floor(y / 32);
  if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) return true;
  return map[tileY][tileX] === '#';
}

function movePlayer() {
  let dx = 0;
  let dy = 0;

  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const speed = 2.4;
    const nextX = state.player.x + dx * speed;
    const nextY = state.player.y + dy * speed;

    if (!isWall(nextX, state.player.y)) state.player.x = nextX;
    if (!isWall(state.player.x, nextY)) state.player.y = nextY;
  }
}

function showDialogue(text) {
  dialogueText.textContent = text;
  dialogueBox.classList.remove('hidden');
}

function closeDialogue() {
  dialogueBox.classList.add('hidden');
}

function interact() {
  for (const npc of npcs) {
    const dist = Math.hypot(state.player.x - npc.x, state.player.y - npc.y);
    if (dist < 34) {
      showDialogue(npc.lines[0]);
      if (npc.id === 'mireille' && !state.hasFoundMarker) {
        state.hasFoundMarker = true;
        state.objective = 'Use the wall cannon to blast open the gate.';
        state.objectiveStage = 'gate';
        state.story = 'The rebel courier points to the courtyard lever. The gate is close to collapse.';
        updateHud();
      }
      return;
    }
  }

  const gateX = 9 * 32 + 16;
  const gateY = 9 * 32 + 16;
  const gateDist = Math.hypot(state.player.x - gateX, state.player.y - gateY);

  if (gateDist < 35 && state.hasFoundMarker && !state.hasOpenedGate) {
    state.hasOpenedGate = true;
    state.gateOpened = true;
    state.objective = 'The Bastille gate is open. The uprising is underway!';
    state.objectiveStage = 'victory';
    state.story = 'The gate crashes open, and the city below erupts in rebel cheers.';
    updateHud();
    showDialogue('The Bastille gate is open. The people have broken through!');
    return;
  }

  showDialogue('There is nothing useful here. Keep moving.');
}

function fireWeapon() {
  if (state.player.ammo <= 0) {
    showDialogue('Out of ammunition. Find a new angle or keep moving.');
    return;
  }

  state.player.ammo -= 1;

  const target = guards
    .map((guard) => ({
      guard,
      dist: Math.hypot(state.player.x - guard.x, state.player.y - guard.y)
    }))
    .sort((a, b) => a.dist - b.dist)[0];

  if (target && target.dist < 180) {
    target.guard.health -= 40;
    if (target.guard.health <= 0) {
      showDialogue('A royalist guard drops to the floor. The courtyard is yours.');
    }
  }

  if (state.hasFoundMarker && !state.hasOpenedGate && state.player.x > 260 && state.player.y > 250) {
    state.hasOpenedGate = true;
    state.gateOpened = true;
    state.objective = 'The Bastille gate is open. The uprising is underway!';
    state.objectiveStage = 'victory';
    state.story = 'The gate crashes open, and the city erupts in rebel cries.';
    showDialogue('The gate is open! The uprising has begun!');
  }

  updateHud();
}

function checkCollisions() {
  for (const guard of guards) {
    const dist = Math.hypot(state.player.x - guard.x, state.player.y - guard.y);
    if (dist < 24) {
      state.player.health -= 10;
      if (state.player.health <= 0) {
        state.player.health = 100;
        state.player.x = 72;
        state.player.y = 72;
        state.story = 'You were overrun, but the uprising is still alive. Regroup and push again.';
      }
      updateHud();
    }
  }
}

function drawMap() {
  const tileSize = 32;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      if (tile === '#') {
        ctx.fillStyle = '#5d7388';
        ctx.fillRect(x, y, tileSize, tileSize);
      } else {
        ctx.fillStyle = '#1a2a39';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  ctx.fillStyle = '#c58d4b';
  ctx.fillRect(9 * 32, 9 * 32, 32, 32);

  ctx.fillStyle = '#f0d6a5';
  ctx.fillRect(state.player.x - 10, state.player.y - 10, 20, 20);

  for (const npc of npcs) {
    ctx.fillStyle = '#d7a76a';
    ctx.fillRect(npc.x - 10, npc.y - 10, 20, 20);
  }

  for (const guard of guards) {
    if (guard.health > 0) {
      ctx.fillStyle = '#d95e5e';
      ctx.fillRect(guard.x - 10, guard.y - 10, 20, 20);
    }
  }
}

function loop() {
  movePlayer();
  checkCollisions();
  drawMap();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (event.code === 'KeyE') interact();
  if (event.code === 'Space') fireWeapon();
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

saveBtn.addEventListener('click', async () => {
  const payload = {
    slot: 'default',
    state: {
      player: state.player,
      mission: state.mission,
      objective: state.objective,
      story: state.story,
      gateOpened: state.gateOpened,
      objectiveStage: state.objectiveStage,
      hasFoundMarker: state.hasFoundMarker,
      hasOpenedGate: state.hasOpenedGate
    }
  };

  const response = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  showDialogue(`Game saved: ${data.save.slot}`);
});

loadBtn.addEventListener('click', async () => {
  const response = await fetch('/api/save');
  const data = await response.json();
  const saved = data.state || {};

  if (saved.player) Object.assign(state.player, saved.player);
  if (saved.mission) state.mission = saved.mission;
  if (saved.objective) state.objective = saved.objective;
  if (saved.story) state.story = saved.story;
  if (typeof saved.gateOpened === 'boolean') state.gateOpened = saved.gateOpened;
  if (saved.objectiveStage) state.objectiveStage = saved.objectiveStage;
  if (typeof saved.hasFoundMarker === 'boolean') state.hasFoundMarker = saved.hasFoundMarker;
  if (typeof saved.hasOpenedGate === 'boolean') state.hasOpenedGate = saved.hasOpenedGate;

  updateHud();
  showDialogue('Progress restored from the REST save endpoint.');
});

dialogueClose.addEventListener('click', closeDialogue);

(async function init() {
  try {
    const response = await fetch('/api/story');
    const data = await response.json();
    if (data.mission) state.mission = data.mission;
    if (data.objective) state.objective = data.objective;
    if (Array.isArray(data.intro) && data.intro.length > 0) {
      state.story = data.intro[0];
    }
    updateHud();
    showDialogue(data.intro ? data.intro.join(' ') : 'The Bastille waits.');
  } catch (error) {
    console.warn('Story API unavailable:', error);
  }

  updateHud();
  requestAnimationFrame(loop);
})();
