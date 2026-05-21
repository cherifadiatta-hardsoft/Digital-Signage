import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // TV WebSocket State
  const tvClients = new Map<string, string>(); // socket.id -> tvId
  
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // TV connects
    socket.on("register_tv", (tvId: string) => {
      console.log(`TV Registered: ${tvId}`);
      tvClients.set(socket.id, tvId);
      socket.join(`tv_${tvId}`);
      io.emit("tv_online", tvId); // Notify admin dashboard
    });

    // Admin updates a tv slide
    socket.on("update_slide", ({ tvId, slide }) => {
      console.log(`Updating slide for TV: ${tvId}`);
      if (tvId === "ALL") {
        io.emit("slide_updated", slide);
      } else {
        io.to(`tv_${tvId}`).emit("slide_updated", slide);
      }
    });

    // Heartbeat from TVs
    socket.on("heartbeat", (tvId: string) => {
      io.emit("tv_online", tvId); // Forward to admin
    });

    socket.on("disconnect", () => {
      const tvId = tvClients.get(socket.id);
      if (tvId) {
        console.log(`TV Disconnected: ${tvId}`);
        io.emit("tv_offline", tvId);
        tvClients.delete(socket.id);
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  // API Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
