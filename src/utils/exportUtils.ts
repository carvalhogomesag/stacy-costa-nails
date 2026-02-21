// src/utils/exportUtils.ts

import { CashEntry, EntryType, PaymentMethod } from '../types';
import { COPY } from '../copy';

/**
 * Converte uma lista de movimentos de caixa para o formato CSV (Excel)
 * Otimizado para o padrão Europeu (Ponto e Vírgula e Vírgula Decimal)
 */
export const exportEntriesToCSV = (entries: CashEntry[]) => {
  if (!entries || entries.length === 0) {
    alert("Não existem dados para exportar.");
    return;
  }

  // 1. Definição do Cabeçalho (Headers)
  const headers = [
    "Data e Hora",
    "Descricao",
    "Tipo",
    "Metodo de Pagamento",
    "Origem",
    "Valor (EUR)"
  ];

  // 2. Mapeamento e Limpeza dos Dados
  const rows = entries.map(entry => {
    // Formatação de Data Local
    const date = entry.createdAt?.seconds 
      ? new Date(entry.createdAt.seconds * 1000).toLocaleString('pt-PT') 
      : '--';
    
    const typeLabel = (entry.type === EntryType.Expense || 
                      entry.type === EntryType.Refund || 
                      entry.type === EntryType.AppointmentRefund) ? 'Saida' : 'Entrada';
    
    const methodLabel = (COPY.admin.cash.methods as any)[entry.paymentMethod] || entry.paymentMethod;
    
    // IMPORTANTE: Limpar caracteres que quebram o CSV (ponto e vírgula e quebras de linha)
    const cleanDescription = entry.description
      ? entry.description.replace(/;/g, ',').replace(/\n/g, ' ').replace(/\r/g, '')
      : '';

    const cleanOrigin = entry.origin.replace(/;/g, ',');
    
    // Valor formatado com vírgula para ser reconhecido como número no Excel PT
    const amountFormatted = entry.amount.toFixed(2).replace('.', ',');

    return [
      `"${date}"`,
      `"${cleanDescription}"`,
      `"${typeLabel}"`,
      `"${methodLabel}"`,
      `"${cleanOrigin}"`,
      `"${amountFormatted}"`
    ];
  });

  // 3. Unir tudo com Ponto e Vírgula (Separador padrão para Excel em Portugal/Brasil)
  const csvContent = [
    headers.join(";"),
    ...rows.map(e => e.join(";"))
  ].join("\n");

  // 4. Criar o ficheiro para download
  try {
    // O prefixo \ufeff (BOM) é vital para o Excel abrir o UTF-8 com acentos corretos
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const fileName = `relatorio_caixa_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.display = 'none'; // Garantir que não interfere na UI
    
    document.body.appendChild(link);
    link.click();
    
    // Limpeza necessária para performance e memória
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error("Falha ao gerar CSV:", error);
    alert("Erro técnico ao gerar o ficheiro.");
  }
};