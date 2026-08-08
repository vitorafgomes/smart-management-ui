/**
 * Shared shape of every identity record. Timestamps are ISO-8601 strings rather than `Date`
 * because that is what the API will hand over the wire and what the mock adapter stores; the
 * conversion is a rendering concern, not a domain one.
 */
export interface IdentityEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
