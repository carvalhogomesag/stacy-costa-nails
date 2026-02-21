import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  CreditCard, 
  Smartphone, 
  ArrowRightLeft 
} from 'lucide-react';
import { CashSummary, PaymentMethod } from '../../../types';
import { COPY } from '../../../copy';
import { formatCurrency } from '../../../utils/cashCalculations';

interface CashSessionDetailsProps {
  summary: CashSummary;
  initialBalance: number;
}

const CashSessionDetails: React.FC<CashSessionDetailsProps> = ({ summary, initialBalance }) => {
  
  const getMethodIcon = (method: string) => {
    switch (method) {
      case PaymentMethod.Cash: return <Euro size={12} />;
      case PaymentMethod.Card: return <CreditCard size={12} />;
      case PaymentMethod.MBWay: return <Smartphone size={12} />;
      default: return <ArrowRightLeft size={12} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* SALDO ATUAL */}
        <div className="bg-brand-card border border-primary/20 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] text-primary/5 group-hover:scale-110 transition-transform">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">
              {COPY.admin.cash.summary.balance}
            </p>
            <h4 className="text-3xl font-black text-primary-dark tracking-tighter">
              {formatCurrency(summary.currentBalance)}
            </h4>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
              <span className="bg-stone-100 px-2 py-0.5 rounded-full">
                Fundo Inicial: {formatCurrency(initialBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* TOTAL ENTRADAS */}
        <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-inner">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-0.5">
              {COPY.admin.cash.summary.income}
            </p>
            <h4 className="text-xl font-black text-green-600">
              + {formatCurrency(summary.totalIncome)}
            </h4>
          </div>
        </div>

        {/* TOTAL SAÍDAS */}
        <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-0.5">
              {COPY.admin.cash.summary.expense}
            </p>
            <h4 className="text-xl font-black text-red-600">
              - {formatCurrency(summary.totalExpense)}
            </h4>
          </div>
        </div>
      </div>

      {/* BREAKDOWN POR MÉTODO */}
      <div className="bg-white/50 border border-stone-100 rounded-2xl p-3 flex flex-wrap items-center justify-center gap-4 md:gap-8">
        {(Object.entries(summary.totalByMethod) as [PaymentMethod, number][]).map(([method, total]) => {
          if (total === 0) return null;
          
          return (
            <div key={method} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                {getMethodIcon(method)}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stone-400 uppercase leading-none mb-0.5">
                  {(COPY.admin.cash.methods as any)[method] || method}
                </span>
                <span className="text-[11px] font-bold text-primary-dark leading-none">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CashSessionDetails;