import { SubscriptionAction } from './subscription-action';
import { SubscriptionStatus } from './subscription-status';

export interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  action: SubscriptionAction;
  previousPlan: string;
  newPlan: string;
  previousStatus?: SubscriptionStatus;
  newStatus?: SubscriptionStatus;
  amount?: number;
  notes: string;
  changedByUserId?: string;
  createdAt: string;
}
