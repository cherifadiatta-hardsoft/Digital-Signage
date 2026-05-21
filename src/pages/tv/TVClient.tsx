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
  
  const initialTv = useStore((state) => state.tvs.find(t => t.id === id));
  
  // Local state for instant reaction
  const [activeSlide, setActiveSlide] = useState<Slide | null>(initialTv?.currentSlide || null);

  // Authentication Check
  useEffect(() => {
    const savedToken = localStorage.getItem('tv_auth_token');
    const code = searchParams.get('code');

    if (code && initialTv && initialTv.code === code) {
      // Auto login based on URL link correctly mapping code to TV
      localStorage.setItem('tv_auth_token', initialTv.id);
      // Remove code from url
      searchParams.delete('code');
      setSearchParams(searchParams, { replace: true });
    } else if (savedToken !== id) {
      navigate('/login-tv');
    }
  }, [id, navigate, searchParams, setSearchParams, initialTv]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime Socket.IO Connection
  useEffect(() => {
    if (!id) return;
    
    // Connect to same origin
    const socket: Socket = io(window.location.origin);
    
    socket.on('connect', () => {
       console.log('Connected to central server, registering TV...');
       socket.emit('register_tv', id);
    });

    socket.on('slide_updated', (slide: Slide | null) => {
       console.log('Received slide update:', slide);
       setActiveSlide(slide);
       useStore.getState().assignSlideToTV(id, slide); // Persist across reloads
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

  if (!initialTv) {
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
          {slide.type === 'image' && (
            <img 
              src={slide.content} 
              alt={slide.title} 
              className="w-full h-full object-cover"
            />
          )}
          {slide.type === 'text' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950 bg-gradient-to-br from-blue-900 to-indigo-950 p-12 lg:p-24">
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold text-white text-center leading-tight">
                {slide.content}
              </h1>
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
                {initialTv.name}
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16 text-left">
            <p className="text-neutral-400 text-lg md:text-2xl uppercase tracking-wider mb-2">
              Identifiant de connexion
            </p>
            <p className="text-3xl md:text-5xl font-mono font-bold text-white tracking-widest bg-white/10 px-6 py-4 md:px-8 md:py-6 rounded-2xl border border-white/10 inline-block">
              {initialTv.id}
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
          
          <div className="absolute top-10 left-10 md:top-16 md:left-16 flex items-center gap-4 bg-green-500/20 text-green-400 px-6 py-3 rounded-full border border-green-500/30">
            <span className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm md:text-xl font-bold tracking-wider uppercase">
              En Ligne &bull; Connecté
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
