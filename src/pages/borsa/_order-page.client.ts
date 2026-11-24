// /borsa page script: renders the bag recap, validates the form, runs Turnstile and sends the order.
// The DOM is built from templates, textContent and setAttribute only (never innerHTML).
// The markup contract (data-order-* attributes, ids `order-<key>`) is defined in index.astro.
import { emptyBag, onBagChange, openBag, readBag } from '~/lib/bag.client';
import {
  ORDER_ACTION,
  ORDER_FIELD_MESSAGES,
  ORDER_IBAN,
  ORDER_MAX_LINES,
  SHIPPING_KINDS,
  bagMailto,
  bagTotals,
  booksLabel,
  copiesLabel,
  formatCents,
  validateOrderFields,
  type BagItem,
  type OrderFieldKey,
  type OrderFields,
  type OrderResponse,
  type ShippingKind,
} from '~/lib/order';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const ENDPOINT = '/api/ordine';

// Field keys in DOM order, then the widget: the first error in this order gets focus.
const ERROR_KEYS = [
  'name',
  'email',
  'phone',
  'address',
  'city',
  'province',
  'shipping',
  'buyer',
  'notes',
  'consent',
  'turnstile',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

const MSG = {
  tooManyLines: 'Puoi ordinare al massimo 30 titoli per volta: togline qualcuno dalla borsa.',
  turnstileMissing: 'Completa la verifica anti-spam qui sopra, poi invia di nuovo.',
  turnstileFailed: 'La verifica anti-spam non è andata: ripetila e invia di nuovo.',
  turnstileLoad:
    "La verifica anti-spam non si carica: riprova più tardi o mandaci l'ordine via email.",
  nothingOrderable:
    'Nessuno dei libri nella borsa si può ancora ordinare dal sito: scrivici, ti aiutiamo noi.',
  generic:
    "Non siamo riusciti a inviare l'ordine. Riprova tra qualche minuto, oppure mandacelo via email.",
  checkFields: 'Controlla i campi segnati.',
} as const;

const isErrorKey = (k: string): k is ErrorKey => (ERROR_KEYS as readonly string[]).includes(k);

export function initOrderPage(): void {
  const root = document.querySelector<HTMLElement>('[data-order-page]');
  if (!root || root.dataset.orderReady === 'true') return;
  root.dataset.orderReady = 'true';

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

  const head = $('[data-order-head]');
  const emptyView = $('[data-order-empty]');
  const filled = $('[data-order-filled]');
  const sizeLine = $('[data-order-size]');
  const list = $('[data-order-lines]');
  const lineTemplate = $<HTMLTemplateElement>('template[data-order-line]');
  const copiesEl = $('[data-order-copies]');
  const shippingEl = $('[data-order-shipping]');
  const totalEl = $('[data-order-total]');
  const announce = $('[data-order-announce]');
  const form = $<HTMLFormElement>('form[data-order-form]');
  const mailtoBox = $('[data-order-mailto-box]');
  const formError = $('[data-order-form-error]');
  const formErrorText = $('[data-order-form-error-text]');
  const status = $('[data-order-status]');
  const done = $('[data-order-done]');

  let finished = false;
  let sending = false;
  let lineLimitShown = false;
  let token = '';
  let widgetId: string | undefined;
  let turnstileRequested = false;

  const say = (text: string) => {
    if (announce) announce.textContent = text;
  };

  const checkedShipping = (): ShippingKind => {
    const v = form?.querySelector<HTMLInputElement>('input[name="shipping"]:checked')?.value ?? '';
    return v in SHIPPING_KINDS ? (v as ShippingKind) : 'piego';
  };

  // --- Form errors --------------------------------------------------------

  const errorEl = (key: ErrorKey) => $(`[data-error-for="${key}"]`);

  const controlFor = (key: ErrorKey): HTMLElement | null => {
    if (key === 'shipping' || key === 'buyer')
      return form?.querySelector<HTMLElement>(`input[name="${key}"]`)?.closest('fieldset') ?? null;
    return $(`#order-${key}`);
  };

  const focusTarget = (key: ErrorKey): HTMLElement | null => {
    if (key === 'shipping' || key === 'buyer') {
      return (
        form?.querySelector<HTMLInputElement>(`input[name="${key}"]:checked`) ??
        form?.querySelector<HTMLInputElement>(`input[name="${key}"]`) ??
        null
      );
    }
    return controlFor(key);
  };

  const setError = (key: ErrorKey, message: string) => {
    const el = errorEl(key);
    const control = controlFor(key);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
    if (control) {
      control.setAttribute('aria-invalid', 'true');
      // Keep the hint ids the markup already gave the control, then append the error id.
      if (control.dataset.orderHints === undefined)
        control.dataset.orderHints = control.getAttribute('aria-describedby') ?? '';
      if (el?.id)
        control.setAttribute(
          'aria-describedby',
          [control.dataset.orderHints, el.id].filter(Boolean).join(' '),
        );
    }
  };

  const clearError = (key: ErrorKey) => {
    const el = errorEl(key);
    const control = controlFor(key);
    if (el) {
      el.textContent = '';
      el.hidden = true;
    }
    if (control) {
      control.removeAttribute('aria-invalid');
      const hints = control.dataset.orderHints;
      if (hints) control.setAttribute('aria-describedby', hints);
      else if (hints === '') control.removeAttribute('aria-describedby');
    }
  };

  const clearAllErrors = () => ERROR_KEYS.forEach(clearError);

  const showFormError = (text: string, withMailto: boolean) => {
    if (!formError || !formErrorText) return;
    formErrorText.textContent = text;
    const mailto = formError.querySelector<HTMLElement>('[data-order-mailto]');
    if (mailto) mailto.hidden = !withMailto;
    formError.hidden = false;
  };

  const hideFormError = () => {
    if (!formError || !formErrorText) return;
    formErrorText.textContent = '';
    formError.hidden = true;
  };

  const focusFirstError = (keys: ErrorKey[]) => {
    const first = ERROR_KEYS.find((k) => keys.includes(k));
    if (first) focusTarget(first)?.focus();
  };

  // --- Fields -------------------------------------------------------------

  const readFields = (): OrderFields => {
    const val = (key: string) => $<HTMLInputElement>(`#order-${key}`)?.value.trim() ?? '';
    return {
      name: val('name'),
      email: val('email'),
      phone: val('phone'),
      address: val('address'),
      city: val('city'),
      province: val('province'),
      shipping:
        form?.querySelector<HTMLInputElement>('input[name="shipping"]:checked')?.value ?? '',
      buyer: form?.querySelector<HTMLInputElement>('input[name="buyer"]:checked')?.value ?? '',
      notes: val('notes'),
      consent: $<HTMLInputElement>('#order-consent')?.checked === true,
    };
  };

  // --- Render -------------------------------------------------------------

  const render = (items: BagItem[]) => {
    if (finished) return;
    const isEmpty = items.length === 0;
    if (emptyView) emptyView.hidden = !isEmpty;
    if (filled) filled.hidden = isEmpty;
    if (isEmpty) {
      if (sizeLine) sizeLine.textContent = '';
      return;
    }

    const shippingKind = checkedShipping();
    const fee = SHIPPING_KINDS[shippingKind].cents;
    const totals = bagTotals(items);
    const total = totals.cents + fee;

    if (list && lineTemplate) {
      const nodes = items.map((item) => {
        const li = lineTemplate.content.cloneNode(true) as DocumentFragment;
        const title = li.querySelector('[data-line-title]');
        const amount = li.querySelector('[data-line-amount]');
        if (title) title.textContent = `${item.title} · ${copiesLabel(item.qty)}`;
        if (amount) amount.textContent = formatCents(item.priceCents * item.qty);
        return li;
      });
      list.replaceChildren(...nodes);
    }
    if (sizeLine)
      sizeLine.textContent = `${booksLabel(totals.lines)} · ${copiesLabel(totals.copies)} · ${formatCents(total)}`;
    if (copiesEl) copiesEl.textContent = String(totals.copies);
    if (shippingEl) shippingEl.textContent = formatCents(fee);
    if (totalEl) totalEl.textContent = formatCents(total);

    const href = bagMailto(items, shippingKind);
    $$<HTMLElement>('[data-order-mailto] a').forEach((a) => a.setAttribute('href', href));

    if (items.length > ORDER_MAX_LINES) {
      showFormError(MSG.tooManyLines, false);
      lineLimitShown = true;
    } else if (lineLimitShown) {
      hideFormError();
      lineLimitShown = false;
    }

    loadTurnstile();
  };

  // --- Turnstile ----------------------------------------------------------

  const renderWidget = () => {
    const sitekey = form?.dataset.sitekey;
    const container = $('#order-turnstile');
    if (!sitekey || !container || widgetId !== undefined || !window.turnstile) return;
    widgetId = window.turnstile.render(container, {
      sitekey,
      action: ORDER_ACTION,
      language: 'it',
      size: 'flexible',
      callback: (t: string) => {
        token = t;
        clearError('turnstile');
      },
      'expired-callback': () => {
        token = '';
      },
      'error-callback': () => {
        token = '';
      },
    });
  };

  function loadTurnstile() {
    if (!form?.dataset.sitekey || turnstileRequested) return;
    turnstileRequested = true;
    if (window.turnstile) {
      renderWidget();
      return;
    }
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderWidget);
    script.addEventListener('error', () => showFormError(MSG.turnstileLoad, true));
    document.head.append(script);
  }

  const resetWidget = () => {
    token = '';
    if (widgetId !== undefined) window.turnstile?.reset(widgetId);
  };

  // --- Success ------------------------------------------------------------

  const showDone = (
    res: Extract<OrderResponse, { ok: true }>,
    snapshot: BagItem[],
    email: string,
  ) => {
    finished = true;
    emptyBag();
    if (head) head.hidden = true;
    if (filled) filled.hidden = true;
    if (emptyView) emptyView.hidden = true;
    if (mailtoBox) mailtoBox.hidden = true;
    if (!done) return;

    const lede = done.querySelector('[data-order-done-lede]');
    if (lede) {
      if (res.copySent) {
        const strong = document.createElement('b');
        strong.textContent = email;
        lede.replaceChildren(
          "L'abbiamo girato a Olivier. Una copia è in viaggio verso ",
          strong,
          ': se non la vedi, guarda nello spam.',
        );
      } else {
        lede.textContent =
          "L'ordine è arrivato a Olivier, ma non siamo riusciti a mandarti la copia: tienila tu stampando questa pagina.";
      }
    }

    const printBtn = done.querySelector<HTMLElement>('[data-order-print]');
    if (printBtn) printBtn.hidden = res.copySent;

    const doneLines = done.querySelector('[data-order-done-lines]');
    if (doneLines) {
      doneLines.replaceChildren(
        ...res.lines.map((l) => {
          const li = document.createElement('li');
          li.textContent = `${l.title} · ${copiesLabel(l.qty)} · ${formatCents(l.amountCents)}`;
          return li;
        }),
      );
    }
    const totalLabel = done.querySelector('[data-order-done-total-label]');
    if (totalLabel)
      totalLabel.textContent = `Totale · ${SHIPPING_KINDS[res.shippingKind].label.toLowerCase()}`;
    const doneTotal = done.querySelector('[data-order-done-total]');
    if (doneTotal) doneTotal.textContent = formatCents(res.total);

    // Name what changed between the visitor's bag and the server's catalogue.
    const notes: string[] = [];
    const droppedTitles = res.dropped
      .map((id) => snapshot.find((i) => i.id === id)?.title)
      .filter((t): t is string => Boolean(t));
    if (droppedTitles.length > 0)
      notes.push(`Non più ordinabili, tolti dall'ordine: ${droppedTitles.join(', ')}.`);
    for (const line of res.lines) {
      const before = snapshot.find((i) => i.id === line.id);
      if (before && before.priceCents !== line.priceCents)
        notes.push(
          `Prezzo aggiornato: ${line.title}, ora ${formatCents(line.priceCents)} a copia.`,
        );
    }
    const notesEl = done.querySelector<HTMLElement>('[data-order-done-notes]');
    if (notesEl) {
      notesEl.textContent = notes.join(' ');
      notesEl.hidden = notes.length === 0;
    }

    done.hidden = false;
    done.querySelector<HTMLElement>('[data-order-done-heading]')?.focus();
  };

  // --- Failure ------------------------------------------------------------

  const showFailure = (res: OrderResponse | null) => {
    resetWidget();
    if (!res || res.ok) {
      showFormError(MSG.generic, true);
      return;
    }
    switch (res.error) {
      case 'invalid': {
        const keys = (res.fields ?? []).filter((k): k is OrderFieldKey & ErrorKey => isErrorKey(k));
        if (keys.length === 0) {
          showFormError(MSG.generic, true);
          break;
        }
        keys.forEach((k) => setError(k, ORDER_FIELD_MESSAGES[k]));
        showFormError(MSG.checkFields, false);
        focusFirstError(keys);
        break;
      }
      case 'turnstile':
        showFormError(MSG.turnstileFailed, false);
        break;
      case 'too_many_lines':
        showFormError(MSG.tooManyLines, false);
        break;
      case 'nothing_orderable':
        showFormError(MSG.nothingOrderable, true);
        break;
      case 'not_configured':
        if (form) form.hidden = true;
        if (mailtoBox) mailtoBox.hidden = false;
        break;
      default:
        showFormError(MSG.generic, true);
    }
  };

  // --- Submit -------------------------------------------------------------

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (sending || finished || !form) return;
    hideFormError();
    lineLimitShown = false;
    clearAllErrors();

    const fields = readFields();
    const problems = validateOrderFields(fields);
    const keys: ErrorKey[] = [];
    for (const key of ERROR_KEYS) {
      const message = key === 'turnstile' ? undefined : problems[key];
      if (message) {
        setError(key, message);
        keys.push(key);
      }
    }
    if (!token) {
      setError('turnstile', MSG.turnstileMissing);
      keys.push('turnstile');
    }
    if (keys.length > 0) {
      focusFirstError(keys);
      return;
    }

    const snapshot = readBag();
    if (snapshot.length > ORDER_MAX_LINES) {
      showFormError(MSG.tooManyLines, false);
      lineLimitShown = true;
      return;
    }

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    sending = true;
    if (submit) submit.disabled = true;
    if (status) status.textContent = 'Invio in corso…';

    let result: OrderResponse | null = null;
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          lines: snapshot.map((i) => ({ id: i.id, qty: i.qty })),
          turnstileToken: token,
        }),
      });
      result = (await response.json().catch(() => null)) as OrderResponse | null;
      if (!response.ok && result?.ok) result = null;
    } catch {
      result = null;
    }

    sending = false;
    if (submit) submit.disabled = false;
    if (status) status.textContent = '';

    if (result?.ok) showDone(result, snapshot, fields.email);
    else showFailure(result);
  };

  // --- Wiring -------------------------------------------------------------

  const edit = $<HTMLButtonElement>('[data-order-edit]');
  edit?.addEventListener('click', () => openBag(edit));

  const copyBtn = $<HTMLButtonElement>('[data-order-copy-iban]');
  if (copyBtn && navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(ORDER_IBAN).then(
        () => say('IBAN copiato'),
        () => say("Non siamo riusciti a copiare l'IBAN: selezionalo a mano."),
      );
    });
  }

  $<HTMLElement>('[data-order-print]')?.addEventListener('click', () => window.print());

  form?.addEventListener('submit', onSubmit);
  const onFieldChange = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const key = target.name || target.id.replace(/^order-/, '');
    if (key === 'shipping') render(readBag());
    if (!isErrorKey(key) || key === 'turnstile') return;
    const el = errorEl(key);
    if (!el || el.hidden) return;
    if (!validateOrderFields(readFields())[key]) clearError(key);
  };
  form?.addEventListener('input', onFieldChange);
  form?.addEventListener('change', onFieldChange);

  onBagChange(render);
  render(readBag());
}
