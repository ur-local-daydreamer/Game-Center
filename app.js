const tabs = document.querySelectorAll(".game-tab");
const stages = document.querySelectorAll(".game-stage");
const activeTitle = document.querySelector("#active-title");
const scoreReadout = document.querySelector("#score-readout");
let currentGame = "snake";

const gameNames = {
  snake: "Snake",
  twenty48: "2048",
  slice: "Slice Master",
  cookie: "Cookie Clicker",
  tetris: "Tetris"
};

const scores = {
  snake: 0,
  twenty48: 0,
  slice: 0,
  cookie: 0,
  tetris: 0
};

const highScores = Object.fromEntries(
  Object.keys(scores).map((game) => [game, Number(localStorage.getItem(`highScore-${game}`)) || 0])
);

function setScore(game, value) {
  scores[game] = value;
  if (value > highScores[game]) {
    highScores[game] = Math.floor(value);
    localStorage.setItem(`highScore-${game}`, highScores[game]);
    updateHighScores();
  }
  if (currentGame === game) scoreReadout.textContent = Math.floor(value);
}

function updateHighScores() {
  Object.entries(highScores).forEach(([game, score]) => {
    document.querySelector(`[data-high-score="${game}"]`).textContent = Math.floor(score);
  });
}

function showGameOver(game) {
  document.querySelector(`[data-game-over="${game}"]`).classList.add("show");
}

function hideGameOver(game) {
  document.querySelector(`[data-game-over="${game}"]`).classList.remove("show");
}

document.querySelectorAll(".fullscreen-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const stage = document.querySelector(`#${button.dataset.fullscreen}`);
    if (document.fullscreenElement === stage) {
      await document.exitFullscreen();
    } else {
      await stage.requestFullscreen();
    }
  });
});

document.addEventListener("fullscreenchange", () => {
  document.querySelectorAll(".fullscreen-button").forEach((button) => {
    const stage = document.querySelector(`#${button.dataset.fullscreen}`);
    button.textContent = document.fullscreenElement === stage ? "Exit Fullscreen" : "Fullscreen";
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentGame = tab.dataset.game;
    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    stages.forEach((stage) => stage.classList.toggle("active", stage.id === currentGame));
    activeTitle.textContent = gameNames[currentGame];
    scoreReadout.textContent = Math.floor(scores[currentGame]);
  });
});

function gridCanvas(canvas, color = "rgba(59, 231, 255, 0.12)") {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070b22";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Snake
const snakeCanvas = document.querySelector("#snake-canvas");
const snakeCtx = snakeCanvas.getContext("2d");
const snakeSize = 21;
const snakeCell = snakeCanvas.width / snakeSize;
let snake = [];
let food = {};
let snakeDir = { x: 1, y: 0 };
let nextSnakeDir = { x: 1, y: 0 };
let snakeTimer = null;
let snakeRunning = false;

function resetSnake() {
  hideGameOver("snake");
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  snakeDir = { x: 1, y: 0 };
  nextSnakeDir = { x: 1, y: 0 };
  placeSnakeFood();
  setScore("snake", 0);
  snakeRunning = false;
  clearInterval(snakeTimer);
  drawSnake();
}

function placeSnakeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * snakeSize),
      y: Math.floor(Math.random() * snakeSize)
    };
  } while (snake.some((part) => part.x === food.x && part.y === food.y));
}

function drawSnake() {
  gridCanvas(snakeCanvas);
  snakeCtx.fillStyle = "#ff3df2";
  snakeCtx.shadowColor = "#ff3df2";
  snakeCtx.shadowBlur = 18;
  snakeCtx.fillRect(food.x * snakeCell + 4, food.y * snakeCell + 4, snakeCell - 8, snakeCell - 8);
  snakeCtx.shadowColor = "#3be7ff";
  snake.forEach((part, index) => {
    snakeCtx.fillStyle = index === 0 ? "#b7ff3c" : "#3be7ff";
    snakeCtx.fillRect(part.x * snakeCell + 2, part.y * snakeCell + 2, snakeCell - 4, snakeCell - 4);
  });
  snakeCtx.shadowBlur = 0;
}

