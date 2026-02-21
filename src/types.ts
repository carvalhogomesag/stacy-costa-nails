// src/types.ts

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; 
  color?: string; // Cor hexadecimal escolhida pelo profissional
}

export interface Review {
  id: number;
  author: string;
  date: string;
  text: string;
  avatar?: string;
}

export interface Appointment {
  id?: string;
  serviceId: string;
  serviceName: string;
  serviceColor?: string; // Cor do serviço no momento da marcação (para performance)
  clientName: string;
  clientPhone: string;
  date: string; 
  startTime: string; 
  endTime: string;   
  createdAt: any;
  
  // --- CAMPOS PARA INTEGRAÇÃO COM CAIXA ---
  isPaid?: boolean;               // Indica se o serviço já foi cobrado
  paymentMethod?: PaymentMethod;  // Método utilizado no acerto
  paidAmount?: number;            // Valor real final pago pelo cliente
  discount?: number;              // Valor do desconto aplicado (em Euros)
  basePriceSnapshot?: number;     // Preço base do serviço no momento da finalização
  cashEntryId?: string;           // Vínculo direto com o lançamento no caixa
  updatedAt?: any;
}

export interface WorkConfig {
  id?: string;
  startHour: string; 
  endHour: string;   
  breakStart?: string; 
  breakEnd?: string;   
  daysOff: number[]; 
}

export interface TimeBlock {
  id?: string;
  title: string;      
  date: string;       
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  repeatCount?: number; 
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string; 
}

export interface GalleryImage {
  id: number;
  url: string;
  alt: string;
}

export interface BusinessProfile {
  socialLinks: SocialLinks;
  gallery: GalleryImage[];
  updatedAt?: any;
}

// --- INTERFACES E ENUMS PARA O MÓDULO DE CAIXA ---

export enum EntryType {
  Income = 'INCOME',               // Receita manual
  Expense = 'EXPENSE',             // Despesa manual
  Adjustment = 'ADJUSTMENT',       // Ajuste manual (reforço/sangria)
  Refund = 'REFUND',               // Reembolso manual
  AppointmentIncome = 'APPT_INC',  // Receita vinda de agendamento
  AppointmentRefund = 'APPT_REF',  // Estorno vindo de agendamento
}

export enum PaymentMethod {
  Cash = 'CASH',                   // Dinheiro
  Card = 'CARD',                   // Cartão
  MBWay = 'MBWAY',                 // MBWay (Portugal)
  Pix = 'PIX',                     // Pix (Brasil)
  BankTransfer = 'TRANSFER',       // Transferência
  Other = 'OTHER',
}

export enum EntryOrigin {
  Manual = 'MANUAL',
  Appointment = 'APPOINTMENT',
  System = 'SYSTEM',
}

export enum SessionStatus {
  Open = 'OPEN',
  Closed = 'CLOSED',
  Reconciled = 'RECONCILED',
}

/**
 * Interface para o rasto de auditoria (Audit Trail)
 * Regista o "Antes" e o "Depois" de cada alteração crítica
 */
export interface EntryChangeLog {
  timestamp: any;
  previousAmount: number;
  newAmount: number;
  previousDescription?: string; // NOVO: Rastrear mudança de contexto
  newDescription?: string;      // NOVO: Rastrear mudança de contexto
  reason: string;               // Justificação obrigatória
  updatedBy: string;            // ID do administrador que fez a retificação
}

export interface CashEntry {
  id?: string;
  businessId: string;
  sessionId: string;
  type: EntryType;
  amount: number;
  paymentMethod: PaymentMethod;
  origin: EntryOrigin;
  description: string;
  relatedAppointmentId?: string;
  status: 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  createdAt: any; 
  createdBy: string; 
  updatedAt?: any;
  updatedBy?: string;

  // --- CAMPOS DE AUDITORIA ---
  isEdited?: boolean;              
  originalAmount?: number;         
  originalDescription?: string;    // NOVO: Valor original da descrição
  lastEditReason?: string;         
  history?: EntryChangeLog[];      
}

export interface CashSession {
  id?: string;
  businessId: string;
  openingDate: string; 
  initialBalance: number;
  status: SessionStatus;
  
  // Preenchidos no fecho
  closingDate?: string;
  finalBalance?: number;     
  expectedBalance?: number;  
  divergenceAmount?: number; 
  divergenceNotes?: string;
  
  closedAt?: any;
  closedBy?: string;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  updatedBy?: string;
  
  auditLog?: Array<{
    timestamp: any;
    action: string;
    userId: string;
    details?: any;
  }>;
}

export interface CashSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalByMethod: Record<PaymentMethod, number>;
}