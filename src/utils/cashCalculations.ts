// src/utils/cashCalculations.ts

import { CashEntry, EntryType, PaymentMethod, CashSummary } from '../types';

/**
 * Agrupa os tipos de entrada em categorias de soma ou subtração
 */
const IS_INCOME = (type: EntryType) => 
  [EntryType.Income, EntryType.AppointmentIncome, EntryType.Adjustment].includes(type);

const IS_EXPENSE = (type: EntryType) => 
  [EntryType.Expense, EntryType.Refund, EntryType.AppointmentRefund].includes(type);

/**
 * Formata um número para 2 casas decimais para evitar erros de precisão do JS
 */
const roundToTwo = (num: number): number => {
  return +(Math.round(Number(num + "e+2")) + "e-2");
};

/**
 * Calcula o resumo completo de uma sessão de caixa
 */
export const calculateCashSummary = (
  initialBalance: number,
  entries: CashEntry[]
): CashSummary => {
  
  let totalIncome = 0;
  let totalExpense = 0;

  // Inicializa o objeto de totais por método com 0
  const totalByMethod: Record<PaymentMethod, number> = {
    [PaymentMethod.Cash]: 0,
    [PaymentMethod.Card]: 0,
    [PaymentMethod.MBWay]: 0,
    [PaymentMethod.Pix]: 0,
    [PaymentMethod.BankTransfer]: 0,
    [PaymentMethod.Other]: 0,
  };

  entries.forEach(entry => {
    // Apenas processamos entradas confirmadas
    if (entry.status !== 'CONFIRMED') return;

    const amount = entry.amount || 0;

    if (IS_INCOME(entry.type)) {
      totalIncome += amount;
      totalByMethod[entry.paymentMethod] += amount;
    } 
    else if (IS_EXPENSE(entry.type)) {
      totalExpense += amount;
      totalByMethod[entry.paymentMethod] -= amount;
    }
  });

  // O saldo atual é: Inicial + Entradas - Saídas
  const currentBalance = initialBalance + totalIncome - totalExpense;

  return {
    currentBalance: roundToTwo(currentBalance),
    totalIncome: roundToTwo(totalIncome),
    totalExpense: roundToTwo(totalExpense),
    totalByMethod: {
      [PaymentMethod.Cash]: roundToTwo(totalByMethod[PaymentMethod.Cash]),
      [PaymentMethod.Card]: roundToTwo(totalByMethod[PaymentMethod.Card]),
      [PaymentMethod.MBWay]: roundToTwo(totalByMethod[PaymentMethod.MBWay]),
      [PaymentMethod.Pix]: roundToTwo(totalByMethod[PaymentMethod.Pix]),
      [PaymentMethod.BankTransfer]: roundToTwo(totalByMethod[PaymentMethod.BankTransfer]),
      [PaymentMethod.Other]: roundToTwo(totalByMethod[PaymentMethod.Other]),
    }
  };
};

/**
 * Calcula apenas o saldo esperado para o fecho de caixa
 */
export const calculateExpectedBalance = (initialBalance: number, entries: CashEntry[]): number => {
  const summary = calculateCashSummary(initialBalance, entries);
  return summary.currentBalance;
};

/**
 * Helper para formatar valores monetários na UI (ex: 1250.5 -> 1.250,50€)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};