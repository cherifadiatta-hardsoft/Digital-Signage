import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { MonitorPlay } from 'lucide-react';
import { Slide } from '../../types';
import { supabase } from '../../lib/supabaseClient';

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

  // Realtime listener mechanism (BroadcastChannel + Supabase fallback)
  useEffect(() => {
    // 1. BroadcastChannel (Local Preview sync)
    const channel = new BroadcastChannel('hardsoft_tv_channel');

    // Announce presence (heartbeat) without direct store mutation on client to prevent race conditions
    const emitHeartbeat = () => {
      if (id) {
        channel.postMessage({ type: 'PING', tvId: id });
      }
    };

    emitHeartbeat();
    const interval = setInterval(emitHeartbeat, 5000);

    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE_SLIDE') {
        if (event.data.tvId === id || event.data.tvId === 'ALL') {
          setActiveSlide(event.data.slide);
        }
      }
    };

    // 2. Supabase Integration (Production sync)
    let supabaseChannel: any = null;
    
    if (supabase && id) {
      const fetchInitialData = async () => {
        const { data, error } = await supabase
          .from('tv_control')
          .select('current_slide_url')
          .eq('tv_id', id)
          .single();
        
        if (data && data.current_slide_url) {
          try {
            setActiveSlide(JSON.parse(data.current_slide_url));
          } catch (e) {
            console.error('Invalid slide data in Supabase');
          }
        }
      };

      fetchInitialData();

      supabaseChannel = supabase
        .channel(`schema-db-changes-${id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'tv_control', 
          filter: `tv_id=eq.${id}` 
        }, (payload: any) => {
          if (payload.new && payload.new.current_slide_url) {
            try {
              setActiveSlide(JSON.parse(payload.new.current_slide_url));
            } catch (e) {
               console.error('Invalid slide data received from Supabase');
            }
          } else {
            setActiveSlide(null); // Clear slide
          }
        })
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      channel.close();
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [id]);

  // Fallback sync with global store if changed via other means
  useEffect(() => {
    // Only trust the store if supabase isn't active/primary for truth
    if (!supabase) {
      setActiveSlide(initialTv?.currentSlide || null);
    }
  }, [initialTv?.currentSlide]);

  if (!initialTv) {
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

  const slide = activeSlide;

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
              <p className="text-2xl text-blue-400 font-medium tracking-widest mt-2 uppercase">{initialTv.name}</p>
            </div>
          </div>
          
          <div className="absolute bottom-12 left-12 text-left">
            <p className="text-neutral-500 text-lg uppercase tracking-wider mb-1">Identifiant de connexion</p>
            <p className="text-4xl font-mono font-bold text-white tracking-widest bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10 shadow-2xl inline-block">
              {initialTv.id}
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
