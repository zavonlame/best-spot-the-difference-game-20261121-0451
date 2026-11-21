// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play, paused,
// round-clear, game over and win. Clicks on the bottom-bar buttons act as buttons;
// clicks on the pictures are passed to the world.
//
// ?seed=N fixes nothing random here (the rounds are fixed), but ?shot=start|play|end
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createWorld, EVENT_FOUND, EVENT_HINT, EVENT_ROUND_CLEAR, EVENT_TIME_UP, EVENT_WIN, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { BUTTONS, createRenderer, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { createSound } from './sound.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    // Screenshots show the sound button as on: no sound plays in shot mode,
    // but the button's state is part of the game's ordinary look.
    renderer.draw(world.state, scene.screen, scene.best, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function finishGame() {
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    sound.start();
    announce('Playing. Find 7 differences in each round.');
  }

  function handleEvents(events) {
    if (events & EVENT_FOUND) {
      sound.found();
      announce(`Found ${world.state.lastFound}. ${world.state.found.length} of 7.`);
    }
    if (events & EVENT_WRONG) {
      sound.wrong();
      announce('Not a difference. 25 points lost.');
    }
    if (events & EVENT_HINT) sound.hint();
    if (events & EVENT_ROUND_CLEAR) {
      sound.roundClear();
      screen = SCREEN_CLEAR;
      announce(`Round clear. Time bonus ${world.state.roundBonus} points.`);
    }
    if (events & EVENT_WIN) {
      sound.win();
      screen = SCREEN_WIN;
      finishGame();
      announce(`You found them all. Score ${world.state.score}. Best ${best}.`);
    }
    if (events & EVENT_TIME_UP) {
      sound.lose();
      screen = SCREEN_OVER;
      finishGame();
      announce(`Time is up. Score ${world.state.score}. Best ${best}.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      handleEvents(world.useHint());
    }
    if (actions & ACTION_CONFIRM) {
      sound.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_CLEAR) {
        world.nextRound();
        screen = SCREEN_PLAY;
        announce('Next round. Find 7 differences.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_WIN)) startGame();
  }

  function handleClicks() {
    for (const click of input.takeClicks()) {
      sound.unlock();
      if (inside(BUTTONS.hint, click.x, click.y)) {
        if (screen === SCREEN_PLAY) handleEvents(world.useHint());
        continue;
      }
      if (inside(BUTTONS.pause, click.x, click.y)) {
        if (screen === SCREEN_PLAY) {
          screen = SCREEN_PAUSED;
          announce('Paused.');
        } else if (screen === SCREEN_PAUSED) {
          screen = SCREEN_PLAY;
          announce('Playing.');
        }
        continue;
      }
      if (inside(BUTTONS.mute, click.x, click.y)) {
        const muted = sound.toggleMute();
        announce(muted ? 'Sound off.' : 'Sound on.');
        continue;
      }
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
        startGame();
      } else if (screen === SCREEN_CLEAR) {
        world.nextRound();
        screen = SCREEN_PLAY;
        announce('Next round. Find 7 differences.');
      } else if (screen === SCREEN_PLAY) {
        handleEvents(world.clickAt(click.x, click.y));
      }
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    handleEvents(world.step(STEP));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    while (accumulator >= STEP && screen === SCREEN_PLAY) {
      step();
      accumulator -= STEP;
    }
    if (screen !== SCREEN_PLAY) accumulator = 0;
    renderer.draw(world.state, screen, best, sound.muted);
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Twin Streets. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
