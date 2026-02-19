import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, X, Loader2, Heart } from 'lucide-react';
import { BUSINESS_INFO } from '../constants';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError('Credenciais incorretas. Por favor, tente novamente.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-stone-900 border border-[#b5967a]/30 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#b5967a] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-[#b5967a]/20">
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-serif text-white font-bold uppercase tracking-tight">Gestão de Estética</h2>
          <p className="text-[#d4bca9] text-xs mt-2 font-bold uppercase tracking-widest">{BUSINESS_INFO.name} {BUSINESS_INFO.subName}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5967a]" size={18} />
              <input 
                type="email" 
                placeholder="Email do administrador"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#b5967a] transition-all font-medium placeholder:text-stone-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5967a]" size={18} />
              <input 
                type="password" 
                placeholder="Palavra-passe"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#b5967a] transition-all font-medium placeholder:text-stone-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#b5967a] hover:bg-[#a38569] text-white font-black rounded-2xl transition-all shadow-xl shadow-[#b5967a]/10 flex justify-center items-center gap-2 uppercase tracking-[0.2em] text-xs active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Entrar no Painel"}
          </button>
        </form>

        <p className="text-center text-stone-600 text-[10px] mt-8 uppercase tracking-[0.5em] font-bold">
          Sistema Premium • Allan Dev v3.0
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;