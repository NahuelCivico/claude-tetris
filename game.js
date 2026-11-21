'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#f06292', // + - pink
  '#4db6ac', // U - teal
  '#aed581', // Y - lime
  '#ffffff', // 1×1 - white
  '#a1887f', // 3×3 hueca - brown
];

const COLORS_LIGHT = [
  null,
  '#00acc1', // I
  '#f9a825', // O
  '#8e24aa', // T
  '#43a047', // S
  '#e53935', // Z
  '#1e88e5', // J
  '#fb8c00', // L
  '#d81b60', // +
  '#00897b', // U
  '#7cb342', // Y
  '#546e7a', // 1×1
  '#6d4c41', // 3×3 hueca
];

// ---- Skins (temas visuales) ----
// Cada skin define sus paletas (dark / light, 13 entradas indexadas como COLORS),
// un fondo de canvas opcional, un color de grilla opcional y su propia función de dibujo.

const NEON_COLORS = [
  null,
  '#00f0ff', // I
  '#fff200', // O
  '#d000ff', // T
  '#39ff14', // S
  '#ff073a', // Z
  '#1f51ff', // J
  '#ff8c00', // L
  '#ff10f0', // +
  '#00ffc8', // U
  '#b0ff00', // Y
  '#ffffff', // 1×1
  '#ff6ec7', // 3×3 hueca
];

const PASTEL_COLORS = [
  null,
  '#a8e6ef', // I
  '#fff1a8', // O
  '#dcc6f0', // T
  '#bfe8c4', // S
  '#f7c1c1', // Z
  '#c4dcf7', // J
  '#ffd8b0', // L
  '#f9c6dc', // +
  '#b5e3dc', // U
  '#dcefb8', // Y
  '#f4f4f4', // 1×1
  '#dccbc4', // 3×3 hueca
];

const PASTEL_COLORS_LIGHT = [
  null,
  '#7fd3e0', // I
  '#f7dc6f', // O
  '#c3a3e6', // T
  '#9bd8a3', // S
  '#f19c9c', // Z
  '#9fc3ef', // J
  '#f9be86', // L
  '#f2a2c4', // +
  '#8fd1c6', // U
  '#c4e292', // Y
  '#b8bccb', // 1×1
  '#c4aca2', // 3×3 hueca
];

// Rectángulo con esquinas redondeadas (usa ctx.roundRect si existe)
function roundedRectPath(context, x, y, w, h, r) {
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, w, h, r);
    return;
  }
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

// Retro: bloques cuadrados, colores planos (estilo original)
function drawBlockRetro(context, px, py, size, color) {
  context.fillStyle = color;
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = theme === 'light' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)';
  context.fillRect(px + 1, py + 1, size - 2, 4);
}

// Neon: borde brillante con glow (shadowBlur) y relleno translúcido
function drawBlockNeon(context, px, py, size, color) {
  context.save();
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.fillStyle = color;
  context.globalAlpha *= 0.25;
  context.fillRect(px + 2, py + 2, size - 4, size - 4);
  context.restore();

  context.save();
  context.shadowColor = color;
  context.shadowBlur = 10;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(px + 3, py + 3, size - 6, size - 6);
  // núcleo brillante
  context.shadowBlur = 0;
  context.fillStyle = color;
  context.globalAlpha *= 0.6;
  context.fillRect(px + size / 2 - 3, py + size / 2 - 3, 6, 6);
  context.restore();
}

// Pastel: colores suaves con esquinas redondeadas y brillo superior
function drawBlockPastel(context, px, py, size, color) {
  const r = Math.max(3, size * 0.22);
  context.fillStyle = color;
  roundedRectPath(context, px + 1.5, py + 1.5, size - 3, size - 3, r);
  context.fill();
  context.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.35)';
  context.lineWidth = 1;
  context.stroke();
  // brillo
  context.fillStyle = 'rgba(255,255,255,0.4)';
  roundedRectPath(context, px + 5, py + 4, size - 10, size * 0.22, r / 2);
  context.fill();
}

