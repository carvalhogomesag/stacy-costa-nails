import React, { useState } from 'react';
import { X, Wallet, Loader2, Euro } from 'lucide-react';
import { auth } from '../../../firebase';
import { openCashSession } from '../../../services/cashService';
import { COPY } from '../../../copy';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OpenCashModal: React.FC<OpenCashModalProps> = ({ isOpen, onClose }) => {
  const [initialBalance, setInitialBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const user = auth.currentUser;
    if (!user) {
      setError("Utilizador não autenticado.");
      return;
    }

    const balanceValue = parseFloat(initialBalance.replace(',', '.'));
    if (isNaN(balanceValue) || balanceValue < 0) {
      setError("Por favor, insira um valor válido para o fundo de maneio.");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await openCashSession({
        openingDate: today,
        initialBalance: balanceValue,
        createdBy: user.uid
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao abrir o caixa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[210]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {COPY.admin.cash.openModal.title}
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">
                Início de Turno
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-xl text-center font-bold animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-3 text-center">
            <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">
              {COPY.admin.cash.openModal.label}
            </label>
            
            <div className="relative">
              <Euro className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
              <input 
                autoFocus
                type="text"
                inputMode="decimal"
                placeholder={COPY.admin.cash.openModal.placeholder}
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-3xl py-6 pl-16 pr-8 text-3xl font-black text-primary-dark outline-none focus:border-primary focus:bg-white transition-all placeholder:text-stone-300"
              />
            </div>
            <p className="text-stone-400 text-[10px] italic">
              * Insira o valor total em moedas e notas disponíveis na gaveta.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading || !initialBalance}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl shadow-primary/10 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : COPY.admin.cash.openModal.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpenCashModal;