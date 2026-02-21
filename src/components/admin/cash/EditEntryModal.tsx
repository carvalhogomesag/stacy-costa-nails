import React, { useState, useEffect, useMemo } from 'react';
import { X, Pencil, Loader2, Euro, AlignLeft, History, AlertCircle, Clock, User } from 'lucide-react';
import { auth } from '../../../firebase';
import { updateCashEntry } from '../../../services/cashService';
import { COPY } from '../../../copy';
import { CashEntry } from '../../../types';
import { formatCurrency } from '../../../utils/cashCalculations';

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CashEntry | null;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ isOpen, onClose, entry }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do Formulário
  const [newAmount, setNewAmount] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (entry) {
      setNewAmount(entry.amount.toString());
      setReason('');
      setError(null);
    }
  }, [entry, isOpen]);

  // Cálculo da diferença visual
  const diff = useMemo(() => {
    if (!entry) return 0;
    const val = parseFloat(newAmount.replace(',', '.')) || 0;
    return val - entry.amount;
  }, [newAmount, entry]);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) return;

    const amountValue = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue < 0) {
      setError("Insira um valor válido.");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Por favor, forneça um motivo detalhado para a retificação.");
      return;
    }

    setLoading(true);
    try {
      await updateCashEntry(
        entry.id!, 
        { amount: amountValue }, 
        reason.trim(), 
        user.uid
      );
      onClose();
    } catch (err: any) {
      setError("Erro ao atualizar o movimento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[260]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
              <Pencil size={24} />
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {COPY.admin.cash.editModal.title}
              </h2>
              <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                Auditoria de Movimento
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
          
          {/* Alerta de Impacto */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-800 leading-relaxed">
              Está a alterar um registo financeiro. Esta ação ficará registada permanentemente no histórico da sessão.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor Original */}
            <div className="space-y-1.5 opacity-60">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                {COPY.admin.cash.editModal.labelOriginal}
              </label>
              <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 text-lg font-bold text-stone-500 line-through">
                {formatCurrency(entry.amount)}
              </div>
            </div>

            {/* Novo Valor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                {COPY.admin.cash.editModal.labelNew}
              </label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input 
                  autoFocus
                  type="text" 
                  inputMode="decimal"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 pl-12 text-lg font-black text-primary-dark outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Motivo Obrigatório */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <AlignLeft size={14} className="text-primary" /> 
              {COPY.admin.cash.editModal.labelReason} *
            </label>
            <textarea 
              required
              rows={2}
              placeholder={COPY.admin.cash.editModal.placeholderReason}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 text-sm font-medium text-primary-dark outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={loading || !reason || newAmount === entry.amount.toString()}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : COPY.admin.cash.editModal.submit}
          </button>

          {/* HISTÓRICO DE ALTERAÇÕES (Se existir) */}
          {entry.history && entry.history.length > 0 && (
            <div className="pt-4 mt-2 border-t border-stone-100">
               <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <History size={14} /> {COPY.admin.cash.editModal.historyTitle}
               </h4>
               <div className="space-y-3">
                  {entry.history.map((log, idx) => (
                    <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                            <Clock size={10} /> {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString('pt-PT') : 'Recém-editado'}
                          </span>
                          <span className="text-[9px] font-black text-amber-600">
                            {formatCurrency(log.previousAmount)} → {formatCurrency(log.newAmount)}
                          </span>
                       </div>
                       <p className="text-[11px] text-stone-600 italic leading-tight">"{log.reason}"</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditEntryModal;