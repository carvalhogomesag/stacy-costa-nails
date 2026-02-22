// src/types.ts

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; 
  color?: string; 
}

export interface Review {
  id: number;
  author: string;
  date: string;
  text: string;
  avatar?: string;
}

// --- GESTÃO DE UTILIZADORES E EQUIPA (NOVO FASE 1) ---

export enum UserRole {
  OWNER = 'OWNER',           // Acesso total
  MANAGER = 'MANAGER',       // Gestão operacional, sem acesso a configurações críticas de conta
  PROFESSIONAL = 'PROFESSIONAL', // Apenas a sua própria agenda e clientes
  RECEPTION = 'RECEPTION'    // Agenda global, mas sem acesso a financeiro/equipa
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface AppUser {
  uid: string;
  businessId: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Appointment {
  id?: string;
  serviceId: string;
  serviceName: string;
  serviceColor?: string; 
  clientName: string;
  clientPhone: string;
  date: string; 
  startTime: string; 
  endTime: string;   
  createdAt: any;
  
  // --- MULTI-PROFISSIONAL (NOVO FASE 1) ---
  professionalId: string;   // UID do utilizador com role PROFESSIONAL
  professionalName: string; // Nome para exibição rápida na agenda

  // --- INTEGRAÇÃO CRM ---
  customerId?: string;            

  // --- CAMPOS PARA INTEGRAÇÃO COM CAIXA ---
  isPaid?: boolean;               
  paymentMethod?: PaymentMethod;  
  paidAmount?: number;            
  discount?: number;              
  basePriceSnapshot?: number;     
  cashEntryId?: string;           
  updatedAt?: any;
}

export interface WorkConfig {
  id?: string;
  startHour: string; 
  endHour: string;   
  breakStart?: string; 
  breakEnd?: string;   
  daysOff: number[]; 
  // Opcional: vincular a um profissional específico num futuro upgrade
  userId?: string; 
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
  professionalId?: string; // Bloqueio pode ser para um profissional ou para a loja toda
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

// --- MÓDULO DE CAIXA ---

export enum EntryType {
  Income = 'INCOME',
  Expense = 'EXPENSE',
  Adjustment = 'ADJUSTMENT',
  Refund = 'REFUND',
  AppointmentIncome = 'APPT_INC',
  AppointmentRefund = 'APPT_REF',
}

export enum PaymentMethod {
  Cash = 'CASH',
  Card = 'CARD',
  MBWay = 'MBWAY',
  Pix = 'PIX',
  BankTransfer = 'TRANSFER',
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

export interface EntryChangeLog {
  timestamp: any;
  previousAmount: number;
  newAmount: number;
  previousDescription?: string;
  newDescription?: string;
  reason: string;
  updatedBy: string;
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
  isEdited?: boolean;              
  originalAmount?: number;         
  originalDescription?: string;    
  lastEditReason?: string;         
  history?: EntryChangeLog[];      
}

export interface CashSession {
  id?: string;
  businessId: string;
  openingDate: string; 
  initialBalance: number;
  status: SessionStatus;
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

// --- MÓDULO CRM BASE ---

export enum CustomerTag {
  VIP = 'VIP',
  New = 'NOVO',
  ChurnRisk = 'RISCO_ABANDONO',
  NoShowRecurrent = 'NO_SHOW_FREQUENTE',
  HotLead = 'INTERESSADO',
  Inactive = 'INATIVO'
}

export enum CrmEventType {
  AppointmentCreated = 'APPT_CREATED',
  AppointmentDone = 'APPT_DONE',
  AppointmentCanceled = 'APPT_CANCELED',
  PaymentReceived = 'PAYMENT_RECEIVED',
  NoteAdded = 'NOTE_ADDED',
  CampaignSent = 'CAMPAIGN_SENT',
  ManualEdit = 'MANUAL_EDIT',
  LeadCreated = 'LEAD_CREATED',
  LeadConverted = 'LEAD_CONVERTED'
}

export interface CustomerTimelineEvent {
  id?: string;
  customerId: string;
  type: CrmEventType;
  title: string;
  description: string;
  amount?: number;           
  relatedId?: string;        
  createdAt: any;            
  createdBy: string;         
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;             
  whatsapp: string;
  email?: string;
  birthday?: string;         
  gender?: string;
  notes?: string;
  tags: CustomerTag[];
  marketingConsent: boolean;
  consentDate?: any;
  stats: {
    totalSpent: number;      
    appointmentsCount: number;
    lastVisitDate?: string;  
    averageTicket: number;
    noShowCount: number;
  };
  preferences: {
    favoriteServices: string[]; 
    preferredStaff?: string;
    preferredTimeSlot?: string; 
  };
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
}

// --- MÓDULO DE TAREFAS CRM ---

export enum CrmTaskStatus {
  Pending = 'PENDENTE',
  InProgress = 'EM_CURSO',
  Completed = 'CONCLUIDA',
  Canceled = 'CANCELADA'
}

export enum CrmTaskPriority {
  Low = 'BAIXA',
  Medium = 'MEDIA',
  High = 'ALTA'
}

export interface CrmTask {
  id?: string;
  businessId: string;
  customerId?: string;       
  title: string;             
  description: string;
  dueDate: string;           
  priority: CrmTaskPriority;
  status: CrmTaskStatus;
  assignedTo: string;        
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
}

// --- MÓDULO DE MARKETING CRM ---

export enum CrmChannel {
  WhatsApp = 'WHATSAPP',
  SMS = 'SMS',
  Email = 'EMAIL'
}

export enum CrmAutomationTrigger {
  AfterService = 'POST_SERVICE',       
  Birthday = 'BIRTHDAY',              
  InactiveRetention = 'INACTIVE_RETENTION', 
  NoShow = 'NOSHOW_RECOVERY'          
}

export interface CrmTemplate {
  id?: string;
  businessId: string;
  title: string;
  body: string;                        
  channel: CrmChannel;
  createdAt: any;
  updatedAt?: any;
}

export interface CrmAutomation {
  id?: string;
  businessId: string;
  title: string;
  trigger: CrmAutomationTrigger;
  delayDays: number;                   
  templateId: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface CrmCampaign {
  id?: string;
  businessId: string;
  title: string;
  templateId: string;
  targetTag?: CustomerTag | 'ALL';
  scheduledDate?: string;              
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  stats: {
    totalTargeted: number;
    sentCount: number;
    deliveredCount?: number;
    clickedCount?: number;             
  };
  createdAt: any;
  createdBy: string;
}

export interface CrmAutomationRun {
  id?: string;
  businessId: string;
  automationId: string;
  customerId: string;
  executionDate: string;               
  status: 'SUCCESS' | 'FAILED';
  createdAt: any;
}

// --- MÓDULO DE LEADS E PIPELINE ---

export enum LeadSource {
  Instagram = 'INSTAGRAM',
  Facebook = 'FACEBOOK',
  Indication = 'INDICACAO',
  Ads = 'TRAFEGO_PAGO',
  Organic = 'ORGANICO',
  WalkIn = 'PASSAGEM',
  Other = 'OUTRO'
}

export enum LeadStage {
  New = 'NOVO',
  Contacted = 'CONTACTADO',
  Interested = 'INTERESSADO',
  Scheduled = 'AGENDADO',
  Converted = 'CONVERTIDO',
  Lost = 'PERDIDO'
}

export interface Lead {
  id?: string;
  businessId: string;
  name: string;
  phone: string;
  whatsapp: string;
  source: LeadSource;
  stage: LeadStage;
  potentialValue?: number;
  probability: number;
  notes?: string;
  customerId?: string;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
}

// --- AUDITORIA DE SISTEMA (NOVO FASE 1) ---

export interface AuditLog {
  id?: string;
  businessId: string;
  userId: string;          // Quem executou a ação
  action: string;          // Ex: 'CREATE_USER', 'DELETE_APPT'
  targetId: string;        // ID do objeto afetado
  details: string;         // Descrição amigável
  timestamp: any;
  metadata?: any;          // Snapshot dos dados antes/depois
}