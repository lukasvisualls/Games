let CELL = 30;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next-piece");
const nextCtx = nextCanvas.getContext("2d");
const nextBox = document.getElementById("next-box");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const bestScoreEl = document.getElementById("best-score");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");

const LINE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 };
const LINES_PER_LEVEL = 10;

const DIFFICULTIES = {
  facil: { baseDrop: 1000, step: 50, min: 300, hideNext: false },
  medio: { baseDrop: 800, step: 70, min: 100, hideNext: false },
  dificil: { baseDrop: 600, step: 90, min: 80, hideNext: false },
  impossivel: { baseDrop: 350, step: 110, min: 50, hideNext: true },
};
const DIFFICULTY_ORDER = ["facil", "medio", "dificil", "impossivel"];

const STATE = { MENU: "menu", PLAYING: "playing", GAME_OVER: "gameover" };

const STORAGE_KEYS = {
  records: "tetris_bestScores",
  music: "tetris_musicEnabled",
  sfx: "tetris_sfxEnabled",
  volume: "tetris_volume",
};

let grid = createGrid();
let current = null;
let next = null;
let score = 0;
let level = 1;
let lines = 0;
let bestScores = { facil: 0, medio: 0, dificil: 0, impossivel: 0 };
let state = STATE.MENU;
let selectedDifficulty = "medio";
let difficultyConfig = DIFFICULTIES[selectedDifficulty];
let musicEnabledState = true;
let sfxEnabledState = true;

let dropInterval = difficultyConfig.baseDrop;
let dropCounter = 0;
let lastTime = 0;

function resizeCanvases() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  if (isMobile) {
    const wrapper = canvas.parentElement;
    const maxW = wrapper.clientWidth;
    const maxH = wrapper.clientHeight;
    let width = maxW;
    let height = width * (ROWS / COLS);
    if (height > maxH) {
      height = maxH;
      width = height * (COLS / ROWS);
    }
    width = Math.max(60, Math.floor(width));
    height = Math.max(120, Math.floor(height));

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width;
    canvas.height = height;
    CELL = width / COLS;

    const nextSize = Math.round(Math.min(140, Math.max(90, width * 0.35)));
    nextCanvas.style.width = `${nextSize}px`;
    nextCanvas.style.height = `${nextSize}px`;
    nextCanvas.width = nextSize;
    nextCanvas.height = nextSize;
  } else {
    canvas.style.width = "";
    canvas.style.height = "";
    nextCanvas.style.width = "";
    nextCanvas.style.height = "";

    const availableHeight = Math.min(window.innerHeight * 0.92, 1100);
    const newCell = Math.max(20, Math.floor(availableHeight / ROWS));
    canvas.width = newCell * COLS;
    canvas.height = newCell * ROWS;
    CELL = newCell;

    const nextSize = Math.max(120, newCell * 4);
    nextCanvas.width = nextSize;
    nextCanvas.height = nextSize;
  }

  drawGridBackground();
  if (state === STATE.PLAYING) drawBoard();
  if (next) drawNextPiece();
}

function spawnPiece() {
  current = next || randomPiece();
  next = randomPiece();
  current.col = Math.floor((COLS - current.matrix.length) / 2);
  current.row = 0;

  if (hasCollision(grid, current)) {
    endGame();
  }
  if (difficultyConfig.hideNext) {
    nextBox.classList.add("hidden");
  } else {
    nextBox.classList.remove("hidden");
    drawNextPiece();
  }
}

function resetGame() {
  grid = createGrid();
  score = 0;
  level = 1;
  lines = 0;
  difficultyConfig = DIFFICULTIES[selectedDifficulty];
  dropInterval = difficultyConfig.baseDrop;
  dropCounter = 0;
  updateHUD();
  next = randomPiece();
  spawnPiece();
}

function selectDifficulty(diff) {
  selectedDifficulty = diff;
  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.difficulty === diff);
  });
}

