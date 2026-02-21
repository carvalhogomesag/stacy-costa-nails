// src/utils/exportUtils.ts

import { CashEntry, EntryType, PaymentMethod } from '../types';
import { formatCurrency } from './cashCalculations';
import { COPY } from '../copy';

/**
 * Converte uma lista de movimentos de caixa para o formato CSV (Excel)
 */
export const exportEntriesToCSV = (entries: CashEntry[]) => {
  if (entries.length === 0) return;

  // 1. Definição do Cabeçalho (Headers)
  const headers = [
    "Data/Hora",
    "Descricao",
    "Tipo",
    "Metodo de Pagamento",
    "Origem",
    "Valor (EUR)"
  ];

  // 2. Mapeamento dos Dados
  const rows = entries.map(entry => {
    const date = entry.createdAt?.seconds 
      ? new Date(entry.createdAt.seconds * 1000).toLocaleString('pt-PT') 
      : '--';
    
    const typeLabel = entry.type === EntryType.Expense || entry.type === EntryType.Refund ? 'Saída' : 'Entrada';
    const methodLabel = (COPY.admin.cash.methods as any)[entry.paymentMethod] || entry.paymentMethod;
    
    // Formatamos o valor com ponto em vez de vírgula para não quebrar colunas CSV (ou usamos aspas)
    const amountFormatted = entry.amount.toFixed(2);

    return [
      `"${date}"`,
      `"${entry.description}"`,
      `"${typeLabel}"`,
      `"${methodLabel}"`,
      `"${entry.origin}"`,
      `"${amountFormatted}"`
    ];
  });

  // 3. Unir tudo com ponto e vírgula (Padrão Excel Europeu)
  const csvContent = [
    headers.join(";"),
    ...rows.map(e => e.join(";"))
  ].join("\n");

  // 4. Criar o ficheiro para download com suporte a UTF-8 (BOM para o Excel ler acentos)
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const fileName = `relatorio_caixa_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};