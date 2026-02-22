import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Scissors, 
  Loader2, 
  Save, 
  Trash2, 
  Plus,
  CheckCircle2,
  CreditCard,
  Banknote,
  Tag,
  UserCheck
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// SERVIÇOS
import { getOpenCashSession, addCashEntry } from '../services/cashService';
import { upsertCustomer, recordCrmEvent, findCustomerByPhone } from '../services/crmService';

// CONFIG E TIPOS
import { CLIENT_ID } from '../constants';
import { COPY } from '../copy';
import { Service, Appointment, PaymentMethod, EntryType, EntryOrigin, CrmEventType } from '../types';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  initialData?: Appointment | null;
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ isOpen, onClose, services, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  
  // Estados do Formulário
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00'
  });

  // Estados de Pagamento e Financeiro
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [discount, setDiscount] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('');

  const parsePrice = (priceStr: string): number => {
    return parseFloat(priceStr.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
  };

  // 1. SINCRONIZAÇÃO DE DADOS INICIAIS
  useEffect(() => {
    if (initialData) {
      setFormData({
        clientName: initialData.clientName,
        clientPhone: initialData.clientPhone,
        serviceId: initialData.serviceId,
        date: initialData.date,
        startTime: initialData.startTime
      });
      setIsPaid(initialData.isPaid || false);
      setPaymentMethod(initialData.paymentMethod || PaymentMethod.Cash);
      setDiscount(initialData.discount?.toString() || '0');
      setPaidAmount(initialData.paidAmount?.toString() || '');
      setIsExistingCustomer(!!initialData.customerId);
    } else {
      setFormData({ clientName: '', clientPhone: '', serviceId: '', date: new Date().toISOString().split('T')[0], startTime: '11:00' });
      setIsPaid(false);
      setPaymentMethod(PaymentMethod.Cash);
      setDiscount('0');
      setPaidAmount('');
      setIsExistingCustomer(false);
    }
  }, [initialData, isOpen]);

  // 2. PESQUISA DE CLIENTE EXISTENTE (AUTO-FILL)
  useEffect(() => {
    const searchCustomer = async () => {
      if (formData.clientPhone.length >= 9 && !initialData) {
        const customer = await findCustomerByPhone(formData.clientPhone);
        if (customer) {
          setFormData(prev => ({ ...prev, clientName: customer.name }));
          setIsExistingCustomer(true);
        } else {
          setIsExistingCustomer(false);
        }
      }
    };
    searchCustomer();
  }, [formData.clientPhone, initialData]);

  // 3. LÓGICA DE AUTO-PREENCHIMENTO FINANCEIRO
  useEffect(() => {
    if (isPaid && !initialData?.isPaid && formData.serviceId) {
      const selectedService = services.find(s => s.id === formData.serviceId);
      if (selectedService) {
        const basePrice = parsePrice(selectedService.price);
        const discountValue = parseFloat(discount.replace(',', '.')) || 0;
        const finalPrice = Math.max(0, basePrice - discountValue);
        setPaidAmount(finalPrice.toFixed(2));
      }
    }
  }, [formData.serviceId, isPaid, discount, services, initialData]);

  if (!isOpen) return null;

  const timeOptions = Array.from({ length: 53 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 15;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    const selectedService = services.find(s => s.id === formData.serviceId);
    
    if (!selectedService || !user) {
      alert("Erro na validação do formulário.");
      setLoading(false);
      return;
    }

    // Validação de Caixa
    let activeSessionId = '';
    if (isPaid && !initialData?.isPaid) {
      const session = await getOpenCashSession();
      if (!session) {
        alert("Caixa Fechado! Abra o caixa antes de concluir o atendimento.");
        setLoading(false);
        return;
      }
      activeSessionId = session.id!;
    }

    try {
      // --- PASSO 1: GARANTIR ENTIDADE CLIENTE (CRM) ---
      const customerId = await upsertCustomer({
        name: formData.clientName,
        phone: formData.clientPhone,
        whatsapp: formData.clientPhone
      }, user.uid);

      const [h, m] = formData.startTime.split(':').map(Number);
      const endInMinutes = (h * 60 + m) + selectedService.duration;
      const endTime = `${Math.floor(endInMinutes / 60).toString().padStart(2, '0')}:${(endInMinutes % 60).toString().padStart(2, '0')}`;

      const finalPaidAmount = parseFloat(paidAmount.replace(',', '.')) || 0;

      const appointmentData: any = {
        customerId, // Vínculo CRM
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceColor: selectedService.color || '#f5f5f4',
        date: formData.date,
        startTime: formData.startTime,
        endTime: endTime,
        isPaid,
        paymentMethod: isPaid ? paymentMethod : null,
        paidAmount: isPaid ? finalPaidAmount : 0,
        discount: isPaid ? (parseFloat(discount.replace(',', '.')) || 0) : 0,
        basePriceSnapshot: parsePrice(selectedService.price),
        updatedAt: serverTimestamp()
      };

      let finalApptId = initialData?.id;

      // --- PASSO 2: GRAVAR AGENDAMENTO ---
      if (initialData?.id) {
        const docRef = doc(db, "businesses", CLIENT_ID, "appointments", initialData.id);
        await updateDoc(docRef, appointmentData);
      } else {
        const docRef = await addDoc(collection(db, "businesses", CLIENT_ID, "appointments"), {
          ...appointmentData,
          createdAt: serverTimestamp()
        });
        finalApptId = docRef.id;
      }

      // --- PASSO 3: REGISTAR TIMELINE (CRM EVENT) ---
      await recordCrmEvent({
        customerId,
        type: initialData ? CrmEventType.ManualEdit : CrmEventType.AppointmentCreated,
        title: initialData ? "Agendamento Editado" : "Nova Marcação Realizada",
        description: `Serviço: ${selectedService.name} para o dia ${formData.date} às ${formData.startTime}`,
        relatedId: finalApptId,
        createdBy: user.uid
      });

      // --- PASSO 4: REGISTAR NO CAIXA SE PAGO ---
      if (isPaid && !initialData?.isPaid && activeSessionId) {
        const entryId = await addCashEntry({
          businessId: CLIENT_ID,
          sessionId: activeSessionId,
          type: EntryType.AppointmentIncome,
          amount: finalPaidAmount,
          paymentMethod: paymentMethod,
          origin: EntryOrigin.Appointment,
          description: `Serviço: ${selectedService.name} - Cliente: ${formData.clientName}`,
          relatedAppointmentId: finalApptId,
          createdBy: user.uid
        });

        const apptDoc = doc(db, "businesses", CLIENT_ID, "appointments", finalApptId!);
        await updateDoc(apptDoc, { cashEntryId: entryId });

        // Evento de Pagamento na Timeline
        await recordCrmEvent({
          customerId,
          type: CrmEventType.PaymentReceived,
          title: "Pagamento Confirmado",
          description: `Recebimento via ${paymentMethod} referente ao serviço ${selectedService.name}`,
          amount: finalPaidAmount,
          relatedId: entryId,
          createdBy: user.uid
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao processar a operação.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm(COPY.admin.appointments.deleteConfirm)) return;

    setLoading(true);
    try {
      // Registo de cancelamento na Timeline antes de apagar (opcional, dependendo se queres manter o histórico de cancelados)
      if (initialData.customerId) {
        await recordCrmEvent({
          customerId: initialData.customerId,
          type: CrmEventType.AppointmentCanceled,
          title: "Agendamento Cancelado",
          description: `O agendamento do serviço ${initialData.serviceName} foi removido.`,
          createdBy: auth.currentUser?.uid || ''
        });
      }
      
      await deleteDoc(doc(db, "businesses", CLIENT_ID, "appointments", initialData.id));
      onClose();
    } catch (error) {
      alert("Erro ao eliminar.");
    } finally {
      setLoading(false);
    }
  };

  const currentServiceColor = services.find(s => s.id === formData.serviceId)?.color || 'transparent';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-brand-footer/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-brand-card w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[210]">
        
        <div className="p-6 border-b border-stone-100 bg-brand-card flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${initialData ? 'bg-primary' : 'bg-primary-dark'} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              {initialData ? <Calendar size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h2 className="text-primary-dark font-bold text-lg leading-tight uppercase tracking-tight">
                {initialData ? 'Detalhes da Marcação' : 'Nova Marcação Manual'}
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5">
                {isPaid ? 'ATENDIMENTO FINALIZADO' : isExistingCustomer ? 'CLIENTE REGISTADO' : 'NOVO CLIENTE'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6 bg-brand-card max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Telemóvel (Prioritário para pesquisa CRM) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Phone size={12} className="text-primary" /> {COPY.bookingModal.placeholders.phone}
              </label>
              <input 
                required
                type="tel"
                placeholder="9xx xxx xxx"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary transition-all font-medium"
                value={formData.clientPhone}
                onChange={e => setFormData({...formData, clientPhone: e.target.value})}
              />
            </div>

            {/* Nome do Cliente */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <User size={12} className="text-primary" /> {COPY.bookingModal.placeholders.name}
              </label>
              <div className="relative">
                <input 
                  required
                  type="text"
                  placeholder="Nome completo"
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary transition-all font-medium"
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
                {isExistingCustomer && (
                  <UserCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Scissors size={12} className="text-primary" /> {COPY.admin.dashboard.tabs.services}
              </label>
              <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: currentServiceColor }} />
            </div>
            <select 
              required
              className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary appearance-none font-medium"
              value={formData.serviceId}
              onChange={e => setFormData({...formData, serviceId: e.target.value})}
            >
              <option value="">Selecione um serviço...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.price})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Calendar size={12} className="text-primary" /> Data
              </label>
              <input 
                required
                type="date"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary font-medium"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Clock size={12} className="text-primary" /> Início
              </label>
              <select 
                required
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary appearance-none font-medium text-center"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* SECÇÃO FINANCEIRA AUTOMATIZADA */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
             <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isPaid ? 'bg-green-50 border-green-100' : 'bg-stone-50 border-stone-100'}`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${isPaid ? 'bg-green-100 text-green-600' : 'bg-stone-200 text-stone-500'}`}>
                      <CheckCircle2 size={18} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-primary-dark uppercase">Concluir Atendimento</p>
                      <p className="text-[10px] text-stone-400 uppercase">Registar entrada no caixa e CRM</p>
                   </div>
                </div>
                <input 
                  type="checkbox"
                  checked={isPaid}
                  disabled={initialData?.isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-6 h-6 accent-green-600 cursor-pointer"
                />
             </div>

             {isPaid && (
               <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2">
                           <CreditCard size={12} className="text-primary" /> Método
                        </label>
                        <select 
                          value={paymentMethod}
                          disabled={initialData?.isPaid}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm font-bold text-primary-dark outline-none focus:border-primary appearance-none"
                        >
                           {Object.values(PaymentMethod).map(m => (
                             <option key={m} value={m}>{(COPY.admin.cash.methods as any)[m] || m}</option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2">
                           <Tag size={12} className="text-primary" /> Desconto (€)
                        </label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          disabled={initialData?.isPaid}
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm font-bold text-primary-dark outline-none focus:border-primary"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2">
                           <Banknote size={12} className="text-primary" /> Valor Final
                        </label>
                        <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm font-black text-primary-dark flex items-center justify-center">
                           {paidAmount}€
                        </div>
                     </div>
                  </div>
                  
                  {initialData?.isPaid && (
                    <p className="text-[9px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg text-center uppercase tracking-tighter">
                      Pagamento já processado. Use a aba "Caixa" para estornos ou ajustes.
                    </p>
                  )}
               </div>
             )}
          </div>

          <div className="flex gap-4 pt-2">
            {initialData && (
              <button 
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-none p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95 border border-red-100"
              >
                <Trash2 size={22} />
              </button>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white font-black rounded-xl shadow-xl transition-all flex justify-center items-center gap-2 active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <><Save size={18} /> {initialData ? 'Atualizar e Guardar' : 'Confirmar Agenda'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBookingModal;