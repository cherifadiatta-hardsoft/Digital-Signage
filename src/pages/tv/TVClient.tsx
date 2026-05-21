import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { MonitorPlay } from 'lucide-react';
import { Slide } from '../../types';
import { io, Socket } from 'socket.io-client';

export default function TVClient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const tv = useStore((state) => state.tvs.find(t => t.id === id));
  const slides = useStore((state) => state.slides);
  const schedules = useStore((state) => state.schedules);

  // Evaluate scheduling if no manually forced slide is selected or broadcasted
  const currentScheduledRule = (() => {
    if (!id || !schedules || !slides) return null;
    
    const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    // Filter schedules that match this specific TV (or ALL) and are active
    const activeRules = schedules.filter(s => {
      if (!s.isActive) return false;
      if (s.tvId !== 'ALL' && s.tvId !== id) return false;
      if (!s.daysOfWeek.includes(currentDay)) return false;

      // Extract hours and minutes for start and end times
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      // Handle overnight runs
      if (startMin <= endMin) {
        return currentMinutes >= startMin && currentMinutes <= endMin;
      } else {
        return currentMinutes >= startMin || currentMinutes <= endMin;
      }
    });

    if (activeRules.length > 0) {
      // Prioritize specific TV schedules over ALL schedules
      const specificRule = activeRules.find(r => r.tvId === id);
      return specificRule || activeRules[0];
    }

    return null;
  })();

  const currentScheduledSlide = currentScheduledRule 
    ? (slides.find(s => s.id === currentScheduledRule.slideId) || null)
    : null;

  const activeSlide = tv?.currentSlide || currentScheduledSlide || null;

  const [isConnected, setIsConnected] = useState(false);

  // Authentication Check
  useEffect(() => {
    const savedToken = localStorage.getItem('tv_auth_token');
    const code = searchParams.get('code');

    if (code && tv && tv.code === code) {
      // Auto login based on URL link correctly mapping code to TV
      localStorage.setItem('tv_auth_token', tv.id);
      // Remove code from url
      searchParams.delete('code');
      setSearchParams(searchParams, { replace: true });
    } else if (savedToken !== id) {
      navigate('/login-tv');
    }
  }, [id, navigate, searchParams, setSearchParams, tv]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Prefetch and cache all image assets locally in the browser to prevent black/blank screens
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    
    console.log('[Assets Preloader] Starting pre-cache downloads...');
    slides.forEach((slide) => {
      if (slide.type === 'image' && slide.content) {
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        img.src = slide.content;
      }
    });
  }, [slides]);

  // Realtime Socket.IO Connection
  useEffect(() => {
    if (!id) return;
    
    // Connect to same origin with transports fallback
    const socket: Socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
    
    // Log all events instantly to browser console for easy test feedback
    socket.onAny((event, data) => {
       console.log("WebSocket Event Received:", event, data);
    });

    socket.on('connect', () => {
       console.log('Connected to central server, registering TV with ID:', id);
       setIsConnected(true);
       
       // Support both string registration format and object structure
       socket.emit('register_tv', id);
       socket.emit('register-tv', { tvId: id });
    });

    socket.on('disconnect', () => {
       console.log('Disconnected from central server');
       setIsConnected(false);
    });

    socket.on('slide_updated', (slide: Slide | null) => {
       console.log('Received slide update (slide_updated):', slide);
       useStore.getState().assignSlideToTV(id, slide); // Persist across reloads reactively
    });

    // Also support display-slide or display_slide standard layouts
    socket.on('display-slide', (data: any) => {
       console.log('Received display-slide payload:', data);
       if (data) {
         const slide: Slide = {
           id: data.id || 'slide-' + Date.now(),
           title: data.title || 'Slide de passage',
           type: data.type || 'image',
           content: data.url || data.content || '',
           duration: data.duration || 10,
           orgId: data.orgId || 'SYSTEM',
           createdAt: new Date().toISOString()
         };
         useStore.getState().assignSlideToTV(id, slide);
       } else {
         useStore.getState().assignSlideToTV(id, null);
       }
    });

    socket.on('display_slide', (data: any) => {
       console.log('Received display_slide payload:', data);
       if (data) {
         const slide: Slide = {
           id: data.id || 'slide-' + Date.now(),
           title: data.title || 'Slide de passage',
           type: data.type || 'image',
           content: data.url || data.content || '',
           duration: data.duration || 10,
           orgId: data.orgId || 'SYSTEM',
           createdAt: new Date().toISOString()
         };
         useStore.getState().assignSlideToTV(id, slide);
       } else {
         useStore.getState().assignSlideToTV(id, null);
       }
    });

    const interval = setInterval(() => {
       if (socket.connected) {
          socket.emit('heartbeat', id);
       }
    }, 5000);

    return () => {
       clearInterval(interval);
       socket.disconnect();
    };
  }, [id]);

  if (!tv) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black text-white font-sans m-0 p-0 overflow-hidden">
        <div className="text-center">
          <div className="border border-neutral-600 rounded-lg p-3 inline-block mb-6">
            <MonitorPlay className="w-16 h-16 text-neutral-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Écran Non Enregistré</h1>
          <p className="text-neutral-400 text-lg">L'ID {id} n'existe pas dans le système.</p>
        </div>
      </div>
    );
  }

  const slide = activeSlide;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-neutral-950 overflow-hidden text-white font-sans select-none cursor-none flex flex-col items-center justify-center p-0 m-0">
      {/* If there is a slide displaying */}
      {slide ? (
        <div className="absolute inset-0 w-full h-full">
          {/* Mode Badge Indicator */}
          <div className="absolute top-6 right-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-50 text-white select-none">
            <span className={`w-2 h-2 rounded-full ${tv?.currentSlide ? 'bg-amber-400' : 'bg-blue-400 animate-pulse'}`}></span>
            <span className="text-xs font-bold tracking-wider uppercase font-sans">
              {tv?.currentSlide ? "Diffusion Directe" : `Planification active : ${currentScheduledRule?.name || 'Routine'}`}
            </span>
          </div>

          {slide.type === 'image' && (
            <img 
              src={slide.content} 
              alt={slide.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          {slide.type === 'text' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950 bg-gradient-to-br from-blue-900 to-indigo-950 p-12 lg:p-24 overflow-hidden">
              <div 
                className="text-white text-center leading-tight break-words max-w-5xl text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold [&_h1]:text-4xl [&_h1]:sm:text-6xl [&_h1]:md:text-8xl [&_h1]:lg:text-9xl [&_h1]:font-bold [&_h1]:mb-6 [&_h2]:text-3xl [&_h2]:sm:text-5xl [&_h2]:md:text-7xl [&_h2]:lg:text-[5.5rem] [&_h2]:font-bold [&_h2]:mb-4 [&_p]:text-xl [&_p]:sm:text-2xl [&_p]:md:text-3xl [&_p]:lg:text-4xl [&_p]:mt-4 [&_p]:text-blue-200"
                dangerouslySetInnerHTML={{ __html: slide.content }}
              />
            </div>
          )}
        </div>
      ) : (
        /* Default Standby Screen */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 bg-gradient-to-br from-neutral-900 to-black p-8">
          <div className="flex items-center gap-6 md:gap-10 mb-8 md:mb-16">
            <MonitorPlay className="w-16 h-16 md:w-32 md:h-32 text-blue-500" />
            <div>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-none mb-2 md:mb-4">HardSoft TV</h1>
              <p className="text-2xl md:text-4xl text-blue-400 font-medium tracking-widest uppercase">
                {tv.name}
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16 text-left">
            <p className="text-neutral-400 text-lg md:text-2xl uppercase tracking-wider mb-2">
              Identifiant de connexion
            </p>
            <p className="text-3xl md:text-5xl font-mono font-bold text-white tracking-widest bg-white/10 px-6 py-4 md:px-8 md:py-6 rounded-2xl border border-white/10 inline-block font-sans">
              {tv.id}
            </p>
          </div>

          <div className="absolute bottom-10 right-10 md:bottom-16 md:right-16 text-right">
            <p className="text-6xl md:text-8xl font-light tabular-nums tracking-tight leading-none">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xl md:text-3xl text-neutral-400 font-medium mt-4">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div className={`absolute top-10 left-10 md:top-16 md:left-16 flex items-center gap-4 px-6 py-3 rounded-full border ${isConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            <span className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
            <span className="text-sm md:text-xl font-bold tracking-wider uppercase">
              {isConnected ? 'En Ligne • Connecté' : 'Hors Ligne • Déconnecté'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
