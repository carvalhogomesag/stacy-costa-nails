// src/components/AdminLogin.tsx

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/authService'; // Serviço da Fase 1
import { 
  Lock, 
  Mail, 
  X, 
  Loader2, 
  Heart, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2 // Corrigido: Adicionado à importação
} from 'lucide-react';
import { BUSINESS_INFO } from '../constants';
import { COPY } from '../copy';
import { UserStatus } from '../types';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // REGRA DE OURO: Componente só existe no DOM se estiver aberto
  if (!isOpen) return null;

  // --- LÓGICA DE LOGIN COM VALIDAÇÃO DE PERFIL (Fase 3) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // 1. Validação primária no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Busca de Perfil no Firestore (Isolamento Multi-tenant)
      const profile = await getUserProfile(userCredential.user.uid);

      // 3. Validação de Autorização e Estado
      if (!profile) {
        // Utilizador existe no Auth mas não no sub-caminho desta empresa
        await auth.signOut();
        setError("Acesso negado: Perfil não vinculado a esta empresa.");
        return;
      }

      if (profile.status === UserStatus.INACTIVE) {
        // Utilizador desativado pelo administrador
        await auth.signOut();
        setError("A vossa conta encontra-se inativa. Contacte a gerência.");
        return;
      }

      // Sucesso: Fecha modal e ativa dashboard
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(COPY.admin.login.error);
      setPassword(''); // Limpa campo de senha por precaução
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Introduza o email primeiro para receber o link de recuperação.");
      return;
    }

    setResetLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Email enviado com sucesso! Verifique a sua caixa de entrada.");
    } catch (err: any) {
      setError("Erro ao enviar pedido. Verifique o email introduzido.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-hidden">
      {/* OVERLAY ESFUMADO PREMIUM */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />
      
      <div className="relative bg-brand-footer border border-primary/30 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-300 z-[260]">
        
        {/* BOTÃO FECHAR */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-stone-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full"
        >
          <X size={24} />
        </button>

        {/* CABEÇALHO COM BRANDING */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-primary/20 transform -rotate-6">
            <Heart size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-serif text-white font-bold uppercase tracking-tight">
            {COPY.admin.login.title}
          </h2>
          <p className="text-primary-light text-[10px] mt-2 font-bold uppercase tracking-[0.3em]">
            {BUSINESS_INFO.name} • Gestão Profissional
          </p>
        </div>

        {/* FEEDBACK DE ERRO */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] p-4 rounded-xl flex items-center gap-3 animate-in shake duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-bold uppercase tracking-tight">{error}</span>
          </div>
        )}

        {/* FEEDBACK DE INFORMAÇÃO/SUCESSO */}
        {info && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="font-bold uppercase tracking-tight">{info}</span>
          </div>
        )}

        {/* FORMULÁRIO DE ACESSO */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Email profissional"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-primary focus:bg-black/60 transition-all font-medium placeholder:text-stone-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Palavra-passe"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:border-primary focus:bg-black/60 transition-all font-medium placeholder:text-stone-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end px-1">
            <button 
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-primary transition-colors flex items-center gap-2"
            >
              {resetLoading ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
              Esqueci-me da senha
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/10 flex justify-center items-center gap-2 uppercase tracking-[0.2em] text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : COPY.admin.login.button}
          </button>
        </form>

        <p className="text-center text-stone-700 text-[9px] mt-10 uppercase tracking-[0.5em] font-bold">
          SISTEMA DE GESTÃO SEGURO • {BUSINESS_INFO.name}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;