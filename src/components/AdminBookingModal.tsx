import React, { useState, useEffect } from 'react';
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
  Banknote
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getOpenCashSession, addCashEntry } from '../services/cashService';
import { CLIENT_ID } from '../constants';
import { COPY } from '../copy';
import { Service, Appointment, PaymentMethod, EntryType, EntryOrigin } from '../types';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  initialData?: Appointment | null;
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ isOpen, onClose, services, initialData }) => {
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00'
  });

  // Estados de Pagamento (Fase 2)
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [paidAmount, setPaidAmount] = useState<string>('');

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
      setPaidAmount(initialData.paidAmount?.toString() || '');
    } else {
      setFormData({
        clientName: '',
        clientPhone: '',
        serviceId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '11:00'
      });
      setIsPaid(false);
      setPaymentMethod(PaymentMethod.Cash);
      setPaidAmount('');
    }
  }, [initialData, isOpen]);

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
    
    if (!selectedService) {
      alert("Por favor, selecione um serviço.");
      setLoading(false);
      return;
    }

    // Validação de Caixa se estiver a marcar como pago agora
    let activeSessionId = '';
    if (isPaid && !initialData?.isPaid) {
      const session = await getOpenCashSession();
      if (!session) {
        alert("Não é possível marcar como pago: O CAIXA ESTÁ FECHADO. Abra o caixa na aba 'Caixa' antes de prosseguir.");
        setLoading(false);
        return;
      }
      activeSessionId = session.id!;
    }

    try {
      const [h, m] = formData.startTime.split(':').map(Number);
      const startInMinutes = h * 60 + m;
      const endInMinutes = startInMinutes + selectedService.duration;
      const endTime = `${Math.floor(endInMinutes / 60).toString().padStart(2, '0')}:${(endInMinutes % 60).toString().padStart(2, '0')}`;

      const amountToRegister = parseFloat(paidAmount.replace(',', '.')) || 0;

      const appointmentData: any = {
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
        paidAmount: isPaid ? amountToRegister : 0,
        updatedAt: serverTimestamp()
      };

      let finalApptId = initialData?.id;

      // 1. Gravar/Atualizar Agendamento
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

      // 2. Registar no Caixa se for um NOVO pagamento
      if (isPaid && !initialData?.isPaid && activeSessionId && user) {
        const entryId = await addCashEntry({
          businessId: CLIENT_ID,
          sessionId: activeSessionId,
          type: EntryType.AppointmentIncome,
          amount: amountToRegister,
          paymentMethod: paymentMethod,
          origin: EntryOrigin.Appointment,
          description: `Serviço: ${selectedService.name} - Cliente: ${formData.clientName}`,
          relatedAppointmentId: finalApptId,
          createdBy: user.uid
        });

        // Vincular a entrada ao agendamento
        const apptDoc = doc(db, "businesses", CLIENT_ID, "appointments", finalApptId!);
        await updateDoc(apptDoc, { cashEntryId: entryId });
      }

      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao processar a marcação.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm(COPY.admin.appointments.deleteConfirm)) return;

    setLoading(true);
    try {
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
        
        {/* Header */}
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
                {initialData?.isPaid ? 'SERVIÇO PAGO' : 'Painel de Gestão'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6 bg-brand-card max-h-[80vh] overflow-y-auto scrollbar-thin">
          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <User size={12} className="text-primary" /> {COPY.bookingModal.placeholders.name}
              </label>
              <input 
                required
                type="text"
                placeholder="Ex: Maria Silva"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary transition-all font-medium"
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
              />
            </div>

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
          </div>

          {/* Seleção de Serviço */}
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
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
          </div>

          {/* Data e Hora */}
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

          {/* SECÇÃO DE PAGAMENTO (Fase 2) */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
             <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${isPaid ? 'bg-green-100 text-green-600' : 'bg-stone-200 text-stone-500'}`}>
                      <CheckCircle2 size={18} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-primary-dark uppercase">Serviço Pago?</p>
                      <p className="text-[10px] text-stone-400 uppercase">Registar no Caixa</p>
                   </div>
                </div>
                <input 
                  type="checkbox"
                  checked={isPaid}
                  disabled={initialData?.isPaid} // Não permite desmarcar se já foi processado no caixa
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-6 h-6 accent-green-600 cursor-pointer"
                />
             </div>

             {isPaid && (
               <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2">
                           <CreditCard size={12} className="text-primary" /> Método
                        </label>
                        <select 
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm font-bold text-primary-dark outline-none focus:border-primary"
                        >
                           {Object.values(PaymentMethod).map(m => (
                             <option key={m} value={m}>{(COPY.admin.cash.methods as any)[m] || m}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2">
                           <Banknote size={12} className="text-primary" /> Valor Cobrado
                        </label>
                        <input 
                          type="text"
                          placeholder="0,00€"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm font-black text-primary-dark outline-none focus:border-primary"
                        />
                     </div>
                  </div>
                  {initialData?.isPaid && (
                    <p className="text-[9px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg text-center uppercase tracking-tighter">
                      Este pagamento já foi processado no caixa e não pode ser alterado aqui.
                    </p>
                  )}
               </div>
             )}
          </div>

          {/* Botões de Ação */}
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
                <><Save size={18} /> {initialData ? 'Atualizar Marcação' : 'Confirmar Agenda'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBookingModal;