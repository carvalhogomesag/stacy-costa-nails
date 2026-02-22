import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  UserPlus, 
  Star, 
  AlertTriangle, 
  CreditCard, 
  Loader2,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { useCrmInsights } from '../../../hooks/useCrmInsights';
import { COPY } from '../../../copy';
import { formatCurrency } from '../../../utils/cashCalculations';

const CrmInsights: React.FC = () => {
  const { stats, loading, error } = useCrmInsights();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-primary">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-xs">
          A processar inteligência de dados...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-red-800 font-bold uppercase tracking-tight">Erro ao carregar insights</p>
        <p className="text-red-600 text-sm italic">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* GRID DE KPIs PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL LTV */}
        <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] text-primary/5 group-hover:scale-110 transition-transform">
            <TrendingUp size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">
              Valor da Base (LTV)
            </p>
            <h4 className="text-2xl font-black text-primary-dark tracking-tighter">
              {formatCurrency(stats.totalLTV)}
            </h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase">
               Faturamento Vitalício <ArrowUpRight size={12} />
            </div>
          </div>
        </div>

        {/* TICKET MÉDIO */}
        <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <CreditCard size={20} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
              {COPY.admin.crm.profile.stats.avgTicket}
            </p>
          </div>
          <h4 className="text-2xl font-black text-primary-dark tracking-tighter">
            {formatCurrency(stats.averageTicket)}
          </h4>
          <p className="text-[10px] text-stone-400 mt-1 italic">Média por atendimento</p>
        </div>

        {/* TAXA DE CHURN / RISCO */}
        <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <AlertTriangle size={20} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
              Taxa de Risco
            </p>
          </div>
          <h4 className="text-2xl font-black text-red-600 tracking-tighter">
            {stats.churnRate.toFixed(1)}%
          </h4>
          <p className="text-[10px] text-stone-400 mt-1 italic">Clientes sem retorno há +60 dias</p>
        </div>

        {/* NOVOS CLIENTES */}
        <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <UserPlus size={20} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
              Novos este Mês
            </p>
          </div>
          <h4 className="text-2xl font-black text-primary-dark tracking-tighter">
            +{stats.newThisMonth}
          </h4>
          <p className="text-[10px] text-stone-400 mt-1 italic">Crescimento da base</p>
        </div>
      </div>

      {/* SECÇÃO DE SAÚDE DA BASE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CLIENTES VIP VS EM RISCO */}
        <div className="bg-brand-card border border-stone-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-primary-dark font-bold uppercase tracking-tight flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Saúde da Base de Clientes
            </h4>
          </div>

          <div className="space-y-5">
             <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                      <Star size={24} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-primary-dark">Clientes VIP</p>
                      <p className="text-[10px] text-stone-400 uppercase">Fidelizados e Alta Receita</p>
                   </div>
                </div>
                <span className="text-xl font-black text-primary">{stats.vipCount}</span>
             </div>

             <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between group hover:border-red-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                      <AlertTriangle size={24} />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-primary-dark">Em Risco de Abandono</p>
                      <p className="text-[10px] text-stone-400 uppercase">Necessitam reativação imediata</p>
                   </div>
                </div>
                <span className="text-xl font-black text-red-600">{stats.inRiskCount}</span>
             </div>
          </div>
        </div>

        {/* INFO DE APOIO À DECISÃO */}
        <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] flex flex-col justify-center text-center">
           <BarChart3 className="mx-auto text-primary mb-4 opacity-50" size={48} />
           <h4 className="text-primary-dark font-serif text-xl font-bold mb-2">Dica Estratégica</h4>
           <p className="text-stone-500 text-sm font-light leading-relaxed max-w-sm mx-auto">
             O seu ticket médio é de <span className="font-bold text-primary">{formatCurrency(stats.averageTicket)}</span>. 
             Para aumentar o LTV, considere criar campanhas para os <span className="font-bold text-primary">{stats.inRiskCount} clientes</span> que não visitam o espaço há mais de 60 dias.
           </p>
        </div>
      </div>
    </div>
  );
};

export default CrmInsights;