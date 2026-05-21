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
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '1px solid #525252', borderRadius: '8px', padding: '8px', display: 'inline-block', marginBottom: '16px' }}>
            <MonitorPlay size={64} color="#525252" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Écran Non Enregistré</h1>
          <p style={{ color: '#737373', margin: 0 }}>L'ID {id} n'existe pas dans le système.</p>
        </div>
      </div>
    );
  }

  const slide = activeSlide;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#000000',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'none',
      fontFamily: 'sans-serif'
    }}>
      {/* If there is a slide displaying */}
      {slide ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}>
          {slide.type === 'image' && (
            <img 
              src={slide.content} 
              alt={slide.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {slide.type === 'text' && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e3a8a',
              background: 'linear-gradient(to bottom right, #1e3a8a, #0f172a)',
              padding: '48px',
              boxSizing: 'border-box'
            }}>
              <h1 style={{
                fontSize: '8vw',
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: '1.2',
                maxWidth: '90%',
                margin: 0
              }}>
                {slide.content}
              </h1>
            </div>
          )}
        </div>
      ) : (
        /* Default Standby Screen */
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#171717',
          background: 'linear-gradient(to bottom right, #171717, #000000)',
          color: '#ffffff',
          padding: '32px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
            <MonitorPlay size={80} color="#3b82f6" />
            <div>
              <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0', letterSpacing: '-0.025em' }}>HardSoft TV</h1>
              <p style={{ fontSize: '24px', color: '#60a5fa', fontWeight: '500', letterSpacing: '0.1em', marginTop: '8px', textTransform: 'uppercase', margin: 0 }}>
                {initialTv.name}
              </p>
            </div>
          </div>
          
          <div style={{ position: 'absolute', bottom: '48px', left: '48px', textAlign: 'left' }}>
            <p style={{ color: '#737373', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: 0 }}>
              Identifiant de connexion
            </p>
            <p style={{
              fontSize: '36px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '0.1em',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '12px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'inline-block',
              margin: 0
            }}>
              {initialTv.id}
            </p>
          </div>

          <div style={{ position: 'absolute', bottom: '48px', right: '48px', textAlign: 'right' }}>
            <p style={{ fontSize: '64px', fontWeight: '300', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', margin: 0 }}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p style={{ fontSize: '20px', color: '#a3a3a3', fontWeight: '500', marginTop: '8px', margin: 0 }}>
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '48px',
            left: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            padding: '8px 16px',
            borderRadius: '9999px',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              En Ligne &bull; Connecté au Serveur
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
