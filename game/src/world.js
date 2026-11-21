// The game's rules and state, with no drawing and no browser in it: which round
// is running, what the player has found, the clock, the score and the hints.
// step() advances one fixed step and returns what happened as bit flags, so the
// caller can react (and play sounds) without the world knowing about screens.

import {
  FOUND_POINTS, HINTS_PER_ROUND, HINT_POINTS, HINT_PULSE_SECONDS, PANEL,
  ROUNDS, STEP, TIME_BONUS_PER_SECOND, WRONG_FLASH_SECONDS, WRONG_POINTS,
} from './config.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_HINT = 4;
export const EVENT_ROUND_CLEAR = 8;
export const EVENT_TIME_UP = 16;
export const EVENT_WIN = 32;

function distanceSquared(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function createWorld() {
  const state = {
    roundIndex: 0,
    found: [],
    timeLeft: ROUNDS[0].time,
    score: 0,
    hintsLeft: HINTS_PER_ROUND,
    mistakes: 0,
    over: false,
    won: false,
    roundBonus: 0,
    // A wrong click leaves a fading cross at {x, y, ttl} in field coordinates.
    wrongFlashes: [],
    // A hint leaves a pulsing ring on a spot: {spot, ttl} in scene coordinates.
    hintRing: null,
    // The last thing found, for the message line: a spot name or ''.
    lastFound: '',
  };

  function round() {
    return ROUNDS[state.roundIndex];
  }

  function reset() {
    state.roundIndex = 0;
    state.score = 0;
    state.mistakes = 0;
    state.over = false;
    state.won = false;
    state.roundBonus = 0;
    state.wrongFlashes = [];
    state.hintRing = null;
    state.lastFound = '';
    startRound();
  }

  function startRound() {
    const current = round();
    state.found = [];
    state.timeLeft = current.time;
    state.hintsLeft = HINTS_PER_ROUND;
    state.wrongFlashes = [];
    state.hintRing = null;
    state.lastFound = '';
  }

  /** Which panel (if any) a field point is in, and its scene coordinates. */
  function locate(x, y) {
    if (y < PANEL.y || y > PANEL.y + PANEL.height) return null;
    if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.width) {
      return { side: 'left', sx: x - PANEL.leftX, sy: y - PANEL.y };
    }
    if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.width) {
      return { side: 'right', sx: x - PANEL.rightX, sy: y - PANEL.y };
    }
    return null;
  }

  /**
   * A click at field coordinates (x, y). Returns event flags. A click on a
   * difference neither panel has found yet rings it on both panels; a click
   * anywhere else on a picture costs points and leaves a red cross.
   */
  function clickAt(x, y) {
    if (state.over || state.won) return 0;
    const spot = locate(x, y);
    if (spot === null) return 0;
    const current = round();
    let hitFound = false;
    for (let index = 0; index < current.spots.length; index += 1) {
      const target = current.spots[index];
      if (distanceSquared(spot.sx, spot.sy, target.x, target.y) > target.r * target.r) continue;
      // An unfound difference wins over a ringed one nearby: the click counts
      // for the difference the player has not found yet.
      if (state.found.includes(index)) {
        hitFound = true;
        continue;
      }
      state.found.push(index);
      state.score += FOUND_POINTS;
      state.lastFound = target.name;
      state.hintRing = null;
      if (state.found.length === current.spots.length) {
        state.roundBonus = Math.ceil(state.timeLeft) * TIME_BONUS_PER_SECOND;
        state.score += state.roundBonus;
        if (state.roundIndex === ROUNDS.length - 1) {
          state.won = true;
          return EVENT_FOUND | EVENT_WIN;
        }
        return EVENT_FOUND | EVENT_ROUND_CLEAR;
      }
      return EVENT_FOUND;
    }
    // Clicking a difference already ringed is harmless: it is not a miss.
    if (hitFound) return 0;
    state.score = Math.max(0, state.score - WRONG_POINTS);
    state.mistakes += 1;
    state.wrongFlashes.push({ x, y, ttl: WRONG_FLASH_SECONDS });
    return EVENT_WRONG;
  }

  /** Spend a hint: ring one difference the player has not found yet. */
  function useHint() {
    if (state.over || state.won || state.hintsLeft <= 0) return 0;
    const current = round();
    const remaining = [];
    for (let index = 0; index < current.spots.length; index += 1) {
      if (!state.found.includes(index)) remaining.push(index);
    }
    if (remaining.length === 0) return 0;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hintRing = { spot: current.spots[pick], ttl: HINT_PULSE_SECONDS };
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - HINT_POINTS);
    return EVENT_HINT;
  }

  /** Move to the next round after a round-clear panel. */
  function nextRound() {
    if (state.roundIndex < ROUNDS.length - 1) {
      state.roundIndex += 1;
      startRound();
    }
  }

  /** One fixed step: the clock runs down and the flashes fade. */
  function step(dt) {
    let events = 0;
    if (!state.over && !state.won) {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.over = true;
        events |= EVENT_TIME_UP;
      }
    }
    for (const flash of state.wrongFlashes) flash.ttl -= dt;
    state.wrongFlashes = state.wrongFlashes.filter((flash) => flash.ttl > 0);
    if (state.hintRing !== null) {
      state.hintRing.ttl -= dt;
      if (state.hintRing.ttl <= 0) state.hintRing = null;
    }
    return events;
  }

  reset();
  return { state, reset, startRound, clickAt, useHint, nextRound, step, round, STEP };
}
