// src/services/crmMarketingService.ts

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_ID } from '../constants';
import { 
  CrmTemplate, 
  CrmAutomation, 
  CrmCampaign, 
  CrmChannel,
  Customer,
  Appointment,
  CustomerTag
} from '../types';

/**
 * CAMINHOS FIRESTORE
 */
const templatesRef = collection(db, "businesses", CLIENT_ID, "crmTemplates");
const automationsRef = collection(db, "businesses", CLIENT_ID, "crmAutomations");
const campaignsRef = collection(db, "businesses", CLIENT_ID, "crmCampaigns");

/**
 * 1. UTILITÁRIO: PROCESSADOR DE VARIÁVEIS
 * Substitui {{nome}}, {{servico}}, {{data}} pelo conteúdo real
 */
export const parseTemplateVariables = (
  text: string, 
  customer: Customer, 
  appointment?: Appointment
): string => {
  let parsed = text;
  
  // Variáveis do Cliente
  parsed = parsed.replace(/{{nome}}/g, customer.name.split(' ')[0]);
  parsed = parsed.replace(/{{nome_completo}}/g, customer.name);
  
  // Variáveis do Agendamento
  if (appointment) {
    parsed = parsed.replace(/{{servico}}/g, appointment.serviceName);
    parsed = parsed.replace(/{{data}}/g, new Date(appointment.date).toLocaleDateString('pt-PT'));
    parsed = parsed.replace(/{{hora}}/g, appointment.startTime);
  }

  return parsed;
};

/**
 * 2. GESTÃO DE TEMPLATES
 */

export const createCrmTemplate = async (template: Omit<CrmTemplate, 'id' | 'createdAt' | 'businessId'>): Promise<string> => {
  const docRef = await addDoc(templatesRef, {
    ...template,
    businessId: CLIENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getCrmTemplates = async (channel?: CrmChannel): Promise<CrmTemplate[]> => {
  let q = query(templatesRef, orderBy("createdAt", "desc"));
  if (channel) {
    q = query(templatesRef, where("channel", "==", channel), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrmTemplate));
};

export const deleteCrmTemplate = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "businesses", CLIENT_ID, "crmTemplates", id));
};

/**
 * 3. GESTÃO DE AUTOMAÇÕES
 */

export const createCrmAutomation = async (automation: Omit<CrmAutomation, 'id' | 'createdAt' | 'businessId'>): Promise<string> => {
  const docRef = await addDoc(automationsRef, {
    ...automation,
    businessId: CLIENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getCrmAutomations = async (): Promise<CrmAutomation[]> => {
  const q = query(automationsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrmAutomation));
};

export const toggleCrmAutomation = async (id: string, isActive: boolean): Promise<void> => {
  const docRef = doc(db, "businesses", CLIENT_ID, "crmAutomations", id);
  await updateDoc(docRef, { isActive, updatedAt: serverTimestamp() });
};

/**
 * 4. GESTÃO DE CAMPANHAS
 */

export const createCrmCampaign = async (
  campaign: Omit<CrmCampaign, 'id' | 'createdAt' | 'businessId' | 'status' | 'stats'>,
  targetCustomers: number
): Promise<string> => {
  const docRef = await addDoc(campaignsRef, {
    ...campaign,
    businessId: CLIENT_ID,
    status: 'SENT', // No MVP v3.7, o disparo é imediato via simulação/logs
    stats: {
      totalTargeted: targetCustomers,
      sentCount: targetCustomers
    },
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getCrmCampaigns = async (): Promise<CrmCampaign[]> => {
  const q = query(campaignsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CrmCampaign));
};