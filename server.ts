import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // TV WebSocket State and Cache
  const tvClients = new Map<string, string>(); // socket.id -> tvId
  const currentSlides = new Map<string, any>(); // tvId -> Slide
  let globalSlide: any = null;
  
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
 
    // TV connects - supports both 'register_tv' and 'register-tv'
    const registerTvHandler = (tvIdData: any) => {
      let tvId: string | null = null;
      if (typeof tvIdData === 'string') {
        tvId = tvIdData;
      } else if (tvIdData && typeof tvIdData === 'object' && typeof tvIdData.tvId === 'string') {
        tvId = tvIdData.tvId;
      }
      
      if (!tvId) return;
      console.log(`TV Registered (event trigger): ${tvId}`);
      tvClients.set(socket.id, tvId);
      socket.join(`tv_${tvId}`);
      io.emit("tv_online", tvId); // Notify admin dashboard

      // Immediately send active slide if we have it cached on the server back-channel
      const activeSlide = currentSlides.has(tvId) ? currentSlides.get(tvId) : globalSlide;
      if (activeSlide !== undefined && activeSlide !== null) {
         console.log(`Sending immediate active slide to TV ${tvId}:`, activeSlide.title || activeSlide);
         socket.emit("slide_updated", activeSlide);
         socket.emit("display-slide", {
           id: activeSlide.id,
           title: activeSlide.title,
           type: activeSlide.type,
           url: activeSlide.content,
           content: activeSlide.content,
           duration: activeSlide.duration
         });
      }
    };

    socket.on("register_tv", registerTvHandler);
    socket.on("register-tv", registerTvHandler);
 
    // Admin updates a tv slide - support both 'update_slide' and 'update-slide'
    const updateSlideHandler = (data: any) => {
      if (!data || typeof data !== 'object') return;
      const { tvId, slide } = data;
      if (!tvId || typeof tvId !== 'string') return;
      console.log(`Updating slide on server map for TV: ${tvId}`, slide?.title || 'None/Stopped');
      
      let normalizedSlide = slide;
      // If the slide has custom properties like url instead of content
      if (slide && !slide.content && slide.url) {
        normalizedSlide = {
          id: slide.id || 'slide-' + Date.now(),
          title: slide.title || 'Slide de passage',
          type: slide.type || 'image',
          content: slide.url,
          duration: slide.duration || 10,
          createdAt: new Date().toISOString()
        };
      }

      if (tvId === "ALL") {
        globalSlide = normalizedSlide;
        for (const [sid, tid] of tvClients.entries()) {
          currentSlides.set(tid, normalizedSlide);
        }
        io.emit("slide_updated", normalizedSlide);
        io.emit("display-slide", slide);
      } else {
        currentSlides.set(tvId, normalizedSlide);
        io.to(`tv_${tvId}`).emit("slide_updated", normalizedSlide);
        
        if (normalizedSlide) {
          io.to(`tv_${tvId}`).emit("display-slide", {
            id: normalizedSlide.id,
            title: normalizedSlide.title,
            type: normalizedSlide.type,
            url: normalizedSlide.content,
            content: normalizedSlide.content,
            duration: normalizedSlide.duration
          });
        } else {
          io.to(`tv_${tvId}`).emit("display-slide", null);
        }
      }
    };

    socket.on("update_slide", updateSlideHandler);
    socket.on("update-slide", updateSlideHandler);
 
    // Heartbeat from TVs
    socket.on("heartbeat", (tvId: string) => {
      if (!tvId || typeof tvId !== 'string') return;
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

  // Generate slide text using Gemini AI
  app.post("/api/generate-slide", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a creative copywriter generating punchy, concise, and attractive text for a digital signage smart TV display. Generate ONLY the text to display. Be concise and impactful. Maximum 1-3 short sentences. No formatting, no extra explanation.",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini AI error:", error);
      res.status(500).json({ error: error.message || "Failed to generate text" });
    }
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
