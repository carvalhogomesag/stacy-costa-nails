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
  Plus 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { CLIENT_ID } from '../constants';
import { COPY } from '../copy';
import { Service, Appointment } from '../types';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  initialData?: Appointment | null;
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ isOpen, onClose, services, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        clientName: initialData.clientName,
        clientPhone: initialData.clientPhone,
        serviceId: initialData.serviceId,
        date: initialData.date,
        startTime: initialData.startTime
      });
    } else {
      setFormData({
        clientName: '',
        clientPhone: '',
        serviceId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '11:00'
      });
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

    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) {
      alert("Por favor, selecione um serviço.");
      setLoading(false);
      return;
    }

    try {
      const [h, m] = formData.startTime.split(':').map(Number);
      const startInMinutes = h * 60 + m;
      const endInMinutes = startInMinutes + selectedService.duration;
      const endTime = `${Math.floor(endInMinutes / 60).toString().padStart(2, '0')}:${(endInMinutes % 60).toString().padStart(2, '0')}`;

      const appointmentData = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: formData.date,
        startTime: formData.startTime,
        endTime: endTime,
        updatedAt: serverTimestamp()
      };

      if (initialData?.id) {
        const docRef = doc(db, "businesses", CLIENT_ID, "appointments", initialData.id);
        await updateDoc(docRef, appointmentData);
      } else {
        await addDoc(collection(db, "businesses", CLIENT_ID, "appointments"), {
          ...appointmentData,
          createdAt: serverTimestamp()
        });
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay com Blur Semântico */}
      <div className="fixed inset-0 bg-brand-footer/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-brand-card w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-[210]">
        
        {/* Header Estilo Admin Premium */}
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
                {initialData ? 'Editar Registo' : 'Painel de Gestão'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6 bg-brand-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nome do Cliente */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <User size={12} className="text-primary" /> {COPY.bookingModal.placeholders.name}
              </label>
              <input 
                required
                type="text"
                placeholder="Ex: Maria Silva"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium"
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
              />
            </div>

            {/* Telemóvel */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Phone size={12} className="text-primary" /> {COPY.bookingModal.placeholders.phone}
              </label>
              <input 
                required
                type="tel"
                placeholder="9xx xxx xxx"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium"
                value={formData.clientPhone}
                onChange={e => setFormData({...formData, clientPhone: e.target.value})}
              />
            </div>
          </div>

          {/* Seleção de Serviço */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
              <Scissors size={12} className="text-primary" /> {COPY.admin.dashboard.tabs.services}
            </label>
            <select 
              required
              className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary focus:bg-white transition-all appearance-none font-medium"
              value={formData.serviceId}
              onChange={e => setFormData({...formData, serviceId: e.target.value})}
            >
              <option value="">Selecione um serviço...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Data */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Calendar size={12} className="text-primary" /> Data
              </label>
              <input 
                required
                type="date"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary focus:bg-white transition-all font-medium"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            {/* Hora de Início */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1 flex items-center gap-2 tracking-widest">
                <Clock size={12} className="text-primary" /> Início
              </label>
              <select 
                required
                className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-primary-dark outline-none focus:border-primary focus:bg-white transition-all appearance-none font-medium text-center"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            {initialData && (
              <button 
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-none p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                title="Eliminar marcação"
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