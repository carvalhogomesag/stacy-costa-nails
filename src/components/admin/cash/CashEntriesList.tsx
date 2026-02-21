import React from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Undo2, 
  Trash2, 
  Clock,
  CalendarCheck
} from 'lucide-react';
import { CashEntry, EntryType, EntryOrigin } from '../../../types';
import { deleteCashEntry } from '../../../services/cashService';
import { COPY } from '../../../copy';
import { formatCurrency } from '../../../utils/cashCalculations';

interface CashEntriesListProps {
  entries: CashEntry[];
}

const CashEntriesList: React.FC<CashEntriesListProps> = ({ entries }) => {

  const handleDelete = async (id: string) => {
    if (window.confirm(COPY.admin.cash.list.deleteConfirm)) {
      try {
        await deleteCashEntry(id);
      } catch (error) {
        alert("Erro ao eliminar lançamento.");
      }
    }
  };

  // Helper para renderizar o ícone e cor por tipo
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
        const timeStr = entry.createdAt?.seconds 
          ? new Date(entry.createdAt.seconds * 1000).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
          : '--:--';

        return (
          <div key={entry.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors group">
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
              </div>
              
              <button 
                onClick={() => entry.id && handleDelete(entry.id)}
                className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CashEntriesList;