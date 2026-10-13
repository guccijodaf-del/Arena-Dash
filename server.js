
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const players = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function spawnPlayer(id, name) {
  return {
    id,
    name,
    x: 100 + Math.random() * 800,
    y: 100 + Math.random() * 450,
    health: 100,
    score: 0,
    lastAttack: 0,
    respawning: false
  };
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    x: p.x,
    y: p.y,
    health: p.health,
    score: p.score,
    respawning: p.respawning
  };
}

io.on("connection", (socket) => {
  socket.on("join", (rawName) => {
    if (players.has(socket.id)) return;

    const name = String(rawName || "Player")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 16) || "Player";

    players.set(socket.id, spawnPlayer(socket.id, name));
    socket.emit("welcome", { id: socket.id });
  });

  socket.on("move", (keys) => {
    const p = players.get(socket.id);
    if (!p || p.health <= 0 || p.respawning) return;

    const speed = 5;
    let dx = 0;
    let dy = 0;

    if (keys?.left) dx -= 1;
    if (keys?.right) dx += 1;
    if (keys?.up) dy -= 1;
    if (keys?.down) dy += 1;

    if (dx && dy) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    p.x = Math.max(20, Math.min(980, p.x + dx * speed));
    p.y = Math.max(20, Math.min(630, p.y + dy * speed));
  });

  socket.on("attack", () => {
    const attacker = players.get(socket.id);
    if (!attacker || attacker.health <= 0 || attacker.respawning) return;

    const now = Date.now();
    if (now - attacker.lastAttack < 650) return;
    attacker.lastAttack = now;

    let target = null;
    let closest = 53;

    for (const p of players.values()) {
      if (p.id === attacker.id || p.health <= 0 || p.respawning) continue;

      const distance = Math.hypot(p.x - attacker.x, p.y - attacker.y);
      if (distance < closest) {
        closest = distance;
        target = p;
      }
    }

    if (!target) {
      socket.emit("attack-result", { hit: false });
      return;
    }

    target.health = Math.max(0, target.health - 34);

    io.emit("attack-effect", {
      attackerId: attacker.id,
      targetId: target.id,
      x: target.x,
      y: target.y,
      hit: true
    });

    if (target.health === 0) {
      attacker.score += 1;
      target.respawning = true;

      setTimeout(() => {
        const current = players.get(target.id);
        if (!current) return;
        current.health = 100;
        current.x = 100 + Math.random() * 800;
        current.y = 100 + Math.random() * 450;
        current.respawning = false;
      }, 2500);
    }
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
  });
});

setInterval(() => {
  io.emit("state", Array.from(players.values(), publicPlayer));
}, 50);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Arena Dash running on port ${PORT}`);
});
