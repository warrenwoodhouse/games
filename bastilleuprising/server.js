const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const SAVE_DIR = path.join(ROOT, 'data');
const SAVE_FILE = path.join(SAVE_DIR, 'saves.json');

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

const defaultSave = {
  slot: 'default',
  currentLevel: 1,
  player: {
    x: 72,
    y: 72,
    health: 100,
    maxHealth: 100,
    ammo: 12,
    maxAmmo: 12
  },
  inventory: ['liberty-pamphlet', 'powder-horn'],
  questLog: [
    {
      id: 'meeting-rousseau',
      title: 'Meet the Courier',
      description: 'Find Mireille Rousseau at the outer gate and receive the revolution\'s first orders.',
      status: 'active',
      reward: 50
    }
  ],
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
  }
};

if (!fs.existsSync(SAVE_FILE)) {
  fs.writeFileSync(SAVE_FILE, JSON.stringify({ default: defaultSave }, null, 2));
}

app.use(express.json());
app.use(express.static(ROOT));

function readSaves() {
  try {
    const raw = fs.readFileSync(SAVE_FILE, 'utf8');
    return JSON.parse(raw) || {};
  } catch (error) {
    return {};
  }
}

function writeSaves(saves) {
  fs.writeFileSync(SAVE_FILE, JSON.stringify(saves, null, 2));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'online' });
});

app.get('/api/story/levels', (_req, res) => {
  res.json({
    levels: [
      {
        id: 1,
        title: 'Chapter I: Assembly at the Gate',
        description: 'Meet the revolutionary courier Mireille Rousseau and learn of the uprising.',
        location: 'Outer Courtyard of the Bastille'
      },
      {
        id: 2,
        title: 'Chapter II: Breach the Outer Wall',
        description: 'The crowd surges forward. Use the crowd to overwhelm the guards.',
        location: 'Prison Guard Barracks'
      },
      {
        id: 3,
        title: 'Chapter III: The Prison Break',
        description: 'Deep within the fortress, political prisoners await. Free them and learn the truth.',
        location: 'Underground Dungeons'
      },
      {
        id: 4,
        title: 'Chapter IV: The Governor\'s Stand',
        description: 'Face the fortress commander, Bernard de Launay. The fate of France hangs in balance.',
        location: 'The Bastille Keep'
      }
    ]
  });
});

app.get('/api/story/dialogues/:level', (req, res) => {
  const level = parseInt(req.params.level);
  const dialogues = {
    1: [
      {
        id: 'intro',
        speaker: 'Narrator',
        text: 'July 14, 1789. The Bastille stands as a symbol of royal tyranny. Centuries of secrets and suffering echo within its stone walls. Today, the people will storm the fortress.'
      },
      {
        id: 'mireille-meet',
        speaker: 'Mireille Rousseau',
        role: 'Revolutionary Courier',
        text: 'You came. Good. The crowd grows restless at the gate. We need someone who can move, fight, and think. The guards are gathering ammunition. If we don\'t act soon, they\'ll cut us down.'
      },
      {
        id: 'mireille-quest',
        speaker: 'Mireille Rousseau',
        text: 'First, we need gunpowder from the barracks storage. The guards keep it locked. Find the key or break through. Once we have it, we can breach the inner courtyard.'
      }
    ],
    2: [
      {
        id: 'intro',
        speaker: 'Narrator',
        text: 'The outer defenses crumble under the crowd\'s weight. The revolutionaries pour through the first gate. But the barracks hold well-armed soldiers who will not yield.'
      },
      {
        id: 'captain',
        speaker: 'Captain Dulac',
        role: 'Guard Commander',
        text: 'Fall back to the inner keep! These rabble cannot take the Bastille! For the King!'
      },
      {
        id: 'soldier-doubt',
        speaker: 'Young Soldier',
        role: 'Royal Guard',
        text: 'But sir... there are thousands of them. Are we truly serving France by dying here?'
      }
    ],
    3: [
      {
        id: 'intro',
        speaker: 'Narrator',
        text: 'Below the Bastille lie the dungeons—where political prisoners have rotted for years, forgotten by the world. Some were imprisoned by simple order of the King, without trial or cause.'
      },
      {
        id: 'prisoner-old',
        speaker: 'Old Prisoner',
        role: 'Political Detainee',
        text: 'Is it... is it over? Have they come for us at last? I have been here so long I forgot what daylight looked like.'
      },
      {
        id: 'prisoner-young',
        speaker: 'Young Prisoner',
        role: 'Noble Sympathizer',
        text: 'You must escape and tell them—tell them what happens to those who speak against the crown. The world must know the truth of this place.'
      }
    ],
    4: [
      {
        id: 'intro',
        speaker: 'Narrator',
        text: 'The final chamber. Governor Bernard de Launay waits, desperate and defiant. He knows his time has come. Around him, the remnants of the royal garrison make their last stand.'
      },
      {
        id: 'launay-defiant',
        speaker: 'Bernard de Launay',
        role: 'Governor of the Bastille',
        text: 'I am the last keeper of this fortress. I will not surrender it to a mob! The authority of France shall not break!'
      },
      {
        id: 'launay-defeat',
        speaker: 'Bernard de Launay',
        text: 'You have won... but the cost... the blood spilled here will echo through the ages. This is no victory—it is the birth of chaos.'
      }
    ]
  };
  res.json(dialogues[level] || []);
});

app.get('/api/save/:slot', (req, res) => {
  const saves = readSaves();
  const slot = req.params.slot || 'default';
  const save = saves[slot] || defaultSave;
  res.json({ slot, save });
});

app.post('/api/save', (req, res) => {
  const { slot, save } = req.body;
  const saves = readSaves();
  saves[slot || 'default'] = save;
  writeSaves(saves);
  res.json({ ok: true, slot, save });
});

app.delete('/api/save/:slot', (req, res) => {
  const saves = readSaves();
  delete saves[req.params.slot];
  writeSaves(saves);
  res.json({ ok: true });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bastille Uprising server running at http://localhost:${PORT}`);
});
