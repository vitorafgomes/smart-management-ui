import { InvoiceStatus } from './invoice-status';

export interface Invoice {
  id: string;
  subscriptionId: string;
  tenantId: string;
  invoiceNumber: string; // INV-2025-0001
  issueDate: string;
  dueDate: string;
  paidDate?: string;

  // Valores
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  currency: string;

  // Multi-Moeda
  totalAmountUsd?: number;
  exchangeRate?: number;

  // Status
  status: InvoiceStatus;

  // Pagamento
  paymentMethod: string;
  paymentTransactionId: string;
  paymentGatewayInvoiceId: string;

  // Documento Fiscal
  pdfUrl: string;
  xmlUrl: string; // NFe XML (Brasil)
  lineItems: string; // Array de itens da fatura
  notes: string;

  createdAt: string;
  updatedAt?: string;
}
