import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      if (email === 'malerba@rhonesolairepro.fr' && password === 'Rsp69150') {
        // Store auth in localStorage
        localStorage.setItem('crm_auth_token', 'authenticated');
        onLogin();
      } else {
        setError('Identifiants incorrects. Veuillez réessayer.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="h-16 flex items-center justify-center">
              <img
                src="https://www.rhonesolairepro.com/wp-content/uploads/2024/04/logo_rsp.svg"
                alt="Rhône Solaire Pro"
                className="h-full w-auto brightness-0 invert"
              />
            </div>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Console Pilotage</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div>
            <label className="block text-[12px] font-black text-slate-900 uppercase tracking-widest mb-3">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="malerba@rhonesolairepro.fr"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-[12px] font-black text-slate-900 uppercase tracking-widest mb-3">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 text-[13px] font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black uppercase tracking-widest text-[12px] rounded-xl hover:shadow-lg hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-slate-500 text-[11px] text-center font-bold uppercase tracking-widest">
              Accès réservé aux utilisateurs autorisés
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
            © 2026 Rhône Solaire Pro
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
