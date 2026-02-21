// src/utils/exportUtils.ts

import { CashEntry, EntryType } from '../types';
import { COPY } from '../copy';

/**
 * Converte uma lista de movimentos de caixa para o formato CSV (Excel)
 * Otimizado para o padrão Europeu com suporte total a auditoria de alterações.
 */
export const exportEntriesToCSV = (entries: CashEntry[]) => {
  if (!entries || entries.length === 0) {
    alert("Não existem dados para exportar.");
    return;
  }

  // 1. Definição do Cabeçalho (Headers) com campos de Auditoria
  const headers = [
    "Data e Hora",
    "Descricao",
    "Tipo",
    "Metodo de Pagamento",
    "Origem",
    "Valor (EUR)",
    "Retificado",         // Indica se houve edição
    "Motivo Alteracao"    // Justificação obrigatória
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
    
    // Limpeza de caracteres de controlo do CSV
    const cleanDescription = entry.description
      ? entry.description.replace(/;/g, ',').replace(/\n/g, ' ').replace(/\r/g, '')
      : '';

    const cleanOrigin = entry.origin.replace(/;/g, ',');
    
    // Valor formatado com vírgula para Excel PT
    const amountFormatted = entry.amount.toFixed(2).replace('.', ',');

    // Dados de Auditoria
    const isEditedLabel = entry.isEdited ? "SIM" : "NAO";
    const cleanReason = entry.lastEditReason 
      ? entry.lastEditReason.replace(/;/g, ',').replace(/\n/g, ' ') 
      : "";

    return [
      `"${date}"`,
      `"${cleanDescription}"`,
      `"${typeLabel}"`,
      `"${methodLabel}"`,
      `"${cleanOrigin}"`,
      `"${amountFormatted}"`,
      `"${isEditedLabel}"`,
      `"${cleanReason}"`
    ];
  });

  // 3. Unir tudo com Ponto e Vírgula
  const csvContent = [
    headers.join(";"),
    ...rows.map(e => e.join(";"))
  ].join("\n");

  // 4. Criar o ficheiro para download
  try {
    // O prefixo \ufeff (BOM) garante que o Excel abra o UTF-8 com acentos corretos (ex: MBWay, Cartão)
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `relatorio_caixa_auditoria_${timestamp}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Limpeza de memória
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error("Falha ao gerar CSV de Auditoria:", error);
    alert("Erro técnico ao gerar o ficheiro.");
  }
};