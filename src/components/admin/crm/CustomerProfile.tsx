import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CreditCard, 
  User, 
  Tag, 
  MessageSquare, 
  Heart,
  Loader2,
  AlertCircle,
  Smartphone,
  Mail,
  Zap,
  CheckCircle2,
  XCircle,
  Edit3
} from 'lucide-react';
import { db } from '../../../firebase';
import { doc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { CLIENT_ID } from '../../../constants';
import { COPY } from '../../../copy';
import { Customer, CustomerTimelineEvent, CrmEventType } from '../../../types';
import { formatCurrency } from '../../../utils/cashCalculations';

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'info' | 'finance' | 'prefs'>('timeline');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Escutar Dados do Cliente e Timeline (Realtime)
  useEffect(() => {
    setLoading(true);
    
    // Doc do Cliente
    const customerRef = doc(db, "businesses", CLIENT_ID, "customers", customerId);
    const unsubCustomer = onSnapshot(customerRef, (snap) => {
      if (snap.exists()) {
        setCustomer({ id: snap.id, ...snap.data() } as Customer);
      }
      setLoading(false);
    });

    // Eventos da Timeline
    const eventsRef = collection(db, "businesses", CLIENT_ID, "crmEvents");
    const q = query(
      eventsRef, 
      where("customerId", "==", customerId), 
      orderBy("createdAt", "desc")
    );
    const unsubTimeline = onSnapshot(q, (snap) => {
      setTimeline(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerTimelineEvent)));
    });

    return () => { unsubCustomer(); unsubTimeline(); };
  }, [customerId]);

  // Helper para ícones da Timeline
  const getEventIcon = (type: CrmEventType) => {
    switch (type) {
      case CrmEventType.AppointmentCreated: return <Calendar className="text-blue-500" size={16} />;
      case CrmEventType.AppointmentDone: return <CheckCircle2 className="text-green-500" size={16} />;
      case CrmEventType.AppointmentCanceled: return <XCircle className="text-red-500" size={16} />;
      case CrmEventType.PaymentReceived: return <TrendingUp className="text-emerald-500" size={16} />;
      case CrmEventType.ManualEdit: return <Edit3 className="text-amber-500" size={16} />;
      case CrmEventType.CampaignSent: return <Zap className="text-purple-500" size={16} />;
      default: return <Clock className="text-stone-400" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-primary">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-stone-500 font-medium tracking-widest uppercase text-xs">Carregando perfil 360°...</p>
      </div>
    );
  }

  if (!customer) return <div className="p-10 text-center text-red-500">Cliente não encontrado.</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      {/* CABEÇALHO DO PERFIL */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-white border border-stone-200 rounded-2xl text-stone-500 hover:text-primary transition-all shadow-sm active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-2xl font-serif font-bold text-primary-dark tracking-tight uppercase">
            {customer.name}
          </h3>
          <div className="flex gap-2 mt-1">
            {customer.tags.map(tag => (
              <span key={tag} className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {(COPY.admin.crm.tags as any)[tag] || tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PAINEL DE ESTATÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: COPY.admin.crm.profile.stats.ltv, value: formatCurrency(customer.stats.totalSpent), icon: TrendingUp, color: 'text-emerald-600' },
          { label: COPY.admin.crm.profile.stats.visits, value: customer.stats.appointmentsCount, icon: Calendar, color: 'text-blue-600' },
          { label: COPY.admin.crm.profile.stats.avgTicket, value: formatCurrency(customer.stats.averageTicket), icon: CreditCard, color: 'text-amber-600' },
          { label: COPY.admin.crm.profile.stats.noShow, value: customer.stats.noShowCount, icon: AlertCircle, color: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-brand-card border border-stone-100 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-stone-300" />
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className={`text-lg font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ABAS INTERNAS */}
      <div className="flex bg-stone-100 p-1 rounded-2xl w-full border border-stone-200">
        {(Object.entries(COPY.admin.crm.profile.tabs) as [keyof typeof COPY.admin.crm.profile.tabs, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
              activeTab === id ? 'bg-white text-primary shadow-sm' : 'text-stone-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="min-h-[300px]">
        {activeTab === 'timeline' && (
          <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-100">
            {timeline.length === 0 ? (
              <div className="bg-brand-card border border-stone-100 p-12 rounded-[2rem] text-center italic text-stone-400">
                {COPY.admin.crm.profile.timeline.empty}
              </div>
            ) : (
              timeline.map((event) => (
                <div key={event.id} className="relative pl-14 group">
                  {/* Ponto na Linha */}
                  <div className="absolute left-4 top-1 w-5 h-5 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="bg-brand-card border border-stone-100 p-4 rounded-2xl shadow-sm group-hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-black text-primary-dark uppercase tracking-tight">
                        {(COPY.admin.crm.profile.timeline.eventTypes as any)[event.type] || event.title}
                      </h4>
                      <span className="text-[9px] font-bold text-stone-400">
                        {event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{event.description}</p>
                    {event.amount && (
                      <p className="mt-2 text-xs font-black text-emerald-600">
                        {formatCurrency(event.amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem] space-y-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Dados de Contacto</h4>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                   <Smartphone size={16} className="text-stone-300" />
                   <span className="font-bold">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                   <Mail size={16} className="text-stone-300" />
                   <span className="font-medium">{customer.email || 'Não registado'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                   <Heart size={16} className="text-stone-300" />
                   <span className="font-medium">Aniversário: {customer.birthday || '--/--'}</span>
                </div>
             </div>
             <div className="bg-brand-card border border-stone-100 p-6 rounded-[2rem]">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Notas Internas</h4>
                <p className="text-sm text-stone-500 italic leading-relaxed">
                   {customer.notes || 'Sem observações registadas.'}
                </p>
             </div>
          </div>
        )}

        {/* Placeholders para Finanças e Preferências - Fase 2 */}
        {['finance', 'prefs'].includes(activeTab) && (
          <div className="bg-brand-card border border-stone-100 p-12 rounded-[2rem] text-center text-stone-400 italic">
             Módulo em desenvolvimento para a próxima etapa da Fase 2.
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;