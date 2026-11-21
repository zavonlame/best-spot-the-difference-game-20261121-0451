// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin filled
// with the backdrop colour. The two street panels are painted by scene.js; this
// file adds the header, the rings on found differences, the buttons and the
// panels for the title, pause, round-clear, win and lose screens.

import { FIELD, FONT, PALETTE, PANEL, ROUNDS } from './config.js';
import { drawScene } from './scene.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

/** The clickable buttons in the bottom bar, in field coordinates. */
export const BUTTONS = {
  hint: { x: 32, y: 664, w: 148, h: 44 },
  pause: { x: 196, y: 664, w: 148, h: 44 },
  mute: { x: 360, y: 664, w: 148, h: 44 },
};

const PANEL_FRAME = 4;

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = `${size}:${weight ?? ''}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ? `${weight} ` : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function drawHeader(state) {
    const round = ROUNDS[state.roundIndex];
    context.fillStyle = PALETTE.header;
    context.fillRect(0, 0, FIELD.width, 72);
    context.fillStyle = PALETTE.headerLine;
    context.fillRect(0, 72, FIELD.width, 2);
    text('TWIN STREETS', 32, 46, 30, PALETTE.accent, 'left', 'bold');
    text(`Round ${state.roundIndex + 1} of ${ROUNDS.length} · ${round.name}`, 280, 46, 22, PALETTE.text, 'left');
    const found = `${state.found.length}/${round.spots.length} found`;
    text(found, 860, 46, 24, PALETTE.text, 'right');
    const timeText = formatTime(state.timeLeft);
    const timeColor = state.timeLeft <= 10 ? PALETTE.wrong : PALETTE.text;
    text(timeText, 990, 46, 28, timeColor, 'right', 'bold');
    const fraction = Math.max(0, state.timeLeft / round.time);
    context.fillStyle = PALETTE.panelLine;
    context.fillRect(1010, 28, 100, 10);
    context.fillStyle = state.timeLeft <= 10 ? PALETTE.wrong : PALETTE.accent;
    context.fillRect(1010, 28, 100 * fraction, 10);
    text(`Score ${state.score}`, 1248, 46, 24, PALETTE.text, 'right');
  }

  function drawPanels(state, screen) {
    const round = ROUNDS[state.roundIndex];
    const panelOrigins = [
      { label: 'A', x: PANEL.leftX },
      { label: 'B', x: PANEL.rightX },
    ];
    for (const panel of panelOrigins) {
      context.save();
      rounded(context, panel.x - PANEL_FRAME, PANEL.y - PANEL_FRAME, PANEL.width + PANEL_FRAME * 2, PANEL.height + PANEL_FRAME * 2, 10);
      context.clip();
      context.translate(panel.x, PANEL.y);
      drawScene(context, round, panel.label === 'A' ? 'left' : 'right');
      context.restore();
      context.strokeStyle = PALETTE.panelLine;
      context.lineWidth = 2;
      rounded(context, panel.x - PANEL_FRAME, PANEL.y - PANEL_FRAME, PANEL.width + PANEL_FRAME * 2, PANEL.height + PANEL_FRAME * 2, 10);
      context.stroke();
      // The corner badge naming the picture.
      context.fillStyle = PALETTE.panel;
      rounded(context, panel.x + 8, PANEL.y + 8, 34, 34, 8);
      context.fill();
      text(panel.label, panel.x + 25, PANEL.y + 33, 22, PALETTE.text, 'center', 'bold');
    }
    if (screen === SCREEN_TITLE) return;
    // Rings on every difference found, on both pictures at once.
    for (const index of state.found) {
      const spot = round.spots[index];
      for (const panel of panelOrigins) {
        const cx = panel.x + spot.x;
        const cy = PANEL.y + spot.y;
        context.strokeStyle = 'rgba(126,231,135,0.35)';
        context.lineWidth = 9;
        context.beginPath();
        context.arc(cx, cy, spot.r, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = PALETTE.ring;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(cx, cy, spot.r, 0, Math.PI * 2);
        context.stroke();
      }
    }
    // The hint ring pulses around one difference not found yet.
    if (state.hintRing !== null) {
      const pulse = 1 + 0.1 * Math.sin(performance.now() / 130);
      const spot = state.hintRing.spot;
      for (const panel of panelOrigins) {
        const cx = panel.x + spot.x;
        const cy = PANEL.y + spot.y;
        context.strokeStyle = PALETTE.hint;
        context.lineWidth = 4;
        context.setLineDash([10, 8]);
        context.beginPath();
        context.arc(cx, cy, spot.r * pulse, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
      }
    }
    // Wrong clicks leave a fading red cross where they landed.
    for (const flash of state.wrongFlashes) {
      const alpha = Math.max(0, flash.ttl / 0.9);
      context.strokeStyle = `rgba(229,83,75,${alpha})`;
      context.lineWidth = 5;
      const half = 16;
      context.beginPath();
      context.moveTo(flash.x - half, flash.y - half);
      context.lineTo(flash.x + half, flash.y + half);
      context.moveTo(flash.x + half, flash.y - half);
      context.lineTo(flash.x - half, flash.y + half);
      context.stroke();
    }
  }

  function drawButton(rect, label, enabled) {
    context.fillStyle = enabled ? PALETTE.button : PALETTE.panel;
    rounded(context, rect.x, rect.y, rect.w, rect.h, 10);
    context.fill();
    context.strokeStyle = PALETTE.panelLine;
    context.lineWidth = 1;
    rounded(context, rect.x, rect.y, rect.w, rect.h, 10);
    context.stroke();
    text(label, rect.x + rect.w / 2, rect.y + 29, 20, enabled ? PALETTE.buttonText : PALETTE.muted, 'center');
  }

  function drawBottomBar(state, screen, muted) {
    const round = ROUNDS[state.roundIndex];
    const playing = screen === SCREEN_PLAY || screen === SCREEN_PAUSED;
    drawButton(BUTTONS.hint, `Hint (H) · ${state.hintsLeft} left`, playing && state.hintsLeft > 0);
    drawButton(BUTTONS.pause, screen === SCREEN_PAUSED ? 'Resume (P)' : 'Pause (P)', playing);
    drawButton(BUTTONS.mute, muted ? 'Sound off (M)' : 'Sound on (M)', true);
    let message = `Find ${round.spots.length} differences — click what differs!`;
    if (state.lastFound !== '') message = `Found ${state.lastFound}!`;
    if (screen === SCREEN_TITLE) message = 'Two pictures, seven differences. How sharp are your eyes?';
    text(message, 1248, 694, 20, PALETTE.muted, 'right');
  }

  function drawPanel(title, lines, prompt) {
    const width = 640;
    const lineHeight = 32;
    const height = 150 + lines.length * lineHeight + 66;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(10,12,20,0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    rounded(context, x, y, width, height, 16);
    context.fill();
    context.strokeStyle = PALETTE.panelLine;
    context.lineWidth = 2;
    rounded(context, x, y, width, height, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 74, 44, PALETTE.text, 'center', 'bold');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + 130 + index * lineHeight, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 34, 22, PALETTE.accent, 'center');
  }

  /** Paint one frame: the header, the two pictures, the bottom bar, then a panel for the screen. */
  function draw(state, screen, best, muted) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawHeader(state);
    drawPanels(state, screen);
    drawBottomBar(state, screen, muted);
    const round = ROUNDS[state.roundIndex];
    if (screen === SCREEN_TITLE) {
      drawPanel('TWIN STREETS', [
        'Two pictures of the same night street. Seven things differ.',
        'Click a difference on either picture to ring it on both.',
        'A wrong click costs 25 points. Hints cost 50 — two per round.',
        'Clear all three rounds before the clock runs out.',
        'Keys: H hint · P pause · M sound · Space start.',
        `Best score ${best}`,
      ], 'Press Space or click to play');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The clock is waiting for you.'], 'Press P to resume');
    } else if (screen === SCREEN_CLEAR) {
      drawPanel(`Round ${state.roundIndex + 1} clear!`, [
        `All ${round.spots.length} differences found.`,
        `Time bonus +${state.roundBonus} points.`,
        `Score ${state.score}`,
      ], `Press Space for round ${state.roundIndex + 2}`);
    } else if (screen === SCREEN_WIN) {
      drawPanel('You found them all!', [
        'Every difference in every round — sharp eyes.',
        `Score ${state.score}`,
        `Best ${best}`,
      ], 'Press Space to play again');
    } else if (screen === SCREEN_OVER) {
      drawPanel('Time\u2019s up!', [
        `You found ${state.found.length} of ${round.spots.length} differences in round ${state.roundIndex + 1}.`,
        `Score ${state.score}`,
        `Best ${best}`,
      ], 'Press Space to try again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
