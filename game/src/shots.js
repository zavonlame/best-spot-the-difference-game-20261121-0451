// The screenshot scenes behind ?shot=start|play|end. Each one sets the world
// to a fixed, repeatable state — the title over a fresh round, mid-play with
// three differences ringed and four still to find, and the win screen after a
// full game — so the same seed always gives the same frame, and the frame is
// what a real game really looks like.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name === 'play') {
    state.found = [0, 1, 2];
    state.timeLeft = 47;
    state.score = 300;
    state.hintsLeft = 1;
    state.lastFound = 'the shop awning';
    // One hint is already in play, ringing a difference not found yet.
    state.hintRing = { spot: world.round().spots[4], ttl: 2.5 };
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    state.roundIndex = 2;
    state.found = [0, 1, 2, 3, 4, 5, 6];
    state.timeLeft = 12;
    state.score = 2150;
    state.won = true;
    return { screen: SCREEN_WIN, best: 2150 };
  }
  if (name === 'over') {
    state.found = [0, 3];
    state.timeLeft = 0;
    state.score = 175;
    state.over = true;
    return { screen: SCREEN_OVER, best: 175 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
