const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");

const gridCount = 20;
const tileSize = canvas.width / gridCount;
const speedMs = 110;

let snake;
let direction;
let nextDirection;
let food;
let score;
let best = Number(localStorage.getItem("snake-best") || 0);
let timer;
let running = false;
let paused = false;

bestEl.textContent = String(best);

function randomCell() {
  return {
    x: Math.floor(Math.random() * gridCount),
    y: Math.floor(Math.random() * gridCount),
  };
}

function spawnFood() {
  let candidate = randomCell();
  while (snake.some((part) => part.x === candidate.x && part.y === candidate.y)) {
    candidate = randomCell();
  }
  return candidate;
}

function resetGame() {
  const start = Math.floor(gridCount / 2);
  snake = [
    { x: start, y: start },
    { x: start - 1, y: start },
    { x: start - 2, y: start },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  food = spawnFood();
  score = 0;
  scoreEl.textContent = "0";
  paused = false;
  pauseBtn.textContent = "Pause";
  draw();
}

function showOverlay(text, buttonText) {
  overlayText.textContent = text;
  startBtn.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function drawGrid() {
  ctx.strokeStyle = "rgba(21, 50, 67, 0.08)";
  for (let i = 0; i <= gridCount; i += 1) {
    const p = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(
    food.x * tileSize + tileSize / 2,
    food.y * tileSize + tileSize / 2,
    tileSize * 0.34,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  snake.forEach((segment, index) => {
    const px = segment.x * tileSize;
    const py = segment.y * tileSize;
    ctx.fillStyle = index === 0 ? "#146356" : "#1f8a70";
    ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
  });
}

function endGame() {
  clearInterval(timer);
  running = false;
  if (score > best) {
    best = score;
    localStorage.setItem("snake-best", String(best));
    bestEl.textContent = String(best);
  }
  showOverlay(`Game Over - score: ${score}`, "Play Again");
}

function tick() {
  if (!running || paused) {
    return;
  }

  direction = nextDirection;
  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitWall =
    newHead.x < 0 ||
    newHead.x >= gridCount ||
    newHead.y < 0 ||
    newHead.y >= gridCount;

  const hitSelf = snake.some((part) => part.x === newHead.x && part.y === newHead.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    scoreEl.textContent = String(score);
    food = spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function setDirection(x, y) {
  if (!running || paused) {
    return;
  }

  if (x === -direction.x && y === -direction.y) {
    return;
  }

  nextDirection = { x, y };
}

function startGame() {
  resetGame();
  running = true;
  hideOverlay();
  clearInterval(timer);
  timer = setInterval(tick, speedMs);
}

function togglePause() {
  if (!running) {
    return;
  }
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  if (paused) {
    showOverlay("Paused", "Resume");
  } else {
    hideOverlay();
  }
}

window.addEventListener("keydown", (event) => {
  switch (event.key.toLowerCase()) {
    case "arrowup":
    case "w":
      event.preventDefault();
      setDirection(0, -1);
      break;
    case "arrowdown":
    case "s":
      event.preventDefault();
      setDirection(0, 1);
      break;
    case "arrowleft":
    case "a":
      event.preventDefault();
      setDirection(-1, 0);
      break;
    case "arrowright":
    case "d":
      event.preventDefault();
      setDirection(1, 0);
      break;
    case " ":
      event.preventDefault();
      togglePause();
      break;
    default:
      break;
  }
});

let touchStart = null;
canvas.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
});

canvas.addEventListener("touchend", (event) => {
  if (!touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < 20) {
    touchStart = null;
    return;
  }

  if (absX > absY) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    setDirection(0, dy > 0 ? 1 : -1);
  }

  touchStart = null;
});

startBtn.addEventListener("click", () => {
  if (running && paused) {
    togglePause();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", startGame);

resetGame();
showOverlay("Press Start", "Start");
