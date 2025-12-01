export interface InvoiceSettings {
  invoicePrefix: string;
  invoiceNumberFormat: string;
  nextInvoiceNumber: number;
  defaultPaymentTerms: number;
  invoiceFooter: { [key: string]: string };
  latePaymentFee?: number;
  showTaxBreakdown: boolean;
}
