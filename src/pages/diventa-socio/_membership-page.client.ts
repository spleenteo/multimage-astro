// /diventa-socio page script: validates the membership form, shows the field errors and the
// summary, runs Turnstile, sends the request to /api/socio and swaps the form for the
// confirmation: the amounts, the receipt mailto, the payment toggle (moves the chosen box first,
// no request) and print. The DOM is touched with textContent and
// setAttribute only.
// The markup contract (data-socio-* attributes, ids `socio-<key>`) is defined in index.astro.
import { createFieldErrors, loadTurnstile } from '~/lib/form.client';
import {
  MEMBERSHIP_ACTION,
  MEMBERSHIP_EMAIL,
  MEMBERSHIP_FIELD_MESSAGES,
  MEMBERSHIP_LABELS,
  validateMembershipFields,
  type MembershipFieldKey,
  type MembershipFields,
  type MembershipResponse,
} from '~/lib/membership';
import { PAYMENT_IBAN, paypalUrl } from '~/lib/payment';

const ENDPOINT = '/api/socio';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const formatCents = (cents: number) => euro.format(cents / 100);

// Field keys in DOM order, then the widget: the first error in this order gets focus.
const ERROR_KEYS = [
  'email',
  'firstName',
  'lastName',
  'birthDate',
  'birthPlace',
  'address1',
  'address2',
  'postcode',
  'city',
  'region',
  'country',
  'fee',
  'consent',
  'turnstile',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

const MSG = {
  turnstileMissing: 'Completa la verifica anti-spam qui sopra, poi invia di nuovo.',
  turnstileLoad: 'La verifica anti-spam non si carica: riprova più tardi o scrivici via email.',
  turnstileFailed: 'La verifica anti-spam non è andata a buon fine: completala di nuovo e riprova.',
  generic: `Non siamo riusciti a inviare la richiesta. Riprova tra poco oppure scrivici a ${MEMBERSHIP_EMAIL}.`,
} as const;

// The names the error summary links to, as the labels and legends read.
const FIELD_NAMES: Record<ErrorKey, string> = {
  ...MEMBERSHIP_LABELS,
  turnstile: 'Verifica anti-spam',
};

const isErrorKey = (k: string): k is ErrorKey => (ERROR_KEYS as readonly string[]).includes(k);

export function initMembershipPage(): void {
  const root = document.querySelector<HTMLElement>('[data-socio-page]');
  const form = root?.querySelector<HTMLFormElement>('form[data-socio-form]');
  // No form (the way-out box shows) or already initialised: nothing to do.
  if (!root || !form || root.dataset.socioReady === 'true') return;
  root.dataset.socioReady = 'true';

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);

  const formError = $('[data-socio-form-error]');
  const status = $('[data-socio-status]');

  let token = '';
  let turnstileRequested = false;
  let turnstile: { reset: () => void } | undefined;
  let sending = false;
  let finished = false;

  const {
    errorEl,
    setError,
    clearError,
    clearAll: clearAllErrors,
    showFormError,
    hideFormError,
    showFieldSummary,
  } = createFieldErrors<ErrorKey>({
    root,
    idPrefix: 'socio',
    keys: ERROR_KEYS,
    names: FIELD_NAMES,
    groupKeys: ['fee'],
    plainKeys: ['turnstile'],
    box: formError,
    boxText: $('[data-socio-form-error-text]'),
    boxList: $('[data-socio-form-error-list]'),
    mailto: $('[data-socio-mailto]'),
  });

  // --- Fields -------------------------------------------------------------

  const readFields = (): MembershipFields => {
    const val = (key: string) => $<HTMLInputElement>(`#socio-${key}`)?.value ?? '';
    const checked = (name: string) =>
      Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`));
    return {
      email: val('email'),
      firstName: val('firstName'),
      lastName: val('lastName'),
      birthDate: val('birthDate'),
      birthPlace: val('birthPlace'),
      address1: val('address1'),
      address2: val('address2'),
      city: val('city'),
      region: val('region'),
      postcode: val('postcode'),
      country: val('country'),
      fee: checked('fee')[0]?.value ?? '',
      areas: checked('areas').map((c) => c.value),
      areasOther: $<HTMLInputElement>('#socio-areas-other')?.checked ? val('areasOther') : '',
      consent: $<HTMLInputElement>('#socio-consent')?.checked ?? false,
    };
  };

  // --- Turnstile ----------------------------------------------------------

  const loadWidget = () => {
    const sitekey = form.dataset.sitekey;
    const container = $('#socio-turnstile');
    if (!sitekey || !container || turnstileRequested) return;
    turnstileRequested = true;
    turnstile = loadTurnstile({
      container,
      sitekey,
      action: MEMBERSHIP_ACTION,
      onToken: (t) => {
        token = t;
        clearError('turnstile');
      },
      onExpire: () => {
        token = '';
      },
      // The script or the widget failed (bad site key or hostname): offer the email way out.
      onError: () => {
        token = '';
        showFormError(MSG.turnstileLoad, true);
      },
    });
  };

  // A token is single-use: after any answer but success the widget needs a new one.
  const resetWidget = () => {
    token = '';
    turnstile?.reset();
  };

  // --- Success ------------------------------------------------------------

  const showDone = (res: Extract<MembershipResponse, { ok: true }>) => {
    const done = $('[data-socio-done]');
    if (!done) return;
    finished = true;
    form.hidden = true;
    const lede = done.querySelector<HTMLElement>('[data-socio-done-lede]');
    if (lede)
      lede.textContent = res.notified
        ? `Il codice della tua richiesta è ${res.code}.`
        : `Il codice della tua richiesta è ${res.code}, ma l'avviso alla segreteria non è partito: scrivi a ${MEMBERSHIP_EMAIL} indicando il codice.`;
    const fee = done.querySelector<HTMLElement>('[data-socio-done-fee]');
    if (fee) fee.textContent = `Quota scelta: ${res.fee.label}.`;
    done
      .querySelectorAll<HTMLElement>('[data-socio-causale]')
      .forEach((el) => (el.textContent = res.causale));
    done
      .querySelectorAll<HTMLElement>('[data-socio-amount]')
      .forEach((el) => (el.textContent = formatCents(res.fee.amountCents)));
    // The receipt mailto carries the code only.
    done
      .querySelector<HTMLAnchorElement>('[data-socio-receipt-link]')
      ?.setAttribute(
        'href',
        `mailto:${MEMBERSHIP_EMAIL}?subject=${encodeURIComponent(`Ricevuta quota ${res.code}`)}`,
      );

    const link = done.querySelector<HTMLAnchorElement>('[data-socio-paypal-link]');
    if (link) {
      link.href = paypalUrl(res.causale, res.fee.amountCents);
      link.hidden = false;
    }
    const linkLabel = done.querySelector<HTMLElement>('[data-socio-paypal-label]');
    if (linkLabel) linkLabel.textContent = `Paga ${formatCents(res.fee.amountCents)} con PayPal`;

    done.hidden = false;
    done.querySelector<HTMLElement>('[data-socio-done-heading]')?.focus();
  };

  // --- Failure ------------------------------------------------------------

  const showFailure = (res: MembershipResponse | null) => {
    resetWidget();
    if (!res || res.ok) {
      showFormError(MSG.generic, true);
      return;
    }
    switch (res.error) {
      case 'invalid': {
        const keys = (res.fields ?? []).filter((k): k is MembershipFieldKey & ErrorKey =>
          isErrorKey(k),
        );
        if (keys.length === 0) {
          showFormError(MSG.generic, true);
          break;
        }
        keys.forEach((k) => setError(k, MEMBERSHIP_FIELD_MESSAGES[k]));
        showFieldSummary(keys);
        break;
      }
      case 'turnstile':
        showFormError(MSG.turnstileFailed, false);
        break;
      default:
        showFormError(MSG.generic, true);
    }
  };

  // --- Submit -------------------------------------------------------------

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (sending || finished) return;
    hideFormError();
    clearAllErrors();
    if (status) status.textContent = '';
    loadWidget();

    const fields = readFields();
    const problems = validateMembershipFields(fields);
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
      showFieldSummary(keys);
      return;
    }

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    sending = true;
    if (submit) submit.disabled = true;
    if (status) status.textContent = 'Invio in corso…';

    let result: MembershipResponse | null = null;
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...fields, turnstileToken: token }),
      });
      result = (await response.json().catch(() => null)) as MembershipResponse | null;
      if (!response.ok && result?.ok) result = null;
    } catch {
      result = null;
    }

    sending = false;
    if (submit) submit.disabled = false;
    if (status) status.textContent = '';

    if (result?.ok) showDone(result);
    else showFailure(result);
  };

  form.addEventListener('submit', onSubmit);
  form.addEventListener('focusin', loadWidget, { once: true });

  const onFieldChange = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const key = target.name || target.id.replace(/^socio-/, '');
    if (!isErrorKey(key) || key === 'turnstile') return;
    const el = errorEl(key);
    if (!el || el.hidden) return;
    if (!validateMembershipFields(readFields())[key]) clearError(key);
  };
  form.addEventListener('input', onFieldChange);
  form.addEventListener('change', onFieldChange);

  // --- Confirmation: payment toggle and print ------------------------------

  // The chosen method's box goes first; both stay in the page, nothing is sent.
  const methods = $('[data-socio-methods]');
  $('[data-socio-pay-toggle]')?.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement | null;
    const box = target?.checked
      ? methods?.querySelector<HTMLElement>(`[data-socio-method="${target.value}"]`)
      : null;
    if (box) methods?.prepend(box);
  });
  $('[data-socio-print]')?.addEventListener('click', () => window.print());

  // "Copia l'IBAN" lives on the confirmation, which has its own live region.
  const copyBtn = $<HTMLButtonElement>('[data-socio-copy-iban]');
  const announce = $('[data-socio-announce]');
  if (copyBtn && navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', () => {
      const tell = (text: string) => {
        if (announce) announce.textContent = text;
      };
      const label = copyBtn.querySelector<HTMLElement>('[data-socio-copy-label]');
      navigator.clipboard.writeText(PAYMENT_IBAN).then(
        () => {
          tell('IBAN copiato');
          if (label) {
            label.textContent = 'IBAN copiato';
            window.setTimeout(() => (label.textContent = "Copia l'IBAN"), 2500);
          }
        },
        () => tell("Non siamo riusciti a copiare l'IBAN: selezionalo a mano."),
      );
    });
  }
}
