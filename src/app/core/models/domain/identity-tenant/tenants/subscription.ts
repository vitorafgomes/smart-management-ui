import { PlanType } from './plan-type';
import { SubscriptionStatus } from './subscription-status';
import { BillingCycle } from './billing-cycle';

export interface Subscription {
  id: string;
  tenantId: string;
  planName: string;
  planType: PlanType;
  status: SubscriptionStatus;

  // Preço Multi-Moeda
  pricePerCycle: number;
  currency: string; // USD, EUR, BRL, GBP, JPY, CNY
  priceInUsd?: number; // Preço convertido para USD (referência)
  exchangeRate?: number; // Taxa de câmbio no momento da criação
  exchangeRateDate?: string;

  // Preços Regionais (JSONB com preços por região)
  regionalPricing: string; // { "US": 99, "BR": 499, "EU": 89 }

  // Limites
  maxUsers: number;
  currentUsers: number;
  maxStorageGb: number;
  currentStorageGb: number;
  features: string;

  // Datas
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  isTrial: boolean;

  // Billing
  billingCycle: BillingCycle;
  discountPercentage?: number;
  discountAmount?: number;
  discountCurrency: string;
  autoRenew: boolean;
  nextBillingDate?: string;

  // Informações de Pagamento Internacional
  paymentMethod: string; // credit_card, bank_transfer, paypal, stripe, etc.
  paymentGateway: string; // Stripe, PayPal, Adyen, Mercado Pago
  paymentProviderCustomerId: string;

  // Cancelamento
  cancelledAt?: string;
  cancellationReason: string;
  gracePeriodDays: number;

  // Notas Fiscais / Invoicing
  taxRate?: number; // VAT, GST, Sales Tax, etc.
  taxType: string; // VAT, GST, Sales Tax, IVA
  taxInclusive: boolean; // Se o preço já inclui imposto

  // Endereço de Cobrança
  billingCountry: string;
  billingState: string;
  billingPostalCode: string;

  createdAt: string;
  updatedAt?: string;
}
