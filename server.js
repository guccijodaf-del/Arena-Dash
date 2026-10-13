const express = require("express");
const http = require("node:http");
const path = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const WIDTH = 1000;
const HEIGHT = 650;
const PLAYER_RADIUS = 16;
const SPEED = 230;
const players = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, players: players.size }));

function cleanName(value) {
  if (typeof value !== "string") return "Player";
  const name = value.replace(/[<>]/g, "").trim().slice(0, 16);
  return name || "Player";
}

function snapshot() {
  return Array.from(players.values()).map(({ id, name, x, y, color, score }) => ({
    id, name, x, y, color, score
  }));
}

io.on("connection", (socket) => {
  const colors = ["#5eead4", "#f9a8d4", "#fcd34d", "#93c5fd", "#c4b5fd", "#fdba74"];
  const player = {
    id: socket.id,
    name: "Player",
    x: 80 + Math.random() * (WIDTH - 160),
    y: 80 + Math.random() * (HEIGHT - 160),
    color: colors[Math.floor(Math.random() * colors.length)],
    score: 0,
    input: { up: false, down: false, left: false, right: false }
  };
  players.set(socket.id, player);

  socket.emit("welcome", { id: socket.id, width: WIDTH, height: HEIGHT });
  socket.emit("players", snapshot());

  socket.on("set-name", (name) => {
    player.name = cleanName(name);
    io.emit("players", snapshot());
  });

  socket.on("input", (input) => {
    if (!input || typeof input !== "object") return;
    player.input = {
      up: input.up === true,
      down: input.down === true,
      left: input.left === true,
      right: input.right === true
    };
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.emit("players", snapshot());
  });
});

let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  for (const player of players.values()) {
    let dx = Number(player.input.right) - Number(player.input.left);
    let dy = Number(player.input.down) - Number(player.input.up);
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    player.x = Math.max(PLAYER_RADIUS, Math.min(WIDTH - PLAYER_RADIUS, player.x + dx * SPEED * dt));
    player.y = Math.max(PLAYER_RADIUS, Math.min(HEIGHT - PLAYER_RADIUS, player.y + dy * SPEED * dt));
  }

  io.emit("state", snapshot());
}, 50);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Arena Dash running on port ${PORT}`);
});
