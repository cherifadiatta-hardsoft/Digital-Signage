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
          color: '#ffffff',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8%' }}>
            <MonitorPlay style={{ width: '8vw', height: '8vw', minWidth: '80px', minHeight: '80px', marginRight: '3vw' }} color="#3b82f6" />
            <div>
              <h1 style={{ fontSize: '6vw', fontWeight: 'bold', margin: '0', letterSpacing: '-0.025em', lineHeight: 1 }}>HardSoft TV</h1>
              <p style={{ fontSize: '2.5vw', color: '#60a5fa', fontWeight: '500', letterSpacing: '0.1em', marginTop: '10px', textTransform: 'uppercase', margin: 0 }}>
                {initialTv.name}
              </p>
            </div>
          </div>
          
          <div style={{ position: 'absolute', bottom: '8%', left: '8%', textAlign: 'left' }}>
            <p style={{ color: '#737373', fontSize: '1.8vw', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', margin: 0 }}>
              Identifiant de connexion
            </p>
            <p style={{
              fontSize: '3vw',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '0.1em',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '1vw 2vw',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'inline-block',
              margin: 0
            }}>
              {initialTv.id}
            </p>
          </div>

          <div style={{ position: 'absolute', bottom: '8%', right: '8%', textAlign: 'right' }}>
            <p style={{ fontSize: '5vw', fontWeight: '300', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', margin: 0, lineHeight: 1 }}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p style={{ fontSize: '2vw', color: '#a3a3a3', fontWeight: '500', marginTop: '10px', margin: 0 }}>
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '8%',
            left: '8%',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            padding: '1vw 2vw',
            borderRadius: '9999px',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ width: '1vw', minWidth: '10px', height: '1vw', minHeight: '10px', borderRadius: '50%', backgroundColor: '#4ade80', marginRight: '1vw' }}></span>
            <span style={{ fontSize: '1.5vw', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              En Ligne &bull; Connecté au Serveur
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
