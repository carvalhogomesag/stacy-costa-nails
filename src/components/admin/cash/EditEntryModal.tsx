import React, { useState, useEffect, useMemo } from 'react';
import { X, Pencil, Loader2, Euro, AlignLeft, History, AlertCircle, Clock, User, ArrowRight } from 'lucide-react';
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
  const [newDescription, setNewDescription] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (entry) {
      setNewAmount(entry.amount.toString());
      setNewDescription(entry.description || '');
      setReason('');
      setError(null);
    }
  }, [entry, isOpen]);

  // Verifica se houve alguma alteração real para habilitar o botão
  const hasChanges = useMemo(() => {
    if (!entry) return false;
    const amountChanged = parseFloat(newAmount.replace(',', '.')) !== entry.amount;
    const descriptionChanged = newDescription.trim() !== entry.description;
    return amountChanged || descriptionChanged;
  }, [newAmount, newDescription, entry]);

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
        { 
          amount: amountValue,
          description: newDescription.trim() 
        }, 
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
        
        {/* Header com Identidade de Auditoria */}
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
                Rasto de Alterações Ativo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
          
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-800 leading-relaxed font-medium">
              A alteração de registos passados gera um anexo de auditoria no relatório para o contabilista.
            </div>
          </div>

          {/* EDIÇÃO DE VALOR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 opacity-60">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                {COPY.admin.cash.editModal.labelOriginal}
              </label>
              <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 text-lg font-bold text-stone-500 line-through">
                {formatCurrency(entry.amount)}
              </div>
            </div>

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

          {/* EDIÇÃO DE DESCRIÇÃO */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
              Descrição do Movimento
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-stone-400" size={18} />
              <textarea 
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 pl-12 text-sm font-bold text-primary-dark outline-none focus:border-primary transition-all resize-none"
              />
            </div>
            {newDescription.trim() !== entry.description && (
               <p className="text-[9px] text-stone-400 italic px-2">Original: <span className="line-through">{entry.description}</span></p>
            )}
          </div>

          {/* JUSTIFICAÇÃO OBRIGATÓRIA */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Pencil size={12} className="text-primary" /> 
              {COPY.admin.cash.editModal.labelReason} *
            </label>
            <textarea 
              required
              rows={2}
              placeholder={COPY.admin.cash.editModal.placeholderReason}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-stone-50 border-2 border-amber-200 rounded-2xl p-4 text-sm font-medium text-primary-dark outline-none focus:border-amber-500 transition-all resize-none shadow-inner"
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center font-bold animate-pulse">{error}</p>}

          <button 
            type="submit"
            disabled={loading || !reason || !hasChanges}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : COPY.admin.cash.editModal.submit}
          </button>

          {/* RELATÓRIO DE MODIFICAÇÕES (AUDIT TRAIL) */}
          {entry.history && entry.history.length > 0 && (
            <div className="pt-4 mt-2 border-t border-stone-100">
               <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <History size={14} /> {COPY.admin.cash.editModal.historyTitle}
               </h4>
               <div className="space-y-4">
                  {entry.history.map((log, idx) => (
                    <div key={idx} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 relative overflow-hidden">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-stone-100">
                            <Clock size={10} /> {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString('pt-PT') : 'Agora'}
                          </span>
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] font-black text-amber-600">
                               {formatCurrency(log.previousAmount)} <ArrowRight size={8} className="inline mx-1" /> {formatCurrency(log.newAmount)}
                             </span>
                          </div>
                       </div>
                       
                       {log.previousDescription !== log.newDescription && (
                         <div className="mb-2 p-2 bg-white/50 rounded-lg border border-stone-50">
                            <p className="text-[9px] text-stone-400 line-through leading-tight mb-1">{log.previousDescription}</p>
                            <p className="text-[10px] text-primary-dark font-bold leading-tight">{log.newDescription}</p>
                         </div>
                       )}

                       <div className="flex gap-2 items-start bg-amber-50/50 p-2 rounded-lg">
                          <AlignLeft size={10} className="text-amber-500 mt-1 shrink-0" />
                          <p className="text-[11px] text-amber-900 italic leading-snug">"{log.reason}"</p>
                       </div>
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