// Pixel art: textura de dithering 3×3 px con bordes de luz y sombra
function drawBlockPixel(context, px, py, size, color) {
  // Alinear a píxeles enteros para que la textura quede nítida (drawNext usa offsets fraccionarios)
  px = Math.round(px);
  py = Math.round(py);
  const P = 3; // tamaño del "píxel" de la textura
  const inner = size - 2;
  const x0 = px + 1, y0 = py + 1;
  context.fillStyle = color;
  context.fillRect(x0, y0, inner, inner);
  // patrón de tablero (dither)
  context.fillStyle = 'rgba(0,0,0,0.14)';
  for (let yy = 0; yy + P <= inner; yy += P)
    for (let xx = 0; xx + P <= inner; xx += P)
      if (((xx + yy) / P) % 2 === 0) context.fillRect(x0 + xx, y0 + yy, P, P);
  // borde de luz (arriba / izquierda)
  context.fillStyle = 'rgba(255,255,255,0.45)';
  context.fillRect(x0, y0, inner, P);
  context.fillRect(x0, y0, P, inner);
  // borde de sombra (abajo / derecha)
  context.fillStyle = 'rgba(0,0,0,0.35)';
  context.fillRect(x0, y0 + inner - P, inner, P);
  context.fillRect(x0 + inner - P, y0, P, inner);
  // píxel de brillo
  context.fillStyle = 'rgba(255,255,255,0.8)';
  context.fillRect(x0 + P, y0 + P, P, P);
}

const SKINS = {
  retro:  { label: 'Retro',      colors: COLORS,        colorsLight: COLORS_LIGHT,        drawBlock: drawBlockRetro },
  neon:   { label: 'Neon',       colors: NEON_COLORS,   colorsLight: NEON_COLORS,         drawBlock: drawBlockNeon,
            background: '#000000', grid: '#101018' },
  pastel: { label: 'Pastel',     colors: PASTEL_COLORS, colorsLight: PASTEL_COLORS_LIGHT, drawBlock: drawBlockPastel },
  pixel:  { label: 'Pixel art',  colors: COLORS,        colorsLight: COLORS_LIGHT,        drawBlock: drawBlockPixel },
};

const SKIN_STORAGE_KEY = 'tetris.skin';
const DEFAULT_SKIN = 'retro';

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  // Piezas especiales (no estándar)
  [[0,8,0],[8,8,8],[0,8,0]],                  // + (pentominó)
  [[9,0,9],[9,9,9],[0,0,0]],                  // U (pentominó)
  [[0,0,0,0],[10,10,10,10],[0,10,0,0],[0,0,0,0]], // Y (pentominó)
  [[11]],                                      // 1×1 (recompensa tras Tetris)
  [[12,12,12],[12,0,12],[12,12,12]],          // 3×3 hueca (reto)
];

const STANDARD_TYPES = [1, 2, 3, 4, 5, 6, 7];
const PENTOMINO_TYPES = [8, 9, 10];
const SINGLE_TYPE = 11;
const HOLLOW_TYPE = 12;

// Probabilidades de aparición de las piezas especiales
const CHALLENGE_CHANCE = 0.06; // 3×3 hueca
const SPECIAL_CHANCE = 0.12;   // pentominó (+, U, Y)

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');

const themeToggle = document.getElementById('theme-toggle');
const skinSelect = document.getElementById('skin-select');

const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const pauseControls = document.getElementById('pause-controls');
const startLevelSelect = document.getElementById('start-level');

const MAX_START_LEVEL = 10;
// Tras reanudar, se ignoran las teclas durante este tiempo (ms) para evitar movimientos accidentales
const RESUME_GRACE = 150;

let theme = 'dark';
let gridColor = '#22222e';
let skinName = DEFAULT_SKIN;
let skin = SKINS[DEFAULT_SKIN];

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, rewardPending;

