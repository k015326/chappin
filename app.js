let db;
let currentPlayer = null;

const request = indexedDB.open("ChappinDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("players", { keyPath: "name" });
};

request.onsuccess = e => {
  db = e.target.result;
  loadPlayers();
};

function addPlayer() {
  const name = document.getElementById("newPlayer").value;
  if (!name) return;

  const tx = db.transaction("players", "readwrite");
  tx.objectStore("players").put({
    name,
    shots: [],
    model: { rightBias: 0, leftBias: 0 }
  });

  loadPlayers();
}

function loadPlayers() {
  const select = document.getElementById("playerSelect");
  select.innerHTML = "";

  const tx = db.transaction("players", "readonly");
  const req = tx.objectStore("players").getAll();

  req.onsuccess = () => {
    req.result.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      select.appendChild(opt);
    });

    select.onchange = () => currentPlayer = select.value;
    if (req.result.length) currentPlayer = req.result[0].name;
  };
}

function addShot() {
  const stand = Number(document.getElementById("stand").value);
  const target = Number(document.getElementById("target").value);
  const pins = document.getElementById("pins").value;

  const isStrike = !pins || pins === "0";

  const tx = db.transaction("players", "readwrite");
  const store = tx.objectStore("players");

  const req = store.get(currentPlayer);

  req.onsuccess = () => {
    const player = req.result;

    const shot = { stand, target, pins, isStrike };
    player.shots.push(shot);

    updateModel(player, shot);

    store.put(player);

    analyze(player);
  };
}

// 学習
function updateModel(player, shot) {
  if (shot.pins.includes("10")) player.model.rightBias++;
  if (shot.pins.includes("4")) player.model.leftBias++;
}

// ベイズ最適化
function calculateBest(shots) {
  const map = {};

  shots.forEach(s => {
    const key = `${s.stand}-${s.target}`;
    if (!map[key]) map[key] = { a: 1, b: 1 };

    if (s.isStrike) map[key].a++;
    else map[key].b++;
  });

  let best = null, bestScore = 0;

  for (let key in map) {
    const { a, b } = map[key];
    const score = a / (a + b);

    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }

  return best;
}

// AI提案
function suggest(player, last) {
  let s = last.stand;
  let t = last.target;

  const rb = Math.floor(player.model.rightBias / 5);
  const lb = Math.floor(player.model.leftBias / 5);

  if (last.pins.includes("10")) {
    s -= 2 + rb;
    t -= 1;
  }

  if (last.pins.includes("4")) {
    s += 2 + lb;
    t += 1;
  }

  return { stand: s, target: t };
}

function analyze(player) {
  const shots = player.shots;

  if (shots.length < 3) {
    document.getElementById("result").textContent = "※3投以上で分析開始";
    return;
  }

  const best = calculateBest(shots);
  const [stand, target] = best.split("-");
  const last = shots[shots.length - 1];

  const sug = suggest(player, last);

  document.getElementById("result").textContent =
`最適
立ち位置:${stand}
通過:${target}

次の推奨
立ち位置:${sug.stand}
通過:${sug.target}`;

  drawHeatmap(shots);
}

function drawHeatmap(shots) {
  const canvas = document.getElementById("heatmap");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0,0,300,300);

  shots.forEach(s => {
    const x = s.stand * 5;
    const y = s.target * 5;
    ctx.fillStyle = s.isStrike ? "red" : "blue";
    ctx.fillRect(x,y,8,8);
  });
}