import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, X, Loader2, Heart } from 'lucide-react';
import { BUSINESS_INFO } from '../constants';
import { COPY } from '../copy';

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

  // REGRA DE OURO: Se não estiver aberto, o componente não injeta nada no DOM
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
      setError(COPY.admin.login.error);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
      {/* BACKGROUND ESFUMADO - FIXED PARA COBRIR TODO O ECRÃ */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-brand-footer border border-primary/30 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 z-[210]">
        {/* Botão Fechar */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>

        {/* Cabeçalho do Login */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary/20">
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-serif text-white font-bold uppercase tracking-tight">
            {COPY.admin.login.title}
          </h2>
          <p className="text-primary-light text-[10px] mt-2 font-bold uppercase tracking-[0.3em]">
            {BUSINESS_INFO.name} {BUSINESS_INFO.subName}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl text-center font-bold animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Input Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
              <input 
                type="email" 
                placeholder="Email do administrador"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-primary transition-all font-medium placeholder:text-stone-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Input Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
              <input 
                type="password" 
                placeholder="Palavra-passe"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-primary transition-all font-medium placeholder:text-stone-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Botão de Submissão */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/10 flex justify-center items-center gap-2 uppercase tracking-[0.2em] text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : COPY.admin.login.button}
          </button>
        </form>

        {/* Rodapé do Login */}
        <p className="text-center text-stone-600 text-[10px] mt-8 uppercase tracking-[0.5em] font-bold">
          {BUSINESS_INFO.name} • {COPY.footer.devTag}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;