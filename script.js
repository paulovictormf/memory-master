const LEVELS = {
  easy: { columns: 4, pairs: 6, label: "Fácil" },
  medium: { columns: 4, pairs: 8, label: "Médio" },
  hard: { columns: 6, pairs: 12, label: "Difícil" }
};

const ICONS = [
  "💻", "🖥️", "⌨️", "🖱️", "📱", "🎧",
  "📷", "🎮", "🚀", "⚙️", "🤖", "🌐",
  "💾", "🔋", "🛰️", "🧠"
];

const board = document.getElementById("board");
const timeValue = document.getElementById("timeValue");
const movesValue = document.getElementById("movesValue");
const comboValue = document.getElementById("comboValue");
const bestValue = document.getElementById("bestValue");
const pairsLabel = document.getElementById("pairsLabel");
const accuracyLabel = document.getElementById("accuracyLabel");
const progressBar = document.getElementById("progressBar");
const winModal = document.getElementById("winModal");
const finalTime = document.getElementById("finalTime");
const finalMoves = document.getElementById("finalMoves");
const finalAccuracy = document.getElementById("finalAccuracy");
const winMessage = document.getElementById("winMessage");
const medal = document.getElementById("medal");
const particleLayer = document.getElementById("particleLayer");
const soundButton = document.getElementById("soundButton");
const themeButton = document.getElementById("themeButton");

let currentLevel = "easy";
let firstCard = null;
let secondCard = null;
let locked = false;
let moves = 0;
let matches = 0;
let combo = 0;
let correctAttempts = 0;
let seconds = 0;
let timerId = null;
let gameStarted = false;
let soundEnabled = true;
let audioContext = null;

