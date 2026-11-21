// Twin Streets — every number, colour and round in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size. Two panels, each 560x560,
// hold the two near-identical street scenes side by side.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Where the two picture panels sit inside the 1280x720 field. */
export const PANEL = { width: 560, height: 560, y: 88, leftX: 32, rightX: 688 };

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'twin-streets.best';

export const FOUND_POINTS = 100;
export const WRONG_POINTS = 25;
export const HINT_POINTS = 50;
export const HINTS_PER_ROUND = 2;
export const TIME_BONUS_PER_SECOND = 5;

/** How long a wrong-click cross stays on screen, and how long a hint ring pulses. */
export const WRONG_FLASH_SECONDS = 0.9;
export const HINT_PULSE_SECONDS = 2.5;

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const PALETTE = {
  backdrop: '#0d0f16',
  header: '#171a26',
  headerLine: '#2b3044',
  text: '#f2ead8',
  muted: '#9aa3b8',
  accent: '#f2c94c',
  accentDim: '#b98f2e',
  ring: '#7ee787',
  wrong: '#e5534b',
  hint: '#f2a33c',
  panel: '#1c2130',
  panelLine: '#39415c',
  button: '#2a3049',
  buttonText: '#f2ead8',
};

/**
 * One round: its name, its palette, its time limit, the two flag sets that make
 * the left and right pictures differ, and the seven spots the player must find.
 * A spot's x/y are scene coordinates inside one 560x560 panel, and r is how
 * close a click must land to count.
 */
export const ROUNDS = [
  {
    name: 'Willow Lane',
    time: 90,
    palette: {
      skyTop: '#241d4f', skyBottom: '#5a3468', building: '#37304f', buildingDark: '#2c2540',
      windowLit: '#f2c94c', windowDark: '#1d2138', street: '#241f33', wall: '#4a3f5e',
      awningRed: '#c94f5e', awningTeal: '#3fa08f', carBlue: '#4f7ec9', carGreen: '#4f9e6a',
    },
    left: {
      cat: 'sit', awning: 'red', moonY: 80, sign: 'rect', stars: 14, bike: true,
      litWindow: 'on', lamp: 'warm', pot: true, smoke: true, car: 'blue', tree: 'round',
      bird: false, door: 'red', clock: 0, tail: 'up', curtain: 'open', plantX: 120,
      leaf: false, glow: true, moonFace: 'plain',
    },
    right: {
      cat: 'none', awning: 'teal', moonY: 55, sign: 'arch', stars: 15, bike: false,
      litWindow: 'off', lamp: 'warm', pot: true, smoke: true, car: 'blue', tree: 'round',
      bird: false, door: 'red', clock: 0, tail: 'up', curtain: 'open', plantX: 120,
      leaf: false, glow: true, moonFace: 'plain',
    },
    spots: [
      { x: 470, y: 420, r: 30, name: 'the cat on the wall' },
      { x: 290, y: 415, r: 34, name: 'the shop awning' },
      { x: 470, y: 68, r: 45, name: 'the moon' },
      { x: 290, y: 372, r: 30, name: 'the shop sign' },
      { x: 300, y: 48, r: 22, name: 'a star in the sky' },
      { x: 415, y: 515, r: 32, name: 'the bicycle' },
      { x: 261, y: 229, r: 26, name: 'a lit window' },
    ],
  },
  {
    name: 'Market Lane',
    time: 75,
    palette: {
      skyTop: '#0e1a3a', skyBottom: '#1d3a5f', building: '#232c4a', buildingDark: '#1b2340',
      windowLit: '#ffd27a', windowDark: '#141a30', street: '#1a1a2c', wall: '#3c4666',
      awningRed: '#c94f5e', awningTeal: '#3fa08f', carBlue: '#4f7ec9', carGreen: '#4f9e6a',
    },
    left: {
      cat: 'sit', awning: 'red', moonY: 80, sign: 'rect', stars: 14, bike: true,
      litWindow: 'on', lamp: 'warm', pot: true, smoke: true, car: 'blue', tree: 'round',
      bird: false, door: 'red', clock: 0, tail: 'up', curtain: 'open', plantX: 120,
      leaf: false, glow: true, moonFace: 'plain',
    },
    right: {
      cat: 'sit', awning: 'red', moonY: 80, sign: 'rect', stars: 14, bike: true,
      litWindow: 'on', lamp: 'cool', pot: false, smoke: false, car: 'green', tree: 'pointy',
      bird: true, door: 'blue', clock: 0, tail: 'up', curtain: 'open', plantX: 120,
      leaf: false, glow: true, moonFace: 'plain',
    },
    spots: [
      { x: 90, y: 300, r: 26, name: 'the lamppost light' },
      { x: 300, y: 250, r: 22, name: 'the flower pot' },
      { x: 60, y: 60, r: 26, name: 'the chimney smoke' },
      { x: 200, y: 495, r: 40, name: 'the little car' },
      { x: 500, y: 300, r: 55, name: 'the tree' },
      { x: 250, y: 58, r: 20, name: 'a bird on the wire' },
      { x: 290, y: 490, r: 26, name: 'the shop door' },
    ],
  },
  {
    name: 'Rooftop Garden',
    time: 60,
    palette: {
      skyTop: '#0d2b2e', skyBottom: '#17505a', building: '#1f3a44', buildingDark: '#183038',
      windowLit: '#ffe9a8', windowDark: '#12242c', street: '#14262b', wall: '#2f4a52',
      awningRed: '#c94f5e', awningTeal: '#3fa08f', carBlue: '#4f7ec9', carGreen: '#4f9e6a',
    },
    left: {
      cat: 'sit', awning: 'red', moonY: 80, sign: 'rect', stars: 14, bike: true,
      litWindow: 'on', lamp: 'warm', pot: true, smoke: true, car: 'blue', tree: 'round',
      bird: false, door: 'red', clock: 0, tail: 'up', curtain: 'open', plantX: 120,
      leaf: false, glow: true, moonFace: 'plain',
    },
    right: {
      cat: 'sit', awning: 'red', moonY: 80, sign: 'rect', stars: 14, bike: true,
      litWindow: 'on', lamp: 'warm', pot: true, smoke: true, car: 'blue', tree: 'round',
      bird: false, door: 'red', clock: 1, tail: 'down', curtain: 'closed', plantX: 150,
      leaf: true, glow: false, moonFace: 'craters',
    },
    spots: [
      { x: 455, y: 97, r: 28, name: 'the tower clock' },
      { x: 436, y: 204, r: 26, name: 'a curtained window' },
      { x: 135, y: 455, r: 26, name: 'the planter box' },
      { x: 470, y: 420, r: 30, name: 'the cat\u2019s tail' },
      { x: 520, y: 280, r: 20, name: 'a leaf on the tree' },
      { x: 90, y: 300, r: 30, name: 'the lamppost glow' },
      { x: 470, y: 80, r: 36, name: 'the face of the moon' },
    ],
  },
];