function updateRecordsDisplay() {
  DIFFICULTY_ORDER.forEach((diff) => {
    const el = document.querySelector(`.diff-record[data-difficulty="${diff}"]`);
    if (el) el.textContent = `Recorde: ${bestScores[diff]}`;
  });
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(bestScores));
}

function loadSettings() {
  try {
    const savedRecords = JSON.parse(localStorage.getItem(STORAGE_KEYS.records));
    if (savedRecords) bestScores = { ...bestScores, ...savedRecords };
  } catch (e) {
    // ignore malformed data
  }

  const savedMusic = localStorage.getItem(STORAGE_KEYS.music);
  const savedSfx = localStorage.getItem(STORAGE_KEYS.sfx);
  const savedVolume = localStorage.getItem(STORAGE_KEYS.volume);

  musicEnabledState = savedMusic === null ? true : savedMusic === "true";
  sfxEnabledState = savedSfx === null ? true : savedSfx === "true";
  const volume = savedVolume === null ? 0.7 : parseFloat(savedVolume);

  AudioEngine.setMusicEnabled(musicEnabledState);
  AudioEngine.setSfxEnabled(sfxEnabledState);
  AudioEngine.setVolume(volume);

  return volume;
}

function startGame() {
  document.activeElement?.blur();
  window.focus();
  resetGame();
  state = STATE.PLAYING;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  if (musicEnabledState) AudioEngine.startMusic();
}

function goToMenu() {
  state = STATE.MENU;
  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

function endGame() {
  state = STATE.GAME_OVER;
  bestScores[selectedDifficulty] = Math.max(bestScores[selectedDifficulty], score);
  updateRecordsDisplay();
  saveRecords();
  finalScoreEl.textContent = score;
  bestScoreEl.textContent = bestScores[selectedDifficulty];
  gameOverScreen.classList.remove("hidden");
  AudioEngine.stopMusic();
  AudioEngine.playGameOver();
}

function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

function computeScoreGain(clearedCount) {
  return LINE_SCORES[clearedCount] || 0;
}

function tryMove(offsetRow, offsetCol) {
  if (!hasCollision(grid, current, offsetRow, offsetCol)) {
    current.row += offsetRow;
    current.col += offsetCol;
    return true;
  }
  return false;
}

function tryRotate() {
  const rotated = rotateMatrix(current.matrix);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!hasCollision(grid, current, 0, kick, rotated)) {
      current.matrix = rotated;
      current.col += kick;
      AudioEngine.playRotate();
      return;
    }
  }
}

function lockPiece() {
  AudioEngine.playLock();
  mergePiece(grid, current);
  const cleared = clearLines(grid);
  if (cleared > 0) {
    score += computeScoreGain(cleared);
    lines += cleared;
    level = Math.floor(lines / LINES_PER_LEVEL) + 1;
    dropInterval = Math.max(
      difficultyConfig.min,
      difficultyConfig.baseDrop - (level - 1) * difficultyConfig.step
    );
    updateHUD();
    AudioEngine.playLineClear(cleared);
  }
  spawnPiece();
}

function softDrop() {
  if (!tryMove(1, 0)) {
    lockPiece();
  } else {
    score += 1;
    updateHUD();
  }
}

function hardDrop() {
  let dropped = 0;
  while (tryMove(1, 0)) dropped++;
  score += dropped * 2;
  AudioEngine.playHardDrop();
  lockPiece();
  updateHUD();
}

function drawCell(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x, y, size, size);
  context.strokeStyle = "rgba(255,255,255,0.25)";
  context.lineWidth = 1;
  context.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

  context.save();
  context.shadowColor = color;
  context.shadowBlur = 8;
  context.strokeStyle = color;
  context.strokeRect(x + 1, y + 1, size - 2, size - 2);
  context.restore();
}

function drawGridBackground() {
  ctx.fillStyle = "#0e1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, canvas.height);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(canvas.width, r * CELL);
    ctx.stroke();
  }
}

function getGhostRow() {
  let offset = 0;
  while (!hasCollision(grid, current, offset + 1, 0)) {
    offset++;
  }
  return current.row + offset;
}