function shuffle(items) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secondsPart = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${secondsPart}`;
}

function getAccuracy() {
  if (moves === 0) return 100;
  return Math.round((correctAttempts / moves) * 100);
}

function getBestKey() {
  return `memory-master-best-${currentLevel}`;
}

function updateBestDisplay() {
  const stored = JSON.parse(localStorage.getItem(getBestKey()) || "null");
  bestValue.textContent = stored ? `${stored.moves} jog.` : "—";
}

function updateStats() {
  const totalPairs = LEVELS[currentLevel].pairs;
  timeValue.textContent = formatTime(seconds);
  movesValue.textContent = String(moves);
  comboValue.textContent = `${combo}x`;
  pairsLabel.textContent = `${matches} de ${totalPairs} pares`;
  accuracyLabel.textContent = `Precisão: ${getAccuracy()}%`;
  progressBar.style.width = `${(matches / totalPairs) * 100}%`;
}

function startTimer() {
  if (timerId) return;
  timerId = window.setInterval(() => {
    seconds += 1;
    updateStats();
  }, 1000);
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = null;
}

function createCard(icon, index) {
  const button = document.createElement("button");
  button.className = "card";
  button.type = "button";
  button.dataset.icon = icon;
  button.dataset.index = String(index);
  button.setAttribute("aria-label", "Carta fechada");
  button.innerHTML = `
    <span class="card-face card-front"></span>
    <span class="card-face card-back">${icon}</span>
  `;
  button.addEventListener("click", () => handleCardClick(button));
  return button;
}

function newGame() {
  stopTimer();
  firstCard = null;
  secondCard = null;
  locked = false;
  moves = 0;
  matches = 0;
  combo = 0;
  correctAttempts = 0;
  seconds = 0;
  gameStarted = false;
  winModal.classList.add("hidden");

  const pairCount = LEVELS[currentLevel].pairs;
  const selectedIcons = shuffle(ICONS).slice(0, pairCount);
  const deck = shuffle([...selectedIcons, ...selectedIcons]);

  board.className = `board ${currentLevel}`;
  board.innerHTML = "";
  deck.forEach((icon, index) => {
    board.appendChild(createCard(icon, index));
  });

  updateBestDisplay();
  updateStats();
}

function handleCardClick(card) {
  if (locked || card === firstCard || card.classList.contains("matched")) return;

  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  playSound("flip");
  card.classList.add("flipped");
  card.setAttribute("aria-label", `Carta ${card.dataset.icon}`);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;

  if (firstCard.dataset.icon === secondCard.dataset.icon) {
    correctAttempts += 1;
    combo += 1;
    window.setTimeout(confirmMatch, 260);
  } else {
    combo = 0;
    locked = true;
    window.setTimeout(hideCards, 820);
  }

  updateStats();
}

function confirmMatch() {
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");
  firstCard.disabled = true;
  secondCard.disabled = true;
  firstCard.setAttribute("aria-label", `Par encontrado: ${firstCard.dataset.icon}`);
  secondCard.setAttribute("aria-label", `Par encontrado: ${secondCard.dataset.icon}`);
  matches += 1;

  playSound("match");
  burstParticles(firstCard);
  resetTurn();
  updateStats();

  if (matches === LEVELS[currentLevel].pairs) {
    finishGame();
  }
}

function hideCards() {
  firstCard.classList.remove("flipped");
  secondCard.classList.remove("flipped");
  firstCard.setAttribute("aria-label", "Carta fechada");
  secondCard.setAttribute("aria-label", "Carta fechada");
  playSound("miss");
  resetTurn();
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  locked = false;
}

function finishGame() {
  stopTimer();

  const accuracy = getAccuracy();
  const previous = JSON.parse(localStorage.getItem(getBestKey()) || "null");
  const currentScore = { moves, seconds };

  if (!previous || moves < previous.moves || (moves === previous.moves && seconds < previous.seconds)) {
    localStorage.setItem(getBestKey(), JSON.stringify(currentScore));
  }

  if (accuracy >= 90) {
    medal.textContent = "🥇";
    winMessage.textContent = "Desempenho incrível. Sua memória está afiada!";
  } else if (accuracy >= 70) {
    medal.textContent = "🥈";
    winMessage.textContent = "Ótimo resultado. Você mandou muito bem!";
  } else {
    medal.textContent = "🥉";
    winMessage.textContent = "Boa! Continue jogando para melhorar seu recorde.";
  }

  finalTime.textContent = formatTime(seconds);
  finalMoves.textContent = String(moves);
  finalAccuracy.textContent = `${accuracy}%`;

  updateBestDisplay();
  playSound("win");
  celebrate();
  window.setTimeout(() => winModal.classList.remove("hidden"), 500);
}

function burstParticles(card) {
  const rect = card.getBoundingClientRect();
  const colors = ["#22c55e", "#60a5fa", "#a78bfa", "#facc15"];

  for (let index = 0; index < 12; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    particle.style.background = colors[index % colors.length];
    particle.style.setProperty("--x", `${(Math.random() - 0.5) * 170}px`);
    particle.style.setProperty("--y", `${(Math.random() - 0.5) * 170}px`);
    particleLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), 1500);
  }
}

function celebrate() {
  const colors = ["#60a5fa", "#a78bfa", "#22c55e", "#facc15", "#fb7185"];

  for (let index = 0; index < 90; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = "-20px";
    particle.style.background = colors[index % colors.length];
    particle.style.setProperty("--x", `${(Math.random() - 0.5) * 240}px`);
    particle.style.setProperty("--y", `${window.innerHeight + 120}px`);
    particle.style.animationDuration = `${1.5 + Math.random() * 1.7}s`;
    particleLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), 3400);
  }
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration, type = "sine", volume = 0.05, delay = 0) {
  if (!soundEnabled) return;

  ensureAudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playSound(kind) {
  if (!soundEnabled) return;

  if (kind === "flip") playTone(420, 0.08, "sine", 0.035);
  if (kind === "match") {
    playTone(520, 0.15, "sine", 0.05);
    playTone(760, 0.18, "sine", 0.05, 0.08);
  }
  if (kind === "miss") playTone(180, 0.18, "triangle", 0.04);
  if (kind === "win") {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      playTone(frequency, 0.35, "sine", 0.045, index * 0.12);
    });
  }
}

document.querySelectorAll(".difficulty-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".difficulty-button").forEach((item) => {
      item.classList.remove("active");
    });
    button.classList.add("active");
    currentLevel = button.dataset.level;
    newGame();
  });
});

document.getElementById("newGameButton").addEventListener("click", newGame);
document.getElementById("playAgainButton").addEventListener("click", newGame);
document.getElementById("closeModalButton").addEventListener("click", () => {
  winModal.classList.add("hidden");
});

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "🔊" : "🔇";
  soundButton.setAttribute("aria-label", soundEnabled ? "Desativar sons" : "Ativar sons");
});

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const lightMode = document.body.classList.contains("light");
  themeButton.textContent = lightMode ? "☀️" : "🌙";
  localStorage.setItem("memory-master-theme", lightMode ? "light" : "dark");
});

if (localStorage.getItem("memory-master-theme") === "light") {
  document.body.classList.add("light");
  themeButton.textContent = "☀️";
}

newGame();
