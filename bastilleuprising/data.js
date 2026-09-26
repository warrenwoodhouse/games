const GAME_DATA = {
  levels: [
    {
      id: 1,
      title: 'Chapter I: Assembly at the Gate',
      location: 'Outer Courtyard of the Bastille',
      description: 'Meet the revolutionary courier and learn of the uprising.',
      map: [
        '######################',
        '#....................#',
        '#.....M............F.#',
        '#....................#',
        '#....####....####...#',
        '#....#..#....#..#...#',
        '#....#..#....#..#...#',
        '#....####....####...#',
        '#....................#',
        '#....................#',
        '#.....P.............#',
        '######################'
      ],
      playerStart: { x: 120, y: 360 },
      npcs: [
        {
          id: 'mireille',
          name: 'Mireille Rousseau',
          role: 'Revolutionary Courier',
          x: 180,
          y: 100,
          dialogues: [
            'You came. Good. The crowd grows restless at the gate.',
            'We need someone who can move and fight. The guards are gathering ammunition.',
            'First, retrieve the gunpowder from the barracks storage. Find the key or break through.'
          ],
          questId: 'meeting-rousseau'
        }
      ],
      enemies: [
        { x: 240, y: 180, health: 30, type: 'guard' },
        { x: 480, y: 180, health: 30, type: 'guard' },
        { x: 360, y: 280, health: 30, type: 'guard' }
      ],
      quests: [
        {
          id: 'meeting-rousseau',
          title: 'Meet Mireille Rousseau',
          description: 'Find the revolutionary courier at the courtyard gate. She will brief you on the mission.',
          objectives: ['Find Mireille at the gate', 'Speak to her'],
          reward: 50,
          nextQuest: 'retrieve-gunpowder'
        },
        {
          id: 'retrieve-gunpowder',
          title: 'Retrieve Gunpowder',
          description: 'The guards store gunpowder in the barracks. You must obtain it to breach the inner gate.',
          objectives: ['Search the barracks', 'Find the gunpowder cache'],
          reward: 75,
          nextQuest: null
        }
      ],
      levelCompleteCondition: () => {
        return gameState.flags.hasGunpowder && gameState.player.health > 0;
      }
    },
    {
      id: 2,
      title: 'Chapter II: Breach the Outer Wall',
      location: 'Prison Guard Barracks',
      description: 'Overwhelm the guards and secure the barracks.',
      map: [
        '#########################',
        '#....................#..#',
        '#....########.....E..#..#',
        '#....#......#.......#..#',
        '#....#......#.......#..#',
        '#....########.....C.#..#',
        '#....................#..#',
        '#....................#..#',
        '#....####....####....#..#',
        '#....#P.#....#..#....#..#',
        '#....####....####....#..#',
        '#....................#..#',
        '#########################'
      ],
      playerStart: { x: 120, y: 360 },
      npcs: [
        {
          id: 'captain',
          name: 'Captain Dulac',
          role: 'Guard Commander',
          x: 420,
          y: 180,
          dialogues: [
            'Fall back to the inner keep! These rabble cannot take the Bastille!',
            'For the King and France!'
          ],
          questId: null
        }
      ],
      enemies: [
        { x: 240, y: 140, health: 40, type: 'guard' },
        { x: 360, y: 140, health: 40, type: 'guard' },
        { x: 480, y: 140, health: 40, type: 'guard' },
        { x: 300, y: 280, health: 35, type: 'soldier' },
        { x: 420, y: 320, health: 35, type: 'soldier' }
      ],
      quests: [
        {
          id: 'storm-barracks',
          title: 'Storm the Barracks',
          description: 'Defeat the guards holding the barracks. The revolutionaries depend on this victory.',
          objectives: ['Defeat all guards', 'Secure the barracks'],
          reward: 100,
          nextQuest: null
        }
      ],
      levelCompleteCondition: () => {
        const allDefeated = GAME_DATA.levels[1].enemies.every(e => e.health <= 0);
        return allDefeated && gameState.player.health > 0;
      }
    },
    {
      id: 3,
      title: 'Chapter III: The Prison Break',
      location: 'Underground Dungeons',
      description: 'Free political prisoners and uncover the truth of the Bastille.',
      map: [
        '###########################',
        '#.................P.......#',
        '#....####...########......#',
        '#....#..#...#..#..#.......#',
        '#....#..#...#..#..#.......#',
        '#....####...########......#',
        '#.................########.#',
        '#.................#......#.#',
        '#.................#..X...#.#',
        '#.................########.#',
        '#......................#..#',
        '#.................E.......#',
        '#......................#..#',
        '###########################'
      ],
      playerStart: { x: 360, y: 60 },
      npcs: [
        {
          id: 'oldprisoner',
          name: 'Old Prisoner',
          role: 'Political Detainee',
          x: 520,
          y: 320,
          dialogues: [
            'Is it... is it over? Have they come for us at last?',
            'I have been here so long I forgot what daylight looked like.',
            'Thank you... for remembering us.'
          ],
          questId: 'rescue-prisoners'
        },
        {
          id: 'youngprisoner',
          name: 'Young Prisoner',
          role: 'Noble Sympathizer',
          x: 600,
          y: 260,
          dialogues: [
            'You must escape and tell them—tell them what happens to those who speak against the crown.',
            'The world must know the truth of this place.'
          ],
          questId: 'rescue-prisoners'
        }
      ],
      enemies: [
        { x: 240, y: 140, health: 45, type: 'jailer' },
        { x: 480, y: 140, health: 45, type: 'jailer' },
        { x: 360, y: 420, health: 40, type: 'guard' }
      ],
      quests: [
        {
          id: 'rescue-prisoners',
          title: 'Rescue Political Prisoners',
          description: 'The dungeons hold victims of royal tyranny. Free them and discover what they know.',
          objectives: ['Reach the prison cells', 'Free the prisoners', 'Escape with them'],
          reward: 125,
          nextQuest: null
        }
      ],
      levelCompleteCondition: () => {
        return gameState.flags.rescuedPrisoners && gameState.player.health > 0;
      }
    },
    {
      id: 4,
      title: 'Chapter IV: The Governor\'s Stand',
      location: 'The Bastille Keep',
      description: 'Face the fortress commander in the final confrontation.',
      map: [
        '############################',
        '#................B.........#',
        '#.#####.......#####.......#',
        '#.#...#.......#...#.......#',
        '#.#.P.#.......#...#.......#',
        '#.#...#.......#...#.......#',
        '#.#####.......#####.......#',
        '#...............................#',
        '#.....E....E....E....E........#',
        '#.............................#',
        '#.............................#',
        '############################'
      ],
      playerStart: { x: 120, y: 180 },
      npcs: [
        {
          id: 'launay',
          name: 'Bernard de Launay',
          role: 'Governor of the Bastille',
          x: 480,
          y: 60,
          dialogues: [
            'I am the last keeper of this fortress. I will not surrender it to a mob!',
            'The authority of France shall not break!',
            'You have won... but the cost... the blood spilled here will echo through the ages.'
          ],
          questId: 'defeat-launay',
          isBoss: true
        }
      ],
      enemies: [
        { x: 180, y: 300, health: 35, type: 'guard' },
        { x: 300, y: 300, health: 35, type: 'guard' },
        { x: 420, y: 300, health: 35, type: 'guard' },
        { x: 540, y: 300, health: 35, type: 'guard' },
        { x: 480, y: 60, health: 100, type: 'boss', isBoss: true }
      ],
      quests: [
        {
          id: 'defeat-launay',
          title: 'Defeat Governor de Launay',
          description: 'The governor makes his final stand. Defeat him and end the Bastille\'s reign of tyranny.',
          objectives: ['Defeat the guards', 'Defeat Bernard de Launay', 'Free France'],
          reward: 200,
          nextQuest: null
        }
      ],
      levelCompleteCondition: () => {
        return gameState.flags.bastilleStormed && gameState.player.health > 0;
      }
    }
  ],
  items: {
    'liberty-pamphlet': { name: 'Liberty Pamphlet', description: 'A call to arms for the revolution.' },
    'powder-horn': { name: 'Powder Horn', description: 'Contains ammunition and gunpowder.' },
    'gunpowder': { name: 'Gunpowder Cache', description: 'Enough to breach the inner walls.' },
    'prisoner-key': { name: 'Prison Key', description: 'Opens the dungeon cells.' },
    'governor-seal': { name: 'Governor\'s Seal', description: 'Proof of the Bastille\'s fall.' }
  }
};