function drawGhostCell(context, x, y, size, color) {
  context.save();
  context.globalAlpha = 0.2;
  context.fillStyle = color;
  context.fillRect(x, y, size, size);
  context.globalAlpha = 1;
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  context.setLineDash([4, 3]);
  context.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
  context.restore();
}

function drawBoard() {
  drawGridBackground();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const color = grid[r][c];
      if (color) {
        drawCell(ctx, c * CELL, r * CELL, CELL, color);
      }
    }
  }

  if (current) {
    const ghostRow = getGhostRow();
    if (ghostRow !== current.row) {
      current.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
          if (!value) return;
          const boardRow = ghostRow + r;
          const boardCol = current.col + c;
          if (boardRow >= 0) {
            drawGhostCell(ctx, boardCol * CELL, boardRow * CELL, CELL, current.color);
          }
        });
      });
    }

    current.matrix.forEach((row, r) => {
      row.forEach((value, c) => {
        if (!value) return;
        const boardRow = current.row + r;
        const boardCol = current.col + c;
        if (boardRow >= 0) {
          drawCell(ctx, boardCol * CELL, boardRow * CELL, CELL, current.color);
        }
      });
    });
  }
}

function drawNextPiece() {
  nextCtx.fillStyle = "#0e1020";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (!next) return;
  const size = nextCanvas.width / 5;
  const matrix = next.matrix;
  const offsetX = (nextCanvas.width - matrix.length * size) / 2;
  const offsetY = (nextCanvas.height - matrix.length * size) / 2;

  matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (!value) return;
      drawCell(nextCtx, offsetX + c * size, offsetY + r * size, size, next.color);
    });
  });
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (state === STATE.PLAYING) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      dropCounter = 0;
      if (!tryMove(1, 0)) {
        lockPiece();
      }
    }
    drawBoard();
  }

  requestAnimationFrame(update);
}

