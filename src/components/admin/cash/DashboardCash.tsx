import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Lock, 
  Loader2, 
  History, 
  Download,
  Calendar,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useCashSession } from '../../../hooks/useCashSession';
import { COPY } from '../../../copy';
import { formatCurrency, calculateCashSummary } from '../../../utils/cashCalculations';
import { getClosedCashSessions, getEntriesForExport } from '../../../services/cashService';
import { exportEntriesToCSV } from '../../../utils/exportUtils';
import { exportEntriesToPDF } from '../../../utils/pdfUtils';
import { CashSession, CashEntry } from '../../../types';

// Sub-componentes
import OpenCashModal from './OpenCashModal';
import CashEntryModal from './CashEntryModal';
import CloseCashModal from './CloseCashModal';
import EditEntryModal from './EditEntryModal'; // NOVO: Modal de Auditoria
import CashSessionDetails from './CashSessionDetails';
import CashEntriesList from './CashEntriesList';

const DashboardCash: React.FC = () => {
  const { currentSession, entries, summary, loading: sessionLoading } = useCashSession();
  
  // --- NAVEGAÇÃO INTERNA ---
  const [activeSubTab, setActiveSubTab] = useState<'current' | 'history'>('current');

  // --- CONTROLO DE MODAIS ---
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  
  // --- ESTADOS PARA EDIÇÃO/AUDITORIA ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashEntry | null>(null);

  // --- ESTADOS DE HISTÓRICO (FASE 3) ---
  const [closedSessions, setClosedSessions] = useState<CashSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'history') {
      loadHistory();
    }
  }, [activeSubTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getClosedCashSessions(30); 
      setClosedSessions(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // HANDLER: Acionar Edição com Auditoria
  const handleEditEntry = (entry: CashEntry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  // EXPORTAÇÃO CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const sessionIds = closedSessions.map(s => s.id!);
      if (currentSession?.id) sessionIds.push(currentSession.id);
      
      const entriesToExport = await getEntriesForExport(sessionIds);
      exportEntriesToCSV(entriesToExport);
    } catch (error) {
      alert("Erro ao exportar CSV.");
    } finally {
      setExporting(false);
    }
  };

  // EXPORTAÇÃO PDF
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const sessionIds = closedSessions.map(s => s.id!);
      if (currentSession?.id) sessionIds.push(currentSession.id);
      
      const entriesToExport = await getEntriesForExport(sessionIds);
      
      const firstBalance = closedSessions[closedSessions.length - 1]?.initialBalance || currentSession?.initialBalance || 0;
      const exportSummary = calculateCashSummary(firstBalance, entriesToExport);

      exportEntriesToPDF(entriesToExport, exportSummary, "Relatório Geral (30 dias)");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-primary">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-xs">
          A carregar finanças...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* SELETOR DE ABA (Sessão vs Histórico) */}
      <div className="flex bg-stone-100 p-1 rounded-2xl w-full sm:w-max">
        <button 
          onClick={() => setActiveSubTab('current')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
            activeSubTab === 'current' ? 'bg-white text-primary shadow-sm' : 'text-stone-400'
          }`}
        >
          {COPY.admin.cash.tabs.current}
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
            activeSubTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-stone-400'
          }`}
        >
          {COPY.admin.cash.tabs.history}
        </button>
      </div>

      {activeSubTab === 'current' ? (
        <>
          {!currentSession ? (
            /* CAIXA FECHADO */
            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-12 px-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
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
                className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center gap-3"
              >
                <Plus size={20} strokeWidth={3} />
                {COPY.admin.cash.btnOpen}
              </button>
            </div>
          ) : (
            /* CAIXA ABERTO */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="text-primary-dark font-bold text-xl uppercase tracking-tight">{COPY.admin.cash.title}</h3>
                  </div>
                  <p className="text-stone-500 text-xs font-medium uppercase tracking-[0.2em]">
                    {COPY.admin.cash.subtitle} • {new Date(currentSession.openingDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEntryModalOpen(true)} className="flex-1 md:flex-none bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Plus size={18} /> {COPY.admin.cash.btnNewEntry}
                  </button>
                  <button onClick={() => setIsCloseModalOpen(true)} className="flex-1 md:flex-none bg-white border border-stone-200 text-stone-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Lock size={18} /> {COPY.admin.cash.btnClose}
                  </button>
                </div>
              </div>

              <CashSessionDetails summary={summary} initialBalance={currentSession.initialBalance} />

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
                {/* INJETADA A PROP DE EDIÇÃO */}
                <CashEntriesList entries={entries} onEditEntry={handleEditEntry} />
              </div>
            </div>
          )}
        </>
      ) : (
        /* ABA HISTÓRICO */
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-primary-dark font-bold text-xl uppercase tracking-tight">{COPY.admin.cash.history.title}</h3>
                <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest italic">Análise de performance contabilidade</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleExportCSV}
                  disabled={exporting || (closedSessions.length === 0 && !currentSession)}
                  className="bg-stone-100 text-stone-600 border border-stone-200 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-stone-200 transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  <Download size={16} /> CSV
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={exporting || (closedSessions.length === 0 && !currentSession)}
                  className="bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary hover:text-white transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  {COPY.admin.cash.history.exportPdf}
                </button>
              </div>
           </div>

           {historyLoading ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
           ) : closedSessions.length === 0 ? (
             <div className="bg-brand-card border border-dashed border-stone-200 rounded-[2rem] p-20 text-center text-stone-400 italic">
                {COPY.admin.cash.history.empty}
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-3">
               {closedSessions.map((session) => (
                 <div key={session.id} className="bg-brand-card border border-stone-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-primary transition-colors shadow-inner">
                          <Calendar size={24} />
                       </div>
                       <div>
                          <h4 className="text-primary-dark font-bold text-base">
                            {new Date(session.openingDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </h4>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">
                             Saldo Final: {formatCurrency(session.finalBalance || 0)}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">{COPY.admin.cash.summary.diff}</span>
                          <span className={`text-xs font-bold ${session.divergenceAmount === 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {session.divergenceAmount && session.divergenceAmount > 0 ? '+' : ''}{formatCurrency(session.divergenceAmount || 0)}
                          </span>
                       </div>
                       <ChevronRight className="text-stone-200 group-hover:text-primary transition-all" size={20} />
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* MODAIS */}
      <OpenCashModal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)} />
      
      {currentSession && (
        <>
          <CashEntryModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} sessionId={currentSession.id!} />
          <CloseCashModal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} session={currentSession} summary={summary} />
          
          {/* MODAL DE AUDITORIA DE EDIÇÃO */}
          <EditEntryModal 
            isOpen={isEditModalOpen} 
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedEntry(null);
            }} 
            entry={selectedEntry} 
          />
        </>
      )}
    </div>
  );
};

export default DashboardCash;