function stepSnake() {
  snakeDir = nextSnakeDir;
  const head = {
    x: snake[0].x + snakeDir.x,
    y: snake[0].y + snakeDir.y
  };
  const hitWall = head.x < 0 || head.y < 0 || head.x >= snakeSize || head.y >= snakeSize;
  const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) {
    snakeRunning = false;
    clearInterval(snakeTimer);
    drawSnake();
    showGameOver("snake");
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    setScore("snake", scores.snake + 10);
    placeSnakeFood();
  } else {
    snake.pop();
  }
  drawSnake();
}

document.querySelector("#snake-start").addEventListener("click", () => {
  if (snakeRunning) return;
  snakeRunning = true;
  snakeTimer = setInterval(stepSnake, 120);
});
document.querySelector("#snake-reset").addEventListener("click", resetSnake);

// 2048
const board2048 = document.querySelector("#board-2048");
let grid2048 = [];

function reset2048() {
  hideGameOver("twenty48");
  grid2048 = Array.from({ length: 4 }, () => Array(4).fill(0));
  setScore("twenty48", 0);
  add2048Tile();
  add2048Tile();
  draw2048();
}

function add2048Tile() {
  const empty = [];
  grid2048.forEach((row, y) => row.forEach((value, x) => {
    if (!value) empty.push({ x, y });
  }));
  if (!empty.length) return;
  const spot = empty[Math.floor(Math.random() * empty.length)];
  grid2048[spot.y][spot.x] = Math.random() > 0.85 ? 4 : 2;
}

function draw2048() {
  board2048.innerHTML = "";
  grid2048.flat().forEach((value) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    if (value) tile.dataset.value = value;
    tile.textContent = value || "";
    board2048.appendChild(tile);
  });
}

function compress2048(row) {
  const values = row.filter(Boolean);
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] === values[i + 1]) {
      values[i] *= 2;
      setScore("twenty48", scores.twenty48 + values[i]);
      values.splice(i + 1, 1);
    }
  }
  while (values.length < 4) values.push(0);
  return values;
}

function move2048(dir) {
  const before = JSON.stringify(grid2048);
  if (dir === "left") {
    grid2048 = grid2048.map(compress2048);
  }
  if (dir === "right") {
    grid2048 = grid2048.map((row) => compress2048(row.reverse()).reverse());
  }
  if (dir === "up" || dir === "down") {
    for (let x = 0; x < 4; x++) {
      const column = grid2048.map((row) => row[x]);
      const merged = dir === "up" ? compress2048(column) : compress2048(column.reverse()).reverse();
      for (let y = 0; y < 4; y++) grid2048[y][x] = merged[y];
    }
  }
  if (before !== JSON.stringify(grid2048)) add2048Tile();
  draw2048();
  if (!has2048Moves()) showGameOver("twenty48");
}

function has2048Moves() {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (!grid2048[y][x]) return true;
      if (x < 3 && grid2048[y][x] === grid2048[y][x + 1]) return true;
      if (y < 3 && grid2048[y][x] === grid2048[y + 1][x]) return true;
    }
  }
  return false;
}

document.querySelector("#new-2048").addEventListener("click", reset2048);

// Slice Master
const sliceCanvas = document.querySelector("#slice-canvas");
const sliceCtx = sliceCanvas.getContext("2d");
let sliceTargets = [];
let sliceTimer = null;
let sliceRunning = false;
let sliceTicks = 0;
let sliceMisses = 0;
let isSlicing = false;
let sliceTrail = [];

function resetSlice() {
  hideGameOver("slice");
  clearInterval(sliceTimer);
  sliceTargets = [];
  sliceRunning = false;
  sliceTicks = 0;
  sliceMisses = 0;
  sliceTrail = [];
  setScore("slice", 0);
  drawSlice();
}

function spawnSliceTarget() {
  const bomb = Math.random() < 0.22;
  sliceTargets.push({
    x: 40 + Math.random() * (sliceCanvas.width - 80),
    y: sliceCanvas.height + 30,
    r: bomb ? 18 : 24,
    vy: 2.4 + Math.random() * 1.8,
    drift: -1 + Math.random() * 2,
    bomb
  });
}

