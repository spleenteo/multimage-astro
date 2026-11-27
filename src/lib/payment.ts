// Payment facts shared by every request that asks for money (book orders, membership fees).
// The values live in `src/config/site.ts`. Imports only that file (relative, no alias): client
// scripts bundle this file and plain `tsx` loads it.

import { SITE } from '../config/site';

export const PAYMENT_ACCOUNT_HOLDER = SITE.payment.accountHolder;
export const PAYMENT_BANK = SITE.payment.bank;
export const PAYMENT_IBAN = SITE.payment.iban;
export const PAYMENT_BIC = SITE.payment.bic;
export const PAYMENT_SWIFT_INTERMEDIARY = SITE.payment.swiftIntermediary;
export const PAYMENT_PAYPAL = SITE.payment.paypal;

/** The IBAN in groups of four, for reading and copying by hand. */
export function formatIban(s: string): string {
  return s.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * A PayPal payment link prefilled with recipient, amount and causale (PayPal's classic
 * `_xclick` URL: it needs only the account email, no API key).
 */
export function paypalUrl(causale: string, cents: number): string {
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: PAYMENT_PAYPAL,
    amount: (cents / 100).toFixed(2),
    currency_code: 'EUR',
    item_name: causale,
    no_shipping: '1',
  });
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}
