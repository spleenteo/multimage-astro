// Payment facts shared by every request that asks for money (book orders, membership fees).
// No imports: client scripts bundle this file and plain `tsx` loads it.

export const PAYMENT_ACCOUNT_HOLDER = 'Associazione Multimage';
export const PAYMENT_BANK = 'Banca Etica';
export const PAYMENT_IBAN = 'IT50T0501802800000011361524';
export const PAYMENT_BIC = 'ETICIT22XXX';
export const PAYMENT_SWIFT_INTERMEDIARY = 'POSOIT22XXX';
export const PAYMENT_PAYPAL = 'info@multimage.org';

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
