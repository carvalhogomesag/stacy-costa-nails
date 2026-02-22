import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Phone, 
  Calendar, 
  TrendingUp, 
  User,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useCustomers } from '../../../hooks/useCustomers';
import { COPY } from '../../../copy';
import { CustomerTag, Customer } from '../../../types';
import { formatCurrency } from '../../../utils/cashCalculations';

interface CustomerListProps {
  onSelectCustomer: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onSelectCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<CustomerTag | 'ALL'>('ALL');

  const { customers, loading, totalCount } = useCustomers(searchTerm, activeTag);

  // Helper para cores das Tags
  const getTagStyle = (tag: CustomerTag) => {
    switch (tag) {
      case CustomerTag.VIP: return 'bg-amber-100 text-amber-700 border-amber-200';
      case CustomerTag.New: return 'bg-blue-100 text-blue-700 border-blue-200';
      case CustomerTag.ChurnRisk: return 'bg-red-100 text-red-700 border-red-200';
      case CustomerTag.NoShowRecurrent: return 'bg-rose-100 text-rose-700 border-rose-200';
      case CustomerTag.HotLead: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BARRA DE FERRAMENTAS (BUSCA E FILTROS) */}
      <div className="bg-brand-card border border-stone-100 p-4 rounded-3xl shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text"
            placeholder={COPY.admin.crm.list.searchPlaceholder}
            className="w-full bg-stone-50 border-stone-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter size={14} className="text-stone-400 shrink-0 ml-1" />
          <button 
            onClick={() => setActiveTag('ALL')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTag === 'ALL' 
              ? 'bg-primary border-primary text-white shadow-md' 
              : 'bg-white border-stone-100 text-stone-400 hover:border-primary/30'
            }`}
          >
            Todos
          </button>
          {Object.values(CustomerTag).map((tag) => (
            <button 
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                activeTag === tag 
                ? 'bg-primary border-primary text-white shadow-md' 
                : 'bg-white border-stone-100 text-stone-400 hover:border-primary/30'
              }`}
            >
              {(COPY.admin.crm.tags as any)[tag] || tag}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
            {COPY.admin.crm.list.totalLabel}: <span className="text-primary">{totalCount}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-brand-card border border-dashed border-stone-200 rounded-[2rem] py-20 text-center">
            <AlertCircle className="mx-auto text-stone-200 mb-3" size={40} />
            <p className="text-stone-400 italic text-sm">{COPY.admin.crm.list.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {customers.map((customer) => (
              <div 
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id!)}
                className="bg-brand-card border border-stone-100 p-4 md:p-5 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar/Ícone */}
                  <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User size={24} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-bold text-primary-dark truncate">
                        {customer.name}
                      </h4>
                      <div className="flex gap-1">
                        {customer.tags.map(tag => (
                          <span key={tag} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getTagStyle(tag)}`}>
                            {(COPY.admin.crm.tags as any)[tag] || tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Phone size={10} className="text-primary"/> {customer.phone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar size={10} className="text-primary"/> {customer.stats.appointmentsCount} Visitas</span>
                    </div>
                  </div>
                </div>

                {/* Stats Rápidas */}
                <div className="flex items-center gap-6 ml-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">{COPY.admin.crm.profile.stats.ltv}</p>
                    <p className="text-sm font-black text-primary-dark">{formatCurrency(customer.stats.totalSpent)}</p>
                  </div>
                  <ChevronRight className="text-stone-200 group-hover:text-primary transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;