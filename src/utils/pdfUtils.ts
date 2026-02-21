// src/utils/pdfUtils.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashEntry, EntryType, CashSummary } from '../types';
import { formatCurrency } from './cashCalculations';
import { BUSINESS_INFO } from '../constants';
import { COPY } from '../copy';

/**
 * Gera um PDF profissional do fluxo de caixa diagramado para contabilidade
 * Inclui rasto visual para movimentos retificados (Auditoria)
 */
export const exportEntriesToPDF = (entries: CashEntry[], summary: CashSummary, periodLabel: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- CONFIGURAÇÃO DE CORES (Tuplos fixos para evitar erros de TS) ---
  const primaryColor: [number, number, number] = [181, 150, 122]; // #b5967a
  const darkColor: [number, number, number] = [74, 63, 53];      // #4a3f35
  const lightBg: [number, number, number] = [252, 251, 247];     // #fdfbf7
  const white: [number, number, number] = [255, 255, 255];

  // 1. BARRA DE TOPO DECORATIVA
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 15, 'F');

  // 2. CABEÇALHO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(BUSINESS_INFO.name.toUpperCase(), 15, 32);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(COPY.admin.cash.pdfLabels.title, 15, 39);

  // Metadados
  const dateGen = new Date().toLocaleString('pt-PT');
  doc.setFontSize(9);
  doc.text(`${COPY.admin.cash.pdfLabels.generatedAt} ${dateGen}`, pageWidth - 15, 32, { align: 'right' });
  doc.text(`${COPY.admin.cash.pdfLabels.period} ${periodLabel}`, pageWidth - 15, 39, { align: 'right' });

  // 3. QUADRO DE RESUMO FINANCEIRO
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(15, 48, pageWidth - 30, 35, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(COPY.admin.cash.pdfLabels.summary.toUpperCase(), 22, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`${COPY.admin.cash.pdfLabels.totalIn} ${formatCurrency(summary.totalIncome)}`, 22, 68);
  doc.text(`${COPY.admin.cash.pdfLabels.totalOut} ${formatCurrency(summary.totalExpense)}`, 22, 75);

  // Saldo Líquido em Destaque
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(
    `${COPY.admin.cash.pdfLabels.net} ${formatCurrency(summary.currentBalance)}`, 
    pageWidth - 25, 72, 
    { align: 'right' }
  );

  // 4. TABELA DE MOVIMENTOS COM COLUNA DE AUDITORIA
  const tableData = entries.map(entry => [
    entry.createdAt?.seconds ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString('pt-PT') : '--',
    entry.description,
    (entry.type === EntryType.Expense || entry.type === EntryType.Refund || entry.type === EntryType.AppointmentRefund) ? 'SAIDA' : 'ENTRADA',
    (COPY.admin.cash.methods as any)[entry.paymentMethod] || entry.paymentMethod,
    entry.isEdited ? 'SIM *' : 'NAO', // Coluna de Auditoria
    formatCurrency(entry.amount)
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['DATA', 'DESCRIÇÃO', 'TIPO', 'MÉTODO', 'RET.', 'VALOR']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: white,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [60, 60, 60]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 15 }, // Coluna Retificado
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 15, right: 15 },
    theme: 'striped',
    didDrawPage: (data) => {
      // Adicionar a nota de auditoria no final da tabela em cada página se necessário
      const hasEdited = entries.some(e => e.isEdited);
      if (hasEdited) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150);
        doc.text(
          COPY.admin.cash.pdfLabels.auditNotice, 
          15, 
          doc.internal.pageSize.getHeight() - 15
        );
      }
    }
  });

  // 5. RODAPÉ COM PAGINAÇÃO
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    const footerText = `Relatório Financeiro Stacy Costa Nails - Auditoria Ativa | Página ${i} de ${totalPages}`;
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  // 6. DOWNLOAD
  const fileName = `relatorio_caixa_contabilidade_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};