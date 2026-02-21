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
        cash: "CAIXA",
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
    },

    // --- MÓDULO DE CAIXA ---
    cash: {
      title: "Controlo de Caixa",
      subtitle: "Fluxo financeiro diário",
      noSession: "Não existe um caixa aberto para hoje.",
      btnOpen: "Abrir Caixa Hoje",
      btnClose: "Fechar Caixa",
      btnNewEntry: "Novo Lançamento",

      tabs: {
        current: "Sessão Atual",
        history: "Histórico & Relatórios"
      },
      
      summary: {
        balance: "Saldo Atual",
        income: "Total Entradas",
        expense: "Total Saídas",
        expected: "Saldo Esperado",
        real: "Saldo Real (Contado)",
        diff: "Divergência",
        billing: "Faturação Total",
        average: "Média por Sessão"
      },

      openModal: {
        title: "Abertura de Caixa",
        label: "Valor Inicial em Fundo de Maneio",
        placeholder: "0,00€",
        submit: "Confirmar Abertura"
      },

      entryModal: {
        title: "Novo Lançamento",
        type: "Tipo de Movimento",
        amount: "Valor",
        method: "Método de Pagamento",
        desc: "Descrição",
        placeholderDesc: "Ex: Venda de produto, Café, Limpeza...",
        submit: "Registar Movimento",
        types: {
          income: "Receita Manual",
          expense: "Despesa / Saída",
          adj: "Ajuste de Saldo",
          refund: "Reembolso"
        }
      },

      editModal: {
        title: "Retificar Lançamento",
        labelOriginal: "Valor Original",
        labelNew: "Novo Valor Corrigido",
        labelReason: "Motivo da Retificação (Obrigatório)",
        placeholderReason: "Ex: Erro de digitação, Troco incorreto...",
        submit: "Guardar Alteração",
        historyTitle: "Histórico de Alterações",
        auditTable: {
          colDate: "Data/Hora",
          colAdmin: "Admin",
          colChange: "Alteração",
          colReason: "Justificação"
        }
      },

      closeModal: {
        title: "Fecho de Caixa",
        instruction: "Conte o dinheiro físico e some os comprovativos de cartão/MBWay.",
        labelReal: "Total Contado em Caixa",
        labelNotes: "Notas de Fecho (Obrigatório se houver divergência)",
        submit: "Encerrar Sessão"
      },

      list: {
        title: "Movimentos da Sessão",
        empty: "Nenhum movimento registado nesta sessão.",
        deleteConfirm: "Eliminar este lançamento financeiro?",
        editedTag: "Editado",
        auditDetails: {
          title: "Rasto de Auditoria",
          original: "Original",
          current: "Atual",
          diff: "Impacto",
          reason: "Motivo da última alteração"
        }
      },

      history: {
        title: "Histórico de Sessões",
        filterLabel: "Filtrar Período",
        exportCsv: "Exportar para CSV (Excel)",
        exportPdf: "Gerar Relatório PDF",
        empty: "Nenhum histórico encontrado para este período.",
        btnBack: "Voltar à Lista",
        editModeNotice: "Modo de Auditoria Ativo",
        ranges: {
          last7: "Últimos 7 dias",
          last30: "Últimos 30 dias",
          thisMonth: "Este mês",
          all: "Todo o histórico"
        }
      },

      pdfLabels: {
        title: "Relatório de Fluxo de Caixa",
        generatedAt: "Gerado em:",
        period: "Período:",
        summary: "Resumo Financeiro",
        totalIn: "Total de Entradas:",
        totalOut: "Total de Saídas:",
        net: "Saldo do Período:",
        auditNotice: "(*) Movimento retificado. Consulte o Anexo de Auditoria na última página.",
        auditSectionTitle: "Anexo: Histórico de Retificações Financeiras",
        auditColRef: "Movimento",
        auditColHistory: "Evolução do Valor e Motivo"
      },

      methods: {
        CASH: "Dinheiro",
        CARD: "Cartão",
        MBWAY: "MBWay",
        PIX: "Pix",
        TRANSFER: "Transferência",
        OTHER: "Outro"
      }
    }
  }
};