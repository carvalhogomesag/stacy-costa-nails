import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  Lock, 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  History 
} from 'lucide-react';
import { useCashSession } from '../../../hooks/useCashSession';
import { COPY } from '../../../copy';
import { formatCurrency } from '../../../utils/cashCalculations';

// Sub-componentes (Vamos criá-los nos próximos passos)
import OpenCashModal from './OpenCashModal';
import CashEntryModal from './CashEntryModal';
import CloseCashModal from './CloseCashModal';
import CashSessionDetails from './CashSessionDetails';
import CashEntriesList from './CashEntriesList';

const DashboardCash: React.FC = () => {
  const { currentSession, entries, summary, loading } = useCashSession();
  
  // Estados para controlo de Modais
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-primary">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-xs">
          A carregar finanças...
        </p>
      </div>
    );
  }

  // ESTADO: CAIXA FECHADO
  if (!currentSession) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-12 px-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-inner">
          <Wallet size={48} />
        </div>
        <h3 className="text-2xl font-serif font-bold text-primary-dark mb-2 text-center">
          {COPY.admin.cash.title}
        </h3>
        <p className="text-stone-500 text-center max-w-md mb-8 font-light">
          {COPY.admin.cash.noSession}
        </p>
        
        <button 
          onClick={() => setIsOpenModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center gap-3"
        >
          <Plus size={20} strokeWidth={3} />
          {COPY.admin.cash.btnOpen}
        </button>

        {/* Modal de Abertura */}
        <OpenCashModal 
          isOpen={isOpenModalOpen} 
          onClose={() => setIsOpenModalOpen(false)} 
        />
      </div>
    );
  }

  // ESTADO: CAIXA ABERTO
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* CABEÇALHO DA SESSÃO ATIVA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-primary-dark font-bold text-xl uppercase tracking-tight">
              {COPY.admin.cash.title}
            </h3>
          </div>
          <p className="text-stone-500 text-xs font-medium uppercase tracking-[0.2em]">
            {COPY.admin.cash.subtitle} • {new Date(currentSession.openingDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEntryModalOpen(true)}
            className="flex-1 md:flex-none bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} /> {COPY.admin.cash.btnNewEntry}
          </button>
          <button 
            onClick={() => setIsCloseModalOpen(true)}
            className="flex-1 md:flex-none bg-white border border-stone-200 text-stone-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Lock size={18} /> {COPY.admin.cash.btnClose}
          </button>
        </div>
      </div>

      {/* RESUMO FINANCEIRO (Cards) */}
      <CashSessionDetails summary={summary} initialBalance={currentSession.initialBalance} />

      {/* LISTAGEM DE MOVIMENTOS */}
      <div className="bg-brand-card border border-stone-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-50 flex items-center justify-between">
           <h4 className="text-primary-dark font-bold uppercase tracking-widest text-xs flex items-center gap-2">
             <History size={16} className="text-primary" />
             {COPY.admin.cash.list.title}
           </h4>
           <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
             {entries.length} Movimentos
           </span>
        </div>
        
        <CashEntriesList entries={entries} />
      </div>

      {/* MODAL DE NOVO LANÇAMENTO */}
      <CashEntryModal 
        isOpen={isEntryModalOpen} 
        onClose={() => setIsEntryModalOpen(false)}
        sessionId={currentSession.id!}
      />

      {/* MODAL DE FECHO DE CAIXA */}
      <CloseCashModal 
        isOpen={isCloseModalOpen} 
        onClose={() => setIsCloseModalOpen(false)}
        session={currentSession}
        summary={summary}
      />
    </div>
  );
};

export default DashboardCash;