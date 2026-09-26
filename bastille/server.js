const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const SAVE_DIR = path.join(ROOT, 'data');
const SAVE_FILE = path.join(SAVE_DIR, 'save.json');

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

if (!fs.existsSync(SAVE_FILE)) {
  fs.writeFileSync(SAVE_FILE, JSON.stringify({
    slot: 'default',
    state: {
      player: { x: 72, y: 72, health: 100, ammo: 8 },
      mission: 'Uprising',
      objective: 'Reach the gate lever in the outer courtyard.',
      story: 'The city waits in silence beneath the Bastille walls.'
    }
  }, null, 2));
}

app.use(express.json());
app.use(express.static(ROOT));

function readSave() {
  try {
    const raw = fs.readFileSync(SAVE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { slot: 'default', state: {} };
  }
}

function writeSave(payload) {
  fs.writeFileSync(SAVE_FILE, JSON.stringify(payload, null, 2));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'online' });
});

app.get('/api/story', (_req, res) => {
  res.json({
    title: 'Bastille',
    mission: 'Storm the Bastille',
    objective: 'Reach the gate lever and open the bastion.',
    intro: [
      'Smoke curls above the walls of the Bastille as dawn breaks over the river.',
      'The city is at the edge of rebellion, and the old order will not surrender without a fight.',
      'You must move through the courtyard, interact with rebel allies, and trigger the gate to spread the uprising.'
    ]
  });
});

app.get('/api/save', (_req, res) => {
  const save = readSave();
  res.json(save);
});

app.post('/api/save', (req, res) => {
  const payload = req.body || { slot: 'default', state: {} };
  const save = { slot: payload.slot || 'default', state: payload.state || {} };
  writeSave(save);
  res.json({ ok: true, save });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bastille game running at http://localhost:${PORT}`);
});
