export interface InvoiceSettings {
  invoicePrefix: string;
  invoiceNumberFormat: string; // INV-{YYYY}-{0000}
  nextInvoiceNumber: number;
  defaultPaymentTerms: number; // dias
  invoiceFooter: Record<string, string>; // Multi-language
  latePaymentFee?: number;
  showTaxBreakdown: boolean;
}
