import React, { useState } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCw, Undo2, Loader2, Euro, AlignLeft, CreditCard } from 'lucide-react';
import { auth } from '../../../firebase';
import { addCashEntry } from '../../../services/cashService';
import { COPY } from '../../../copy';
import { EntryType, PaymentMethod, EntryOrigin } from '../../../types';
import { CLIENT_ID } from '../../../constants';

interface CashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

const CashEntryModal: React.FC<CashEntryModalProps> = ({ isOpen, onClose, sessionId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do Formulário
  const [type, setType] = useState<EntryType>(EntryType.Income);
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) return;

    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Insira um valor superior a zero.");
      return;
    }

    if (!description.trim()) {
      setError("A descrição é obrigatória.");
      return;
    }

    setLoading(true);
    try {
      await addCashEntry({
        businessId: CLIENT_ID,
        sessionId,
        type,
        amount: amountValue,
        paymentMethod: method,
        origin: EntryOrigin.Manual,
        description: description.trim(),
        createdBy: user.uid
      });

      // Reset e fecho
      setAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError("Erro ao registar movimento.");
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { id: EntryType.Income, label: COPY.admin.cash.entryModal.types.income, icon: ArrowUpCircle, color: 'text-green-500', bg: 'bg-green-50' },
    { id: EntryType.Expense, label: COPY.admin.cash.entryModal.types.expense, icon: ArrowDownCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { id: EntryType.Adjustment, label: COPY.admin.cash.entryModal.types.adj, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: EntryType.Refund, label: COPY.admin.cash.entryModal.types.refund, icon: Undo2, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  const paymentMethods = Object.entries(PaymentMethod).map(([key, value]) => ({
    id: value,
    label: (COPY.admin.cash.methods as any)[key] || value
  }));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[210]">
        
        <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Euro size={24} />
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {COPY.admin.cash.entryModal.title}
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5 italic">
                Registo Manual
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          {/* SELETOR DE TIPO */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
              {COPY.admin.cash.entryModal.type}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    type === opt.id 
                    ? `border-primary ${opt.bg} shadow-sm` 
                    : 'border-stone-50 hover:border-stone-100 bg-stone-50/50'
                  }`}
                >
                  <opt.icon className={type === opt.id ? opt.color : 'text-stone-400'} size={20} />
                  <span className={`text-xs font-bold ${type === opt.id ? 'text-primary-dark' : 'text-stone-500'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* VALOR E MÉTODO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                {COPY.admin.cash.entryModal.amount}
              </label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-xl font-black text-primary-dark outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                {COPY.admin.cash.entryModal.method}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary-dark outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
              {COPY.admin.cash.entryModal.desc}
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-stone-400" size={18} />
              <textarea 
                rows={2}
                placeholder={COPY.admin.cash.entryModal.placeholderDesc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-primary-dark outline-none focus:border-primary transition-all resize-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !amount || !description}
            className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : COPY.admin.cash.entryModal.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CashEntryModal;