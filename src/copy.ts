// src/copy.ts
import { BUSINESS_INFO } from './constants';

export const COPY = {
  // --- SITE PÚBLICO ---
  hero: {
    badge: "Nail Artist Premium em Algés",
    title: BUSINESS_INFO.name,
    subtitle: BUSINESS_INFO.subName,
    description: "Onde a técnica encontra a arte. Especialista em unhas de gel com acabamento impecável e brio em cada detalhe.",
    ctaPrimary: "Marcar Experiência",
    ctaSecondary: "Consultar Menu",
  },

  highlights: [
    { 
      title: "Rigor & Higiene", 
      text: "Espaço projetado para o teu conforto com os mais altos padrões de esterilização." 
    },
    { 
      title: "Atendimento Exclusivo", 
      text: "Uma experiência personalizada onde tu és a nossa prioridade." 
    },
    { 
      title: "Durabilidade Surreal", 
      text: "Técnicas avançadas de gel e alongamento para unhas perfeitas por semanas." 
    }
  ],

  services: {
    badge: "O Meu Menu",
    title: "Serviços & Cuidados",
    loading: "A carregar o menu...",
    empty: "Nenhum serviço disponível no momento.",
    ctaMini: "Marca a tua visita"
  },

  about: {
    title: BUSINESS_INFO.name,
    subtitle: "Paixão pelas Unhas",
    p1: "Com anos de dedicação à estética, especializei-me em criar resultados que elevam a confiança de cada mulher.",
    p2: `No meu espaço em ${BUSINESS_INFO.address.includes('Algés') ? 'Algés' : 'Lisboa'}, utilizo as técnicas mais modernas do mercado internacional para garantir que as tuas unhas são tratadas como joias.`,
    cta: "Marca a tua visita"
  },

  portfolio: {
    title: "O Meu Portfolio",
    subtitle: "Trabalhos reais e brio constante",
    instagramTag: "Segue-nos",
    formats: "Formatos: JPG, PNG, WEBP"
  },

  space: {
    title: "O Teu Momento",
    description: "Preparamos um ambiente minimalista e relaxante, pensado para que possas desfrutar do teu momento de cuidado com toda a tranquilidade."
  },

  contact: {
    title: "Vem Visitar-nos",
    locationLabel: "Localização",
    hoursLabel: "Horário",
    phoneLabel: "Telemóvel",
    mapButton: "Abrir no Google Maps"
  },

  footer: {
    copy: `© ${new Date().getFullYear()} ${BUSINESS_INFO.name} • Portugal`,
    devTag: "Allan Dev v3.7"
  },

  // --- COMPONENTES DE AGENDAMENTO (CLIENTE) ---
  bookingModal: {
    title: "Marcar Atendimento",
    steps: {
      services: "Selecione o serviço pretendido:",
      date: "Escolha o melhor dia",
      time: "Horários disponíveis para",
      confirm: "Confirmação dos teus dados",
      successTitle: "Tudo Pronto!",
      successText: (name: string, date: string, time: string) => 
        `Obrigada ${name}! Reservámos o teu momento para dia ${date} às ${time}.`
    },
    placeholders: {
      name: "Teu Nome",
      phone: "Teu Telemóvel"
    },
    buttons: {
      back: "Voltar",
      finish: "Finalizar Marcação",
      close: "Fechar"
    }
  },

  // --- PAINEL ADMINISTRATIVO ---
  admin: {
    login: {
      title: "Gestão Premium",
      subtitle: "Painel de Controlo",
      button: "Entrar no Painel",
      error: "Credenciais incorretas. Tente novamente."
    },
    dashboard: {
      headerBadge: "Painel de Gestão",
      tabs: {
        appointments: "MARCAÇÕES",
        services: "SERVIÇOS",
        design: "DESIGN",
        settings: "CONFIG"
      },
      logout: "Sair",
      logoutConfirm: "Deseja sair do sistema de gestão?"
    },
    appointments: {
      title: "Agenda",
      newBtn: "Nova",
      empty: "Sem marcações registadas.",
      deleteConfirm: "Eliminar esta marcação definitivamente?"
    },
    services: {
      title: "Novo Serviço",
      listTitle: "Serviços Disponíveis",
      deleteConfirm: "Deseja eliminar este serviço definitivamente?",
      form: {
        name: "Nome do Serviço",
        price: "Preço",
        duration: "Duração (Mins)",
        desc: "Descrição / Detalhes",
        submit: "Criar Serviço"
      }
    },
    settings: {
      workSchedule: "Jornada de Trabalho",
      workSubtitle: "Horários do Salão",
      daysOff: "Dias de Encerramento",
      blockTitle: "Bloquear Horário",
      activeBlocks: "Bloqueios Ativos",
      saveBtn: "Guardar Configuração"
    }
  }
};