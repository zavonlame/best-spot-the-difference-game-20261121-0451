// Keyboard and pointer input. One-shot presses (start, pause, hint, mute,
// restart) are queued as bit flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice. Pointer presses
// are queued with their position in the 1280x720 logical field, so the loop
// can tell a click on a picture from a click on a button.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);

export function createInput(target) {
  let actions = 0;
  const clicks = [];

  function logicalPosition(event) {
    const rect = target.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
    else if (PAUSE.has(event.code)) actions |= ACTION_PAUSE;
    else if (HINT.has(event.code)) actions |= ACTION_HINT;
    else if (MUTE.has(event.code)) actions |= ACTION_MUTE;
    else if (RESTART.has(event.code)) actions |= ACTION_RESTART;
    else return;
    event.preventDefault();
  });
  // A key released while the tab is hidden never sends keyup: nothing held
  // here needs releasing, but a hidden tab still pauses the game (see main).
  target.addEventListener('pointerdown', (event) => {
    clicks.push(logicalPosition(event));
  });
  // A long press on a touch screen must not open the browser's menu mid-game.
  target.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The pointer presses since the last call, as {x, y} field points. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
