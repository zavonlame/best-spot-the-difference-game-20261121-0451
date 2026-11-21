// The street itself, drawn fresh by code: no image files, nothing borrowed.
// drawScene paints one 560x560 panel. The two panels share the same base street;
// a round's `left` and `right` flag sets make exactly seven things differ, and
// each flag's spot in the round's data sits where that thing is drawn.

const STARS = [
  [40, 40], [90, 90], [140, 30], [190, 70], [240, 35], [330, 90], [380, 40],
  [430, 60], [520, 35], [60, 140], [170, 120], [350, 130], [500, 140], [120, 200],
];

/** Window grids per building: {x, y, w, h} of each building, then its window columns and rows. */
const BUILDINGS = [
  { x: 20, y: 130, w: 165, h: 340, cols: [35, 70, 105, 140], rows: [160, 205, 250, 295] },
  { x: 200, y: 95, w: 160, h: 425, cols: [215, 250, 285, 320], rows: [125, 170, 215, 260, 305] },
  { x: 375, y: 115, w: 165, h: 355, cols: [390, 425, 460, 495], rows: [145, 190, 235, 280] },
];

const WINDOW_W = 22;
const WINDOW_H = 28;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, palette, flags) {
  const sky = ctx.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 560, 340);
  ctx.fillStyle = '#f5eeda';
  for (let i = 0; i < STARS.length; i += 1) {
    const [x, y] = STARS[i];
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (flags.stars === 15) {
    ctx.beginPath();
    ctx.arc(300, 48, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The moon, with a soft halo and craters when the flag says so.
  const halo = ctx.createRadialGradient(470, flags.moonY, 10, 470, flags.moonY, 70);
  halo.addColorStop(0, 'rgba(245,238,218,0.18)');
  halo.addColorStop(1, 'rgba(245,238,218,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(400, flags.moonY - 70, 140, 140);
  ctx.fillStyle = '#f5eeda';
  ctx.beginPath();
  ctx.arc(470, flags.moonY, 34, 0, Math.PI * 2);
  ctx.fill();
  if (flags.moonFace === 'craters') {
    ctx.fillStyle = '#d8cfae';
    for (const [cx, cy, cr] of [[458, flags.moonY - 8, 6], [482, flags.moonY + 6, 8], [468, flags.moonY + 14, 4]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWindows(ctx, palette, flags, building, index) {
  for (let row = 0; row < building.rows.length; row += 1) {
    for (let col = 0; col < building.cols.length; col += 1) {
      const x = building.cols[col];
      const y = building.rows[row];
      const isSpecialLit = index === 1 && col === 1 && row === 2;
      const isCurtain = index === 2 && col === 1 && row === 1;
      let lit = (col * 3 + row * 5 + index * 2) % 4 === 0;
      if (isSpecialLit) lit = flags.litWindow === 'on';
      ctx.fillStyle = lit ? palette.windowLit : palette.windowDark;
      ctx.fillRect(x, y, WINDOW_W, WINDOW_H);
      if (isCurtain && flags.curtain === 'closed') {
        ctx.fillStyle = '#8a6a8f';
        ctx.fillRect(x, y, WINDOW_W, WINDOW_H);
        ctx.fillStyle = '#6a4a6f';
        ctx.fillRect(x + WINDOW_W / 2 - 1, y, 2, WINDOW_H);
      } else if (lit) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x + WINDOW_W / 2 - 1, y, 2, WINDOW_H);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeRect(x + 0.5, y + 0.5, WINDOW_W - 1, WINDOW_H - 1);
    }
  }
}

function drawBuildings(ctx, palette, flags) {
  for (let index = 0; index < BUILDINGS.length; index += 1) {
    const b = BUILDINGS[index];
    ctx.fillStyle = index === 1 ? palette.building : palette.buildingDark;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x, b.y, b.w, 6);
    drawWindows(ctx, palette, flags, b, index);
  }
  // Chimney on the first roof, with smoke when the flag says so.
  ctx.fillStyle = palette.buildingDark;
  ctx.fillRect(52, 70, 16, 60);
  if (flags.smoke) {
    ctx.fillStyle = 'rgba(220,220,230,0.55)';
    for (const [cx, cy, cr] of [[60, 58, 9], [67, 44, 12], [57, 28, 14]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The clock tower on the third roof.
  ctx.fillStyle = palette.buildingDark;
  ctx.fillRect(440, 80, 30, 35);
  ctx.fillStyle = '#f5eeda';
  ctx.beginPath();
  ctx.arc(455, 97, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a2a33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(455, 97);
  if (flags.clock === 0) {
    ctx.lineTo(443, 97);
    ctx.moveTo(455, 97);
    ctx.lineTo(455, 85);
  } else {
    ctx.lineTo(464, 105);
    ctx.moveTo(455, 97);
    ctx.lineTo(455, 109);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawShop(ctx, palette, flags) {
  // The sign above the shop: a rectangle on the left picture, an arch on the right.
  ctx.fillStyle = '#e8dcc0';
  if (flags.sign === 'rect') {
    ctx.fillRect(250, 350, 80, 36);
  } else {
    ctx.beginPath();
    ctx.moveTo(250, 386);
    ctx.lineTo(250, 368);
    ctx.arc(290, 368, 40, Math.PI, 0);
    ctx.lineTo(330, 386);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#3a2a20';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CAFE', 290, 370);
  // The striped awning, red on one side and teal on the other.
  const awning = flags.awning === 'red' ? palette.awningRed : palette.awningTeal;
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? awning : '#e8dcc0';
    ctx.fillRect(215 + i * 25, 395, 25, 40);
  }
  ctx.fillStyle = awning;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(227 + i * 25, 435, 12, 0, Math.PI);
    ctx.fill();
  }
  // The shop door, red on one side and blue on the other.
  ctx.fillStyle = flags.door === 'red' ? '#a03a3a' : '#3a5aa0';
  ctx.fillRect(275, 440, 30, 80);
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(298, 482, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawStreet(ctx, palette, flags) {
  ctx.fillStyle = palette.street;
  ctx.fillRect(0, 470, 560, 90);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (const y of [490, 515, 540]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(560, y);
    ctx.stroke();
  }
  // The low wall the cat sits on, and the planter box that moves between rounds.
  ctx.fillStyle = palette.wall;
  ctx.fillRect(400, 440, 140, 30);
  ctx.fillStyle = '#6a4a3a';
  ctx.fillRect(flags.plantX - 18, 428, 36, 22);
  ctx.fillStyle = '#5a9e4a';
  ctx.beginPath();
  ctx.arc(flags.plantX - 8, 424, 7, 0, Math.PI * 2);
  ctx.arc(flags.plantX + 8, 424, 7, 0, Math.PI * 2);
  ctx.fill();
  // The little car.
  ctx.fillStyle = flags.car === 'blue' ? palette.carBlue : palette.carGreen;
  roundRect(ctx, 120, 480, 160, 40, 10);
  ctx.fill();
  roundRect(ctx, 160, 455, 80, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#bcd8ff';
  ctx.fillRect(170, 460, 28, 20);
  ctx.fillRect(205, 460, 28, 20);
  ctx.fillStyle = '#1a1a22';
  for (const wx of [150, 250]) {
    ctx.beginPath();
    ctx.arc(wx, 520, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  // The bicycle, present on one side only.
  if (flags.bike) {
    ctx.strokeStyle = '#c9c9d4';
    ctx.lineWidth = 3;
    for (const wx of [395, 435]) {
      ctx.beginPath();
      ctx.arc(wx, 525, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(395, 525);
    ctx.lineTo(415, 500);
    ctx.lineTo(435, 525);
    ctx.moveTo(415, 500);
    ctx.lineTo(408, 490);
    ctx.moveTo(415, 500);
    ctx.lineTo(428, 492);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  // The tree: a round canopy on one side, a pointed one on the other.
  ctx.fillStyle = '#4a2f1d';
  ctx.fillRect(494, 380, 12, 90);
  ctx.fillStyle = '#3f7a3a';
  if (flags.tree === 'round') {
    ctx.beginPath();
    ctx.arc(500, 300, 55, 0, Math.PI * 2);
    ctx.arc(470, 330, 30, 0, Math.PI * 2);
    ctx.arc(530, 330, 30, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(500, 225);
    ctx.lineTo(555, 340);
    ctx.lineTo(445, 340);
    ctx.closePath();
    ctx.fill();
  }
  if (flags.leaf) {
    ctx.fillStyle = '#7ec97a';
    ctx.beginPath();
    ctx.ellipse(520, 280, 10, 6, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // The lamppost, warm or cool, with or without its halo.
  if (flags.glow) {
    const halo = ctx.createRadialGradient(90, 300, 4, 90, 300, 60);
    halo.addColorStop(0, 'rgba(255,210,122,0.35)');
    halo.addColorStop(1, 'rgba(255,210,122,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(20, 230, 140, 140);
  }
  ctx.fillStyle = '#2a2a33';
  ctx.fillRect(86, 300, 8, 245);
  ctx.fillStyle = flags.lamp === 'warm' ? '#ffd27a' : '#bcd8ff';
  ctx.beginPath();
  ctx.arc(90, 300, 12, 0, Math.PI * 2);
  ctx.fill();
  // The cat on the wall, tail up on one side and down on the other.
  if (flags.cat === 'sit') {
    ctx.fillStyle = '#23232e';
    ctx.beginPath();
    ctx.ellipse(470, 425, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(470, 400, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(462, 394);
    ctx.lineTo(465, 384);
    ctx.lineTo(469, 393);
    ctx.moveTo(472, 393);
    ctx.lineTo(476, 384);
    ctx.lineTo(479, 394);
    ctx.fill();
    ctx.strokeStyle = '#23232e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (flags.tail === 'up') {
      ctx.moveTo(482, 432);
      ctx.quadraticCurveTo(496, 420, 492, 402);
    } else {
      ctx.moveTo(482, 432);
      ctx.quadraticCurveTo(494, 440, 488, 452);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(466, 399, 2, 0, Math.PI * 2);
    ctx.arc(474, 399, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // The wire and the bird that perches on it on one side only.
  ctx.strokeStyle = 'rgba(200,200,210,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(180, 58);
  ctx.quadraticCurveTo(260, 64, 340, 58);
  ctx.stroke();
  if (flags.bird) {
    ctx.fillStyle = '#23232e';
    ctx.beginPath();
    ctx.ellipse(250, 54, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(258, 50, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // The flower pot on a windowsill, present on one side only.
  if (flags.pot) {
    ctx.fillStyle = '#a05a3a';
    ctx.fillRect(288, 227, 16, 16);
    ctx.fillStyle = '#5a9e4a';
    ctx.beginPath();
    ctx.arc(292, 224, 5, 0, Math.PI * 2);
    ctx.arc(300, 224, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Paint one 560x560 panel: `side` is 'left' or 'right'. */
export function drawScene(ctx, round, side) {
  const flags = round[side];
  const palette = round.palette;
  drawSky(ctx, palette, flags);
  drawBuildings(ctx, palette, flags);
  drawShop(ctx, palette, flags);
  drawStreet(ctx, palette, flags);
}
