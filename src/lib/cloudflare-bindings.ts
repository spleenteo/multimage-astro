// Access to the Cloudflare bindings (D1, send_email, Analytics Engine) for the order, membership and
// event endpoints. Only /api/ordine, /api/socio and /api/evento import this module. On the Cloudflare build `cloudflare:workers`
// is the real module and `env` holds the bindings of wrangler.jsonc; on the Vercel
// build and in plain `astro dev` the Vite alias in astro.config.mjs points it at an
// empty stub, so both getters return null.
import { env } from 'cloudflare:workers';

/** The part of a D1 database the endpoint uses: prepare, bind, run. */
export interface OrderDb {
  prepare(query: string): {
    bind(...values: Array<string | number | null>): {
      run(): Promise<unknown>;
    };
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

/** The part of an Analytics Engine dataset binding the endpoints use. */
export interface EventSink {
  writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

/** The BAG_EVENTS Analytics Engine binding, or null when it is not available. */
export function getBagEvents(): EventSink | null {
  const sink = env.BAG_EVENTS as Partial<EventSink> | undefined;
  return sink && typeof sink.writeDataPoint === 'function' ? (sink as EventSink) : null;
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

/** The MEMBERSHIP_MAIL send_email binding (/api/socio), or null when it is not available. */
export function getMembershipMail(): OrderMail | null {
  const mail = env.MEMBERSHIP_MAIL as Partial<OrderMail> | undefined;
  return mail && typeof mail.send === 'function' ? (mail as OrderMail) : null;
}
