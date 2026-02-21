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

// --- NOVAS INTERFACES E ENUMS PARA O MÓDULO DE CAIXA ---

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
  createdAt: any; // Firebase Timestamp
  createdBy: string; // userId
  updatedAt?: any;
  updatedBy?: string;
}

export interface CashSession {
  id?: string;
  businessId: string;
  openingDate: string; // YYYY-MM-DD
  initialBalance: number;
  status: SessionStatus;
  
  // Preenchidos no fecho
  closingDate?: string;
  finalBalance?: number;     // Saldo contado manualmente
  expectedBalance?: number;  // Saldo calculado pelo sistema
  divergenceAmount?: number; // Diferença entre esperado e real
  divergenceNotes?: string;
  
  closedAt?: any;
  closedBy?: string;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  updatedBy?: string;
  
  // Auditoria de ações críticas
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