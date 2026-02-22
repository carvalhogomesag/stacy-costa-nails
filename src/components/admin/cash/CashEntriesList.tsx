import React, { useState } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Undo2, 
  Trash2, 
  Clock,
  CalendarCheck,
  Pencil,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { CashEntry, EntryType, EntryOrigin } from '../../../types';
import { deleteCashEntry } from '../../../services/cashService';
import { COPY } from '../../../copy';
import { formatCurrency } from '../../../utils/cashCalculations';

interface CashEntriesListProps {
  entries: CashEntry[];
  onEditEntry: (entry: CashEntry) => void;
}

const CashEntriesList: React.FC<CashEntriesListProps> = ({ entries, onEditEntry }) => {
  // Estado para controlar quais detalhes de auditoria estão visíveis
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(COPY.admin.cash.list.deleteConfirm)) {
      try {
        await deleteCashEntry(id);
      } catch (error) {
        alert("Erro ao eliminar lançamento.");
      }
    }
  };

  const getTypeStyles = (type: EntryType) => {
    switch (type) {
      case EntryType.Income:
      case EntryType.AppointmentIncome:
        return { icon: <ArrowUpCircle size={18} />, color: 'text-green-500', bg: 'bg-green-50' };
      case EntryType.Expense:
        return { icon: <ArrowDownCircle size={18} />, color: 'text-red-500', bg: 'bg-red-50' };
      case EntryType.Adjustment:
        return { icon: <RefreshCw size={18} />, color: 'text-amber-500', bg: 'bg-amber-50' };
      case EntryType.Refund:
      case EntryType.AppointmentRefund:
        return { icon: <Undo2 size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' };
      default:
        return { icon: <ArrowUpCircle size={18} />, color: 'text-stone-400', bg: 'bg-stone-50' };
    }
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-stone-400 italic text-sm font-light">
          {COPY.admin.cash.list.empty}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-50">
      {entries.map((entry) => {
        const styles = getTypeStyles(entry.type);
        const isExpanded = expandedIds.has(entry.id!);
        const timeStr = entry.createdAt?.seconds 
          ? new Date(entry.createdAt.seconds * 1000).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
          : '--:--';

        return (
          <div key={entry.id} className="flex flex-col group transition-all">
            <div className="p-4 md:p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                {/* ÍCONE DE TIPO */}
                <div className={`w-10 h-10 rounded-xl ${styles.bg} ${styles.color} flex items-center justify-center shrink-0 shadow-sm`}>
                  {styles.icon}
                </div>

                {/* INFO DO LANÇAMENTO */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h5 className="text-sm font-bold text-primary-dark truncate">
                      {entry.description}
                    </h5>
                    
                    {/* TAG DE EDITADO CLICÁVEL */}
                    {entry.isEdited && (
                      <button 
                        onClick={() => toggleExpand(entry.id!)}
                        className="flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter hover:bg-amber-200 transition-colors"
                      >
                        <AlertCircle size={8} />
                        {COPY.admin.cash.list.editedTag}
                        {isExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                      </button>
                    )}

                    {entry.origin === EntryOrigin.Appointment && (
                      <CalendarCheck size={12} className="text-primary shrink-0" title="Vindo de agendamento" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] text-stone-400 uppercase font-bold tracking-widest">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {timeStr}
                    </span>
                    <span>•</span>
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                      {(COPY.admin.cash.methods as any)[entry.paymentMethod] || entry.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              {/* VALOR E AÇÕES */}
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <span className={`text-sm md:text-base font-black ${styles.color}`}>
                    {[EntryType.Expense, EntryType.Refund, EntryType.AppointmentRefund].includes(entry.type) ? '-' : '+'} 
                    {formatCurrency(entry.amount)}
                  </span>
                  {entry.isEdited && (
                    <span className="block text-[8px] text-stone-400 line-through opacity-60">
                      {formatCurrency(entry.originalAmount || 0)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => onEditEntry(entry)}
                    className="p-2 text-stone-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => entry.id && handleDelete(entry.id)}
                    className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* QUADRO DE AUDITORIA DETALHADA (EXPANSÍVEL) */}
            {entry.isEdited && isExpanded && (
              <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <History size={14} className="text-amber-600" />
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                      {COPY.admin.cash.list.auditDetails.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Comparação de Descrição */}
                    {entry.originalDescription !== entry.description && (
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-stone-400 uppercase">Contexto da Alteração</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-stone-400 line-through truncate max-w-[150px]">{entry.originalDescription}</span>
                          <ArrowRight size={10} className="text-amber-500" />
                          <span className="text-primary-dark font-bold truncate">{entry.description}</span>
                        </div>
                      </div>
                    )}

                    {/* Comparação de Valor */}
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-stone-400 uppercase">Impacto Financeiro</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-stone-400 line-through">{formatCurrency(entry.originalAmount || 0)}</span>
                        <ArrowRight size={10} className="text-amber-500" />
                        <span className="text-primary-dark font-bold">{formatCurrency(entry.amount)}</span>
                        <span className={`ml-2 font-black ${(entry.amount - (entry.originalAmount || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({(entry.amount - (entry.originalAmount || 0)) > 0 ? '+' : ''}{formatCurrency(entry.amount - (entry.originalAmount || 0))})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Motivo da última retificação */}
                  <div className="pt-3 border-t border-amber-100/50">
                    <p className="text-[8px] font-black text-stone-400 uppercase mb-1">{COPY.admin.cash.list.auditDetails.reason}</p>
                    <p className="text-xs text-amber-900 italic leading-relaxed">
                      "{entry.lastEditReason}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CashEntriesList;