function drawSlice() {
  gridCanvas(sliceCanvas, "rgba(255, 61, 242, 0.11)");
  sliceCtx.fillStyle = "#9aa9d4";
  sliceCtx.font = "700 16px monospace";
  sliceCtx.textAlign = "left";
  sliceCtx.textBaseline = "top";
  sliceCtx.fillText(`Misses ${sliceMisses}/3`, 16, 14);
  sliceTargets.forEach((target) => {
    sliceCtx.beginPath();
    sliceCtx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
    sliceCtx.fillStyle = target.bomb ? "#ff4d6d" : "#b7ff3c";
    sliceCtx.shadowColor = target.bomb ? "#ff4d6d" : "#b7ff3c";
    sliceCtx.shadowBlur = 20;
    sliceCtx.fill();
    sliceCtx.shadowBlur = 0;
    sliceCtx.fillStyle = "#071022";
    sliceCtx.font = "700 16px monospace";
    sliceCtx.textAlign = "center";
    sliceCtx.textBaseline = "middle";
    sliceCtx.fillText(target.bomb ? "!" : "/", target.x, target.y);
  });
  if (sliceTrail.length > 1) {
    sliceCtx.beginPath();
    sliceCtx.moveTo(sliceTrail[0].x, sliceTrail[0].y);
    sliceTrail.slice(1).forEach((point) => sliceCtx.lineTo(point.x, point.y));
    sliceCtx.strokeStyle = "#3be7ff";
    sliceCtx.lineWidth = 5;
    sliceCtx.shadowColor = "#3be7ff";
    sliceCtx.shadowBlur = 18;
    sliceCtx.stroke();
    sliceCtx.shadowBlur = 0;
  }
}

function stepSlice() {
  sliceTicks++;
  if (sliceTicks % 18 === 0) spawnSliceTarget();
  sliceTargets.forEach((target) => {
    target.y -= target.vy;
    target.x += target.drift;
  });
  const keptTargets = [];
  sliceTargets.forEach((target) => {
    if (target.y + target.r > -5) {
      keptTargets.push(target);
    } else if (!target.bomb) {
      sliceMisses++;
    }
  });
  sliceTargets = keptTargets;
  if (sliceMisses >= 3) {
    clearInterval(sliceTimer);
    sliceRunning = false;
    showGameOver("slice");
  }
  drawSlice();
}

function startSlice() {
  if (sliceRunning) return;
  hideGameOver("slice");
  sliceRunning = true;
  sliceTimer = setInterval(stepSlice, 33);
}