document.addEventListener("keydown", (e) => {
  if (state === STATE.MENU) {
    const idx = DIFFICULTY_ORDER.indexOf(selectedDifficulty);
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      selectDifficulty(DIFFICULTY_ORDER[(idx - 1 + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length]);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      selectDifficulty(DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length]);
    } else if (e.key === "Enter") {
      startGame();
    }
    return;
  }

  if (state === STATE.GAME_OVER && e.key === "Enter") {
    goToMenu();
    return;
  }

  if (state !== STATE.PLAYING) return;

  if (['KeyA','KeyD','KeyS','KeyE','Space','ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.code)) e.preventDefault();
  switch (e.code) {
    case "KeyA":
    case "ArrowLeft":
      if (tryMove(0, -1)) AudioEngine.playMove();
      break;
    case "ArrowRight":
    case "KeyD":
      if (tryMove(0, 1)) AudioEngine.playMove();
      break;
    case "ArrowDown":
    case "KeyS":
      softDrop();
      break;
    case "ArrowUp":
    case "KeyE":
      tryRotate();
      break;
    case "Space":
      e.preventDefault();
      hardDrop();
      break;
  }
  drawBoard();
});

document.querySelectorAll(".diff-btn").forEach((btn) => {
  btn.addEventListener("click", () => selectDifficulty(btn.dataset.difficulty));
});

document.getElementById("play-btn").addEventListener("click", startGame);
document.getElementById("menu-btn").addEventListener("click", goToMenu);

const musicToggleBtn = document.getElementById("toggle-music");
const sfxToggleBtn = document.getElementById("toggle-sfx");
const musicCheckbox = document.getElementById("setting-music");
const sfxCheckbox = document.getElementById("setting-sfx");
const volumeSlider = document.getElementById("setting-volume");

function applyMusicEnabled(enabled) {
  musicEnabledState = enabled;
  AudioEngine.setMusicEnabled(enabled);
  if (enabled && state === STATE.PLAYING) AudioEngine.startMusic();
  musicToggleBtn.textContent = enabled ? "🎵" : "🔇";
  musicToggleBtn.classList.toggle("muted", !enabled);
  musicCheckbox.checked = enabled;
  localStorage.setItem(STORAGE_KEYS.music, enabled);
}

function applySfxEnabled(enabled) {
  sfxEnabledState = enabled;
  AudioEngine.setSfxEnabled(enabled);
  sfxToggleBtn.textContent = enabled ? "🔊" : "🔈";
  sfxToggleBtn.classList.toggle("muted", !enabled);
  sfxCheckbox.checked = enabled;
  localStorage.setItem(STORAGE_KEYS.sfx, enabled);
}

function applyVolume(volume) {
  AudioEngine.setVolume(volume);
  volumeSlider.value = Math.round(volume * 100);
  localStorage.setItem(STORAGE_KEYS.volume, volume);
}

musicToggleBtn.addEventListener("click", () => applyMusicEnabled(!musicEnabledState));
sfxToggleBtn.addEventListener("click", () => applySfxEnabled(!sfxEnabledState));
musicCheckbox.addEventListener("change", () => applyMusicEnabled(musicCheckbox.checked));
sfxCheckbox.addEventListener("change", () => applySfxEnabled(sfxCheckbox.checked));
volumeSlider.addEventListener("input", () => applyVolume(volumeSlider.value / 100));

const savedVolume = loadSettings();
applyMusicEnabled(musicEnabledState);
applySfxEnabled(sfxEnabledState);
applyVolume(savedVolume);
updateRecordsDisplay();

function bindHoldButton(el, action) {
  const REPEAT_MS = 130;
  let intervalId = null;

  const trigger = () => {
    if (state !== STATE.PLAYING) return;
    action();
    drawBoard();
  };

  const start = (e) => {
    e.preventDefault();
    if (intervalId) return;
    trigger();
    intervalId = setInterval(trigger, REPEAT_MS);
  };

  const stop = (e) => {
    e.preventDefault();
    clearInterval(intervalId);
    intervalId = null;
  };

  el.addEventListener("touchstart", start, { passive: false });
  el.addEventListener("touchend", stop);
  el.addEventListener("touchcancel", stop);
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", stop);
  el.addEventListener("mouseleave", stop);
}

bindHoldButton(document.getElementById("btn-left"), () => {
  if (tryMove(0, -1)) AudioEngine.playMove();
});
bindHoldButton(document.getElementById("btn-right"), () => {
  if (tryMove(0, 1)) AudioEngine.playMove();
});
bindHoldButton(document.getElementById("btn-down"), () => softDrop());

document.getElementById("btn-rotate").addEventListener("click", () => {
  if (state !== STATE.PLAYING) return;
  tryRotate();
  drawBoard();
});

document.getElementById("btn-drop").addEventListener("click", () => {
  if (state !== STATE.PLAYING) return;
  hardDrop();
});

let touchStartX = null;
let touchStartY = null;
let touchStartTime = 0;

canvas.addEventListener(
  "touchstart",
  (e) => {
    if (state !== STATE.PLAYING) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
  },
  { passive: true }
);

canvas.addEventListener("touchend", (e) => {
  if (state !== STATE.PLAYING || touchStartX === null) return;

  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const elapsed = Date.now() - touchStartTime;
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const swipeThreshold = 24;

  if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
    const steps = Math.round((dx * scale) / CELL);
    const dir = steps > 0 ? 1 : -1;
    let moved = false;
    for (let i = 0; i < Math.abs(steps); i++) {
      if (tryMove(0, dir)) moved = true;
    }
    if (moved) AudioEngine.playMove();
  } else if (dy > swipeThreshold) {
    if (dy * scale > CELL * 3 || elapsed < 150) {
      hardDrop();
    } else {
      softDrop();
    }
  } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
    tryRotate();
  }

  drawBoard();
  touchStartX = null;
});

window.addEventListener("resize", resizeCanvases);

resizeCanvases();
requestAnimationFrame(update);
