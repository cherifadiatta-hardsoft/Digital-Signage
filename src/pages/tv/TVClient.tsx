import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { MonitorPlay } from 'lucide-react';

export default function TVClient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const tv = useStore((state) => state.tvs.find(t => t.id === id));
  const tvHeartbeat = useStore((state) => state.tvHeartbeat);

  // Authentication Check
  useEffect(() => {
    const savedToken = localStorage.getItem('tv_auth_token');
    if (savedToken !== id) {
      // If not authenticated for this specific TV, redirect to login
      navigate('/login-tv');
    }
  }, [id, navigate]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Heartbeat to let Admin know this TV is online
  useEffect(() => {
    if (id) {
      tvHeartbeat(id);
      const interval = setInterval(() => {
        tvHeartbeat(id);
      }, 5000); // 5 second heartbeat
      return () => clearInterval(interval);
    }
  }, [id, tvHeartbeat]);

  if (!tv) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <MonitorPlay className="w-16 h-16 mx-auto mb-4 text-neutral-600 border border-neutral-600 rounded-lg p-2" />
          <h1 className="text-2xl font-bold">Écran Non Enregistré</h1>
          <p className="text-neutral-500 mt-2">L'ID {id} n'existe pas dans le système.</p>
        </div>
      </div>
    );
  }

  const slide = tv.currentSlide;

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden relative selection:bg-transparent cursor-none">
      {/* If there is a slide displaying */}
      {slide ? (
        <div className="absolute inset-0 w-full h-full animate-in fade-in duration-500">
          {slide.type === 'image' && (
            <img 
              src={slide.content} 
              alt={slide.title} 
              className="w-full h-full object-cover"
            />
          )}
          {slide.type === 'text' && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 p-12">
              <h1 className="text-6xl md:text-8xl font-bold text-white text-center leading-tight drop-shadow-xl max-w-5xl">
                {slide.content}
              </h1>
            </div>
          )}
        </div>
      ) : (
        /* Default Standby Screen */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white p-8">
          <div className="flex items-center gap-6 mb-12">
            <MonitorPlay className="w-20 h-20 text-blue-500" />
            <div>
              <h1 className="text-6xl font-bold tracking-tight">HardSoft TV</h1>
              <p className="text-2xl text-blue-400 font-medium tracking-widest mt-2 uppercase">{tv.name}</p>
            </div>
          </div>
          
          <div className="absolute bottom-12 left-12 text-left">
            <p className="text-neutral-500 text-lg uppercase tracking-wider mb-1">Identifiant de connexion</p>
            <p className="text-4xl font-mono font-bold text-white tracking-widest bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10 shadow-2xl inline-block">
              {tv.id}
            </p>
          </div>

          <div className="absolute bottom-12 right-12 text-right">
            <p className="text-6xl font-light tabular-nums tracking-tight drop-shadow-lg">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xl text-neutral-400 mt-2 font-medium">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div className="absolute top-12 left-12 flex items-center gap-3 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-bold tracking-wider uppercase">En Ligne &bull; Connecté au Serveur</span>
          </div>
        </div>
      )}
    </div>
  );
}
