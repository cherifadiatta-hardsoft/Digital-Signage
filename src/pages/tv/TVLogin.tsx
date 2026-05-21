import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { MonitorPlay, KeyRound, ArrowRight } from 'lucide-react';

export default function TVLogin() {
  const [tvId, setTvId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const tvs = useStore((state) => state.tvs);

  // Auto-redirect if already authenticated
  useEffect(() => {
    const savedToken = localStorage.getItem('tv_auth_token');
    if (savedToken) {
      const tv = tvs.find(t => t.id === savedToken);
      if (tv) navigate(`/tv/${tv.id}`);
    }
  }, [navigate, tvs]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = tvId.trim().toUpperCase();
    const cleanCode = code.trim();

    const tv = tvs.find(t => t.id === cleanId && t.code === cleanCode);
    
    if (tv) {
      localStorage.setItem('tv_auth_token', tv.id);
      navigate(`/tv/${tv.id}`);
    } else {
      setError('Identifiants incorrects. Veuillez vérifier l\'ID et le code.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      fontFamily: 'sans-serif',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#171717',
            border: '1px solid #262626',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <MonitorPlay size={40} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>HardSoft TV Client</h1>
          <p style={{ color: '#a3a3a3', margin: 0 }}>Connectez cet écran au serveur central</p>
        </div>

        <div style={{
          backgroundColor: '#171717',
          border: '1px solid #262626',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            {error && (
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#a3a3a3', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <MonitorPlay size={16} style={{ marginRight: '8px' }} />
                ID de la Smart TV
              </label>
              <input
                type="text"
                value={tvId}
                onChange={(e) => setTvId(e.target.value.toUpperCase())}
                placeholder="Ex: TV-DAKAR-001"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  outline: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#a3a3a3', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <KeyRound size={16} style={{ marginRight: '8px' }} />
                Code d'accès
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  outline: 'none',
                  letterSpacing: '0.1em',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Connecter l'Écran
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#525252', marginTop: '32px', fontSize: '14px' }}>
          Pour configurer une nouvelle TV, générez un code d'accès depuis le tableau de bord administrateur.
        </p>
      </div>
    </div>
  );
}