// Nivel con el que arranca la próxima partida (se elige desde el menú de pausa)
let startLevel = 1;
// Nivel inicial de la partida en curso (fijado en init para que cambiar el selector no la afecte)
let gameStartLevel = 1;
// Tras reanudar: ignorar autorepetición de teclas mantenidas y el período de gracia
let resumeGuard = false;
let resumedAt = 0;

function speedForLevel(lvl) {
  return Math.max(100, 1000 - (lvl - 1) * 90);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function makePiece(type) {
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomPiece() {
  const roll = Math.random();
  let type;
  if (roll < CHALLENGE_CHANCE) type = HOLLOW_TYPE;
  else if (roll < CHALLENGE_CHANCE + SPECIAL_CHANCE) type = pick(PENTOMINO_TYPES);
  else type = pick(STANDARD_TYPES);
  return makePiece(type);
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared === 4) rewardPending = true;
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = gameStartLevel + Math.floor(lines / 10);
    dropInterval = speedForLevel(level);
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  // Tras un Tetris, la siguiente pieza es una 1×1 de recompensa
  next = rewardPending ? makePiece(SINGLE_TYPE) : randomPiece();
  rewardPending = false;
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = (theme === 'light' ? skin.colorsLight : skin.colors)[colorIndex];
  context.globalAlpha = alpha ?? 1;
  skin.drawBlock(context, x * size, y * size, size, color);
  context.globalAlpha = 1;
}

// Limpia un canvas y, si la skin lo define, pinta su fondo propio
function clearCanvas(context, c) {
  context.clearRect(0, 0, c.width, c.height);
  if (skin.background) {
    context.fillStyle = skin.background;
    context.fillRect(0, 0, c.width, c.height);
  }
}

function drawGrid() {
  ctx.strokeStyle = skin.grid || gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  clearCanvas(ctx, canvas);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  clearCanvas(nextCtx, nextCanvas);
  const shape = next.shape;
  // Bounding box de las celdas ocupadas, para centrar la pieza visualmente
  let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
  const gridW = nextCanvas.width / NB, gridH = nextCanvas.height / NB;
  const offX = (gridW - (maxC - minC + 1)) / 2 - minC;
  const offY = (gridH - (maxR - minR + 1)) / 2 - minR;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function applyTheme(newTheme) {
  theme = newTheme;
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-checked', String(theme === 'light'));
  gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
  // Redibujar de inmediato (el loop no corre en pausa / game over)
  if (current && next) {
    draw();
    drawNext();
  }
}

function loadSkin() {
  try {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    if (saved && Object.hasOwn(SKINS, saved)) return saved;
  } catch (e) { /* localStorage no disponible */ }
  return DEFAULT_SKIN;
}

function applySkin(name) {
  if (!Object.hasOwn(SKINS, name)) name = DEFAULT_SKIN;
  skinName = name;
  skin = SKINS[name];
  document.documentElement.dataset.skin = name;
  skinSelect.value = name;
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, name);
  } catch (e) { /* localStorage no disponible */ }
  // Redibujar de inmediato (el loop no corre en pausa / game over)
  if (current && next) {
    draw();
    drawNext();
  }
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function openPauseMenu() {
  paused = true;
  cancelAnimationFrame(animId);
  startLevelSelect.value = String(startLevel);
  pauseMenu.classList.remove('hidden');
  resumeBtn.focus();
}

function closePauseMenu() {
  pauseMenu.classList.add('hidden');
  setControlsVisible(false);
  // Quitar el foco de cualquier control del menú para que las teclas no lo sigan activando
  if (pauseMenu.contains(document.activeElement)) document.activeElement.blur();
}

function resume() {
  if (!paused || gameOver) return;
  closePauseMenu();
  paused = false;
  resumeGuard = true;
  resumedAt = performance.now();
  dropAccum = 0;
  lastTime = performance.now();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function togglePause() {
  if (gameOver) return;
  if (paused) resume();
  else openPauseMenu();
}

function setControlsVisible(visible) {
  pauseControls.classList.toggle('hidden', !visible);
  controlsBtn.setAttribute('aria-expanded', String(visible));
  controlsBtn.textContent = visible ? 'Ocultar controles' : 'Ver controles';
}

// Navegación con ↑/↓ entre los controles del menú de pausa
function moveMenuFocus(dir) {
  const items = [...pauseMenu.querySelectorAll('button, select')].filter(el => el.offsetParent !== null);
  if (!items.length) return;
  const idx = items.indexOf(document.activeElement);
  const nextIdx = idx === -1 ? 0 : (idx + dir + items.length) % items.length;
  items[nextIdx].focus();
}

function loop(ts) {
  if (gameOver || paused) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  // endGame() puede dispararse dentro de este frame (lockPiece → spawn);
  // cancelAnimationFrame ahí no sirve porque el frame actual ya se consumió.
  if (gameOver) return;
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  gameStartLevel = startLevel;
  level = gameStartLevel;
  paused = false;
  gameOver = false;
  rewardPending = false;
  resumeGuard = false;
  dropInterval = speedForLevel(level);
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  closePauseMenu();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

// Controles de formulario (p. ej. el selector de skin) que deben recibir el teclado
function isFormControl(el) {
  return el instanceof HTMLSelectElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

document.addEventListener('keydown', e => {
  // Controles de formulario (p. ej. el selector de skin) reciben el teclado,
  // salvo el selector de nivel del menú de pausa, que gestiona el propio menú
  if (isFormControl(e.target) && e.target !== startLevelSelect) return;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    // Ignorar la autorepetición para no abrir/cerrar el menú en bucle
    if (!e.repeat) togglePause();
    e.preventDefault();
    return;
  }
  if (gameOver) return;
  if (paused) {
    // Menú abierto: solo navegación del menú, ningún input llega al juego
    const onSelect = e.target === startLevelSelect;
    if (!onSelect && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
      e.preventDefault();
      moveMenuFocus(e.code === 'ArrowUp' ? -1 : 1);
    } else if (!onSelect && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
      e.preventDefault();
    }
    return;
  }
  if (resumeGuard) {
    // Recién reanudado: descartar teclas mantenidas desde el menú y el período de gracia
    if (e.repeat || performance.now() - resumedAt < RESUME_GRACE) {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      return;
    }
    resumeGuard = false;
  }
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', () => {
  restartBtn.blur();
  init();
});

resumeBtn.addEventListener('click', resume);

pauseRestartBtn.addEventListener('click', () => {
  pauseRestartBtn.blur();
  init();
});

controlsBtn.addEventListener('click', () => {
  setControlsVisible(pauseControls.classList.contains('hidden'));
});

startLevelSelect.addEventListener('change', () => {
  const val = parseInt(startLevelSelect.value, 10);
  startLevel = Math.min(MAX_START_LEVEL, Math.max(1, val || 1));
});

themeToggle.addEventListener('click', () => {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
  themeToggle.blur(); // evitar que Space vuelva a activar el botón
});

skinSelect.addEventListener('change', () => {
  applySkin(skinSelect.value);
  skinSelect.blur(); // devolver el teclado al juego
});

// Evita que Space active el botón con foco (el click se dispara en keyup)
// (en el menú de pausa sí se permite, para poder activar sus botones con Space)
document.addEventListener('keyup', e => {
  if (e.code === 'Space' && !paused && !isFormControl(e.target)) e.preventDefault();
});

// Opciones del selector de nivel inicial
for (let i = 1; i <= MAX_START_LEVEL; i++) {
  const opt = document.createElement('option');
  opt.value = String(i);
  opt.textContent = String(i);
  startLevelSelect.appendChild(opt);
}

applyTheme('dark');
applySkin(loadSkin());

init();
