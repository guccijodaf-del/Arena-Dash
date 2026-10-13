const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const players = new Map();
const colors = ["#5eead4", "#fb7185", "#60a5fa", "#facc15", "#c084fc", "#4ade80"];

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function makePlayer(id, name) {
  return {
    id,
    name,
    x: 50 + Math.random() * 900,
    y: 50 + Math.random() * 550,
    health: 100,
    score: 0,
    alive: true,
    color: colors[Math.floor(Math.random() * colors.length)],
    keys: {},
    lastAttack: 0,
    respawnTimer: null
  };
}

function broadcastState() {
  io.emit("state", {
    players: [...players.values()].map(p => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      health: p.health,
      score: p.score,
      alive: p.alive,
      color: p.color
    }))
  });
}

io.on("connection", socket => {
  socket.emit("welcome", { id: socket.id });

  socket.on("set-name", rawName => {
    let p = players.get(socket.id);

    const name = String(rawName || "Player")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 16) || "Player";

    if (!p) {
      p = makePlayer(socket.id, name);
      players.set(socket.id, p);
    } else {
      p.name = name;
    }

    broadcastState();
  });

  socket.on("input", keys => {
    const p = players.get(socket.id);
    if (!p || !p.alive) return;

    p.keys = {
      up: !!keys?.up,
      down: !!keys?.down,
      left: !!keys?.left,
      right: !!keys?.right
    };
  });

  socket.on("attack", () => {
    const attacker = players.get(socket.id);
    if (!attacker || !attacker.alive) return;

    const now = Date.now();
    if (now - attacker.lastAttack < 650) return;
    attacker.lastAttack = now;

    let target = null;
    let closest = 53;

    for (const p of players.values()) {
      if (p.id === attacker.id || !p.alive) continue;

      const distance = Math.hypot(p.x - attacker.x, p.y - attacker.y);
      if (distance < closest) {
        closest = distance;
        target = p;
      }
    }

    if (!target) return;

    target.health = Math.max(0, target.health - 34);

    io.emit("attack-effect", {
      x: target.x,
      y: target.y
    });

    io.emit("hit", {
      targetId: target.id
    });

    if (target.health === 0) {
      target.alive = false;
      attacker.score += 1;

      io.emit("elimination", {
        attackerName: attacker.name,
        targetName: target.name
      });

      target.keys = {};

      target.respawnTimer = setTimeout(() => {
        const current = players.get(target.id);
        if (!current) return;

        current.x = 50 + Math.random() * 900;
        current.y = 50 + Math.random() * 550;
        current.health = 100;
        current.alive = true;
        current.respawnTimer = null;
        broadcastState();
      }, 2500);
    }

    broadcastState();
  });

  socket.on("disconnect", () => {
    const p = players.get(socket.id);
    if (p?.respawnTimer) clearTimeout(p.respawnTimer);
    players.delete(socket.id);
    broadcastState();
  });
});

setInterval(() => {
  for (const p of players.values()) {
    if (!p.alive) continue;

    const speed = 5;
    let dx = (p.keys.right ? 1 : 0) - (p.keys.left ? 1 : 0);
    let dy = (p.keys.down ? 1 : 0) - (p.keys.up ? 1 : 0);

    if (dx && dy) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    p.x = Math.max(20, Math.min(980, p.x + dx * speed));
    p.y = Math.max(20, Math.min(630, p.y + dy * speed));
  }

  broadcastState();
}, 50);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Arena Dash running on port ${PORT}`);
});
