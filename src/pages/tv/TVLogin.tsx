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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-[450px]">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <MonitorPlay className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">HardSoft TV Client</h1>
          <p className="text-neutral-400">Connectez cet écran au serveur central</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="flex flex-col">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium text-center mb-6">
                {error}
              </div>
            )}

            <div className="flex flex-col mb-6">
              <label className="text-sm font-medium text-neutral-400 flex items-center mb-2">
                <MonitorPlay className="w-4 h-4 mr-2" />
                ID de la Smart TV
              </label>
              <input
                type="text"
                value={tvId}
                onChange={(e) => setTvId(e.target.value.toUpperCase())}
                placeholder="Ex: TV-DAKAR-001"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase tracking-wider font-mono text-base"
              />
            </div>

            <div className="flex flex-col mb-6">
              <label className="text-sm font-medium text-neutral-400 flex items-center mb-2">
                <KeyRound className="w-4 h-4 mr-2" />
                Code d'accès
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all tracking-[0.2em] font-mono text-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-3.5 text-base font-medium flex items-center justify-center transition-all mt-2 group"
            >
              Connecter l'Écran
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-500 mt-8 text-sm">
          Pour configurer une nouvelle TV, générez un code d'accès depuis le tableau de bord administrateur.
        </p>
      </div>
    </div>
  );
}
