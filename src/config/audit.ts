// src/config/audit.ts
//
// Single source of truth for external URLs used by the audit funnel.
// GOOGLE_FORM_URL is still a TODO placeholder until the pipeline spec
// (spec_automated_pipeline.md §11) completes. Keep the token name — it's
// grep-able for the replacement pass.

export const AUDIT_PRICE_USD = 250;

export const PAYPAL_LINK = 'https://www.paypal.com/ncp/payment/PHAQHJKXEBN52';
export const CALENDLY_CALL_URL = 'https://calendly.com/dewanggogte/30min';
export const GOOGLE_FORM_URL = 'TODO:GOOGLE_FORM_URL';