function getSlicePoint(event) {
  const rect = sliceCanvas.getBoundingClientRect();
  const scaleX = sliceCanvas.width / rect.width;
  const scaleY = sliceCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function sliceAtPoint(point) {
  const index = sliceTargets.findIndex((target) => Math.hypot(target.x - point.x, target.y - point.y) <= target.r + 8);
  if (index < 0) return;
  const [target] = sliceTargets.splice(index, 1);
  setScore("slice", Math.max(0, scores.slice + (target.bomb ? -25 : 15)));
  drawSlice();
}

function sliceAlongLine(from, to) {
  const distance = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
  const steps = Math.ceil(distance / 10);
  for (let i = 0; i <= steps; i++) {
    const point = {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps
    };
    sliceAtPoint(point);
  }
}

sliceCanvas.addEventListener("pointerdown", (event) => {
  isSlicing = true;
  sliceCanvas.setPointerCapture(event.pointerId);
  const point = getSlicePoint(event);
  sliceTrail = [point];
  sliceAtPoint(point);
});

sliceCanvas.addEventListener("pointermove", (event) => {
  if (!isSlicing) return;
  const point = getSlicePoint(event);
  const previous = sliceTrail[sliceTrail.length - 1] || point;
  sliceTrail.push(point);
  sliceTrail = sliceTrail.slice(-12);
  sliceAlongLine(previous, point);
  drawSlice();
});

sliceCanvas.addEventListener("pointerup", () => {
  isSlicing = false;
  setTimeout(() => {
    sliceTrail = [];
    drawSlice();
  }, 90);
});

sliceCanvas.addEventListener("pointerleave", () => {
  isSlicing = false;
});

sliceCanvas.addEventListener("pointercancel", () => {
  isSlicing = false;
});

document.querySelector("#slice-start").addEventListener("click", startSlice);
document.querySelector("#slice-reset").addEventListener("click", resetSlice);

// Cookie Clicker
let cookies = 0;
let perClick = 1;
let perSecond = 0;
const cookieUpgrades = {
  cursor: { cost: 25, owned: 0, gain: 1, mode: "click" },
  spatula: { cost: 90, owned: 0, gain: 5, mode: "click" },
  autoClicker: { cost: 40, owned: 0, gain: 2, mode: "second" },
  baker: { cost: 80, owned: 0, gain: 4, mode: "second" },
  bakerCrew: { cost: 260, owned: 0, gain: 18, mode: "second" },
  oven: { cost: 180, owned: 0, gain: 10, mode: "second" },
  strongOven: { cost: 550, owned: 0, gain: 45, mode: "second" },
  factory: { cost: 1600, owned: 0, gain: 140, mode: "second" }
};
const cookieCount = document.querySelector("#cookie-count");

function updateCookieUi() {
  cookieCount.textContent = Math.floor(cookies);
  document.querySelector("#click-power").textContent = perClick;
  document.querySelector("#auto-power").textContent = perSecond;
  Object.entries(cookieUpgrades).forEach(([key, upgrade]) => {
    document.querySelector(`[data-cost="${key}"]`).textContent = upgrade.cost;
    document.querySelector(`[data-owned="${key}"]`).textContent = upgrade.owned;
  });
  setScore("cookie", cookies);
}

function buyUpgrade(upgradeKey) {
  const upgrade = cookieUpgrades[upgradeKey];
  if (!upgrade || cookies < upgrade.cost) return;
  cookies -= upgrade.cost;
  upgrade.owned++;
  if (upgrade.mode === "click") perClick += upgrade.gain;
  if (upgrade.mode === "second") perSecond += upgrade.gain;
  upgrade.cost = Math.ceil(upgrade.cost * 1.62);
  updateCookieUi();
}

document.querySelector("#cookie-button").addEventListener("click", () => {
  cookies += perClick;
  updateCookieUi();
});
document.querySelectorAll(".upgrade-button").forEach((button) => {
  button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
});
document.querySelector("#cookie-reset").addEventListener("click", () => {
  hideGameOver("cookie");
  cookies = 0;
  perClick = 1;
  perSecond = 0;
  Object.assign(cookieUpgrades.cursor, { cost: 25, owned: 0 });
  Object.assign(cookieUpgrades.spatula, { cost: 90, owned: 0 });
  Object.assign(cookieUpgrades.autoClicker, { cost: 40, owned: 0 });
  Object.assign(cookieUpgrades.baker, { cost: 80, owned: 0 });
  Object.assign(cookieUpgrades.bakerCrew, { cost: 260, owned: 0 });
  Object.assign(cookieUpgrades.oven, { cost: 180, owned: 0 });
  Object.assign(cookieUpgrades.strongOven, { cost: 550, owned: 0 });
  Object.assign(cookieUpgrades.factory, { cost: 1600, owned: 0 });
  updateCookieUi();
});
setInterval(() => {
  if (perSecond > 0) {
    cookies += perSecond;
    updateCookieUi();
  }
}, 1000);

// Tetris
const tetrisCanvas = document.querySelector("#tetris-canvas");
const tetrisCtx = tetrisCanvas.getContext("2d");
const tCols = 10;
const tRows = 20;
const tCell = 30;
const pieces = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
];
const pieceColors = ["#3be7ff", "#ffd166", "#ff3df2", "#8c5cff", "#b7ff3c", "#ff4d6d", "#69f0ae"];
let tBoard = [];
let tPiece = null;
let tTimer = null;
let tRunning = false;

function resetTetris() {
  hideGameOver("tetris");
  tBoard = Array.from({ length: tRows }, () => Array(tCols).fill(0));
  setScore("tetris", 0);
  tPiece = randomPiece();
  tRunning = false;
  clearInterval(tTimer);
  drawTetris();
}

