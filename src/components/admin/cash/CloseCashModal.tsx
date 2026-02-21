import React, { useState, useMemo } from 'react';
import { X, Lock, Loader2, Euro, AlertTriangle, FileText } from 'lucide-react';
import { auth } from '../../../firebase';
import { closeCashSession } from '../../../services/cashService';
import { COPY } from '../../../copy';
import { CashSession, CashSummary } from '../../../types';
import { formatCurrency } from '../../../utils/cashCalculations';

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashSession;
  summary: CashSummary;
}

const CloseCashModal: React.FC<CloseCashModalProps> = ({ isOpen, onClose, session, summary }) => {
  const [finalBalance, setFinalBalance] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconciliation = useMemo(() => {
    const realValue = parseFloat(finalBalance.replace(',', '.')) || 0;
    const expectedValue = summary.currentBalance;
    const diff = realValue - expectedValue;
    
    return {
      realValue,
      expectedValue,
      diff,
      hasDivergence: Math.abs(diff) > 0.001
    };
  }, [finalBalance, summary.currentBalance]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) return;

    if (reconciliation.hasDivergence && !notes.trim()) {
      setError("É obrigatório justificar a divergência encontrada.");
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO: Removemos o campo 'status' daqui, pois o cashService já o define como CLOSED
      await closeCashSession(session.id!, {
        finalBalance: reconciliation.realValue,
        expectedBalance: reconciliation.expectedValue,
        divergenceAmount: reconciliation.diff,
        divergenceNotes: notes.trim(),
        closedBy: user.uid
      });

      onClose();
    } catch (err: any) {
      setError("Erro ao fechar o caixa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[210]">
        
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {COPY.admin.cash.closeModal.title}
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">
                Conferência de Valores
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          
          <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex gap-4 items-start">
             <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
             <p className="text-xs text-stone-600 leading-relaxed italic">
               {COPY.admin.cash.closeModal.instruction}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Início + Fluxo</span>
                <span className="text-sm font-bold text-stone-700">
                  {formatCurrency(session.initialBalance)} + {formatCurrency(summary.totalIncome - summary.totalExpense)}
                </span>
             </div>
             <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1">{COPY.admin.cash.summary.expected}</span>
                <span className="text-sm font-black text-primary-dark">
                  {formatCurrency(reconciliation.expectedValue)}
                </span>
             </div>
          </div>

          <div className="space-y-3 text-center py-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
              {COPY.admin.cash.closeModal.labelReal}
            </label>
            <div className="relative">
              <Euro className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
              <input 
                autoFocus
                type="text"
                inputMode="decimal"
                placeholder="0,00€"
                value={finalBalance}
                onChange={(e) => setFinalBalance(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-3xl py-6 pl-16 pr-8 text-4xl font-black text-primary-dark outline-none focus:border-primary focus:bg-white transition-all text-center"
              />
            </div>
          </div>

          {finalBalance && (
            <div className={`p-4 rounded-2xl border animate-in slide-in-from-top-2 flex items-center justify-between ${reconciliation.diff === 0 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">{COPY.admin.cash.summary.diff}</span>
              <span className="font-black">
                {reconciliation.diff > 0 ? '+' : ''}{formatCurrency(reconciliation.diff)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FileText size={14} /> {COPY.admin.cash.closeModal.labelNotes}
              {reconciliation.hasDivergence && <span className="text-red-500 font-bold">*</span>}
            </label>
            <textarea 
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 text-sm font-medium text-primary-dark outline-none focus:border-primary transition-all resize-none"
              placeholder="Ex: Diferença de 2€ no MBWay..."
            />
          </div>

          {error && <p className="text-red-600 text-xs text-center font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={loading || !finalBalance}
            className="w-full py-5 bg-primary-dark hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : COPY.admin.cash.closeModal.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CloseCashModal;