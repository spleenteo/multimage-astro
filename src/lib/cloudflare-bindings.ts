// Access to the Cloudflare bindings (D1 and send_email) for the order endpoint.
// Only /api/ordine imports this module. On the Cloudflare build `cloudflare:workers`
// is the real module and `env` holds the bindings of wrangler.jsonc; on the Vercel
// build and in plain `astro dev` the Vite alias in astro.config.mjs points it at an
// empty stub, so both getters return null.
import { env } from 'cloudflare:workers';

/** The part of a D1 database the endpoint uses: prepare, bind, run. */
export interface OrderDb {
  prepare(query: string): {
    bind(...values: Array<string | number | null>): { run(): Promise<unknown> };
  };
}

export interface OrderMailMessage {
  from: { email: string; name: string };
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** The part of a send_email binding the endpoint uses. */
export interface OrderMail {
  send(message: OrderMailMessage): Promise<unknown>;
}

/** The ORDERS D1 binding, or null when it is not available (not on Cloudflare). */
export function getOrderDb(): OrderDb | null {
  const db = env.ORDERS as Partial<OrderDb> | undefined;
  return db && typeof db.prepare === 'function' ? (db as OrderDb) : null;
}

/** The ORDER_MAIL send_email binding, or null when it is not available. */
export function getOrderMail(): OrderMail | null {
  const mail = env.ORDER_MAIL as Partial<OrderMail> | undefined;
  return mail && typeof mail.send === 'function' ? (mail as OrderMail) : null;
}