function randomPiece() {
  const id = Math.floor(Math.random() * pieces.length);
  return { shape: pieces[id].map((row) => [...row]), x: 3, y: 0, color: pieceColors[id] };
}

function rotate(shape) {
  return shape[0].map((_, x) => shape.map((row) => row[x]).reverse());
}

function collide(piece, board = tBoard) {
  return piece.shape.some((row, y) => row.some((value, x) => {
    if (!value) return false;
    const nx = piece.x + x;
    const ny = piece.y + y;
    return nx < 0 || nx >= tCols || ny >= tRows || (ny >= 0 && board[ny][nx]);
  }));
}

function mergePiece() {
  tPiece.shape.forEach((row, y) => row.forEach((value, x) => {
    if (value && tPiece.y + y >= 0) tBoard[tPiece.y + y][tPiece.x + x] = tPiece.color;
  }));
}

function clearLines() {
  let lines = 0;
  tBoard = tBoard.filter((row) => {
    if (row.every(Boolean)) {
      lines++;
      return false;
    }
    return true;
  });
  while (tBoard.length < tRows) tBoard.unshift(Array(tCols).fill(0));
  if (lines) setScore("tetris", scores.tetris + [0, 100, 300, 500, 800][lines]);
}

function stepTetris() {
  tPiece.y++;
  if (collide(tPiece)) {
    tPiece.y--;
    mergePiece();
    clearLines();
    tPiece = randomPiece();
    if (collide(tPiece)) {
      clearInterval(tTimer);
      tRunning = false;
      showGameOver("tetris");
    }
  }
  drawTetris();
}

function drawTetris() {
  gridCanvas(tetrisCanvas);
  const drawCell = (x, y, color) => {
    tetrisCtx.fillStyle = color;
    tetrisCtx.shadowColor = color;
    tetrisCtx.shadowBlur = 14;
    tetrisCtx.fillRect(x * tCell + 2, y * tCell + 2, tCell - 4, tCell - 4);
    tetrisCtx.shadowBlur = 0;
  };
  tBoard.forEach((row, y) => row.forEach((color, x) => {
    if (color) drawCell(x, y, color);
  }));
  if (!tPiece) return;
  tPiece.shape.forEach((row, y) => row.forEach((value, x) => {
    if (value) drawCell(tPiece.x + x, tPiece.y + y, tPiece.color);
  }));
}

function startTetris() {
  if (tRunning) return;
  hideGameOver("tetris");
  tRunning = true;
  tTimer = setInterval(stepTetris, 520);
}

document.querySelector("#tetris-start").addEventListener("click", startTetris);
document.querySelector("#tetris-reset").addEventListener("click", resetTetris);

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const keys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "];
  if (!keys.includes(key)) return;
  event.preventDefault();

  if (currentGame === "snake") {
    const dirs = {
      arrowup: { x: 0, y: -1 },
      w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      d: { x: 1, y: 0 }
    };
    const dir = dirs[key];
    if (dir && dir.x !== -snakeDir.x && dir.y !== -snakeDir.y) nextSnakeDir = dir;
  }

  if (currentGame === "twenty48") {
    if (key === "arrowleft" || key === "a") move2048("left");
    if (key === "arrowright" || key === "d") move2048("right");
    if (key === "arrowup" || key === "w") move2048("up");
    if (key === "arrowdown" || key === "s") move2048("down");
  }

  if (currentGame === "tetris" && tPiece) {
    if (key === "arrowleft" || key === "a") {
      tPiece.x--;
      if (collide(tPiece)) tPiece.x++;
    }
    if (key === "arrowright" || key === "d") {
      tPiece.x++;
      if (collide(tPiece)) tPiece.x--;
    }
    if (key === "arrowdown" || key === "s") stepTetris();
    if (key === "arrowup" || key === "w") {
      const old = tPiece.shape;
      tPiece.shape = rotate(tPiece.shape);
      if (collide(tPiece)) tPiece.shape = old;
    }
    if (key === " ") {
      while (!collide(tPiece)) tPiece.y++;
      tPiece.y--;
      stepTetris();
    }
    drawTetris();
  }
});

resetSnake();
reset2048();
resetSlice();
resetTetris();
updateCookieUi();
updateHighScores();
