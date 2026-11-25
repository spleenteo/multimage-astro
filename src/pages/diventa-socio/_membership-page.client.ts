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
  'areas',
  'areasOther',
  'consent',
  'turnstile',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

// The fields of step 1; step 2 holds the rest (fee, areas, consent, widget).
const STEP_ONE_KEYS: readonly (MembershipFieldKey & ErrorKey)[] = [
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
];

const MSG = {
  turnstileMissing: 'Completa la verifica anti-spam qui sopra, poi invia di nuovo.',
  turnstileLoad: 'La verifica anti-spam non si carica: riprova più tardi o scrivici via email.',
  failGeneric: `Non siamo riusciti a inviare la richiesta. I tuoi dati sono ancora qui: riprova tra poco, oppure scrivici a ${MEMBERSHIP_EMAIL}.`,
  failTurnstile: `La verifica anti-spam non è andata a buon fine. I tuoi dati sono ancora qui: riprova, oppure scrivici a ${MEMBERSHIP_EMAIL}.`,
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
  let step: 1 | 2 = 1;
  // A widget reset asked while step 1 shows waits for the next goStep(2); a load error is shown
  // again on step 2.
  let needsReset = false;
  let widgetLoadFailed = false;

  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-socio-step]'));
  const sendArea = $('[data-socio-send]');
  const failBlock = $('[data-socio-fail]');

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
    groupKeys: ['fee', 'areas'],
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
        widgetLoadFailed = false;
        clearError('turnstile');
      },
      onExpire: () => {
        token = '';
      },
      // The script or the widget failed (bad site key or hostname): offer the email way out.
      onError: () => {
        token = '';
        widgetLoadFailed = true;
        showFormError(MSG.turnstileLoad, true);
      },
    });
  };

  // A token is single-use: after any answer but success the widget needs a new one.
  const resetWidget = () => {
    token = '';
    if (step === 2) turnstile?.reset();
    else needsReset = true;
  };

  // --- Steps --------------------------------------------------------------

  // Shows step n and, unless asked not to, moves focus to its heading (read with "Passo n di 2").
  const goStep = (n: 1 | 2, focus = true) => {
    step = n;
    steps.forEach((el) => (el.hidden = el.dataset.socioStep !== String(n)));
    if (n === 2) {
      loadWidget();
      if (needsReset) {
        needsReset = false;
        turnstile?.reset();
      }
      if (widgetLoadFailed) showFormError(MSG.turnstileLoad, true);
    }
    if (focus)
      steps
        .find((el) => !el.hidden)
        ?.querySelector<HTMLElement>('h2')
        ?.focus();
  };

  const next = () => {
    hideFormError();
    clearAllErrors();
    const problems = validateMembershipFields(readFields());
    const keys = STEP_ONE_KEYS.filter((k) => problems[k]);
    if (keys.length > 0) {
      keys.forEach((k) => setError(k, problems[k] ?? ''));
      showFieldSummary(keys);
      return;
    }
    goStep(2);
  };

  const back = () => {
    // The band's field links would point into the hidden step; a load error stays for step 2.
    if (formError && !formError.hidden && !$('[data-socio-form-error-list]')?.hidden)
      hideFormError();
    goStep(1);
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

  // A failure that is not a field error: the block replaces the send area, values stay.
  const showSendFailure = (kind: 'generic' | 'turnstile') => {
    const text = $('[data-socio-fail-text]');
    if (text) text.textContent = kind === 'turnstile' ? MSG.failTurnstile : MSG.failGeneric;
    if (sendArea) sendArea.hidden = true;
    if (failBlock) {
      failBlock.hidden = false;
      failBlock.focus();
    }
  };

  const retry = () => {
    if (failBlock) failBlock.hidden = true;
    if (sendArea) sendArea.hidden = false;
    sendArea?.querySelector<HTMLElement>('button[type="submit"]')?.focus();
  };

  // Field errors, inline; a step-1 field brings the user back to step 1 with its summary only.
  const showInvalid = (
    invalid: readonly ErrorKey[],
    messages: Partial<Record<ErrorKey, string>>,
  ) => {
    invalid.forEach((k) => setError(k, messages[k] ?? ''));
    const stepOne = invalid.filter((k) => (STEP_ONE_KEYS as readonly string[]).includes(k));
    if (stepOne.length > 0) {
      goStep(1, false);
      showFieldSummary(stepOne);
    } else showFieldSummary(invalid);
  };

  const showFailure = (res: MembershipResponse | null) => {
    resetWidget();
    if (!res || res.ok) {
      showSendFailure('generic');
      return;
    }
    switch (res.error) {
      case 'invalid': {
        const keys = (res.fields ?? []).filter((k): k is MembershipFieldKey & ErrorKey =>
          isErrorKey(k),
        );
        if (keys.length === 0) {
          showSendFailure('generic');
          break;
        }
        showInvalid(keys, MEMBERSHIP_FIELD_MESSAGES);
        break;
      }
      case 'turnstile':
        showSendFailure('turnstile');
        break;
      default:
        showSendFailure('generic');
    }
  };

  // --- Submit -------------------------------------------------------------

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (sending || finished) return;
    // Enter in a step-1 field is Avanti: the one submit goes only from step 2.
    if (step === 1) {
      next();
      return;
    }
    hideFormError();
    clearAllErrors();
    if (status) status.textContent = '';
    loadWidget();

    const fields = readFields();
    const problems = validateMembershipFields(fields);
    const messages: Partial<Record<ErrorKey, string>> = {};
    for (const key of ERROR_KEYS) {
      const message = key === 'turnstile' ? undefined : problems[key];
      if (message) messages[key] = message;
    }
    if (!token) messages.turnstile = MSG.turnstileMissing;
    const keys = ERROR_KEYS.filter((k) => messages[k]);
    if (keys.length > 0) {
      showInvalid(keys, messages);
      return;
    }

    const submit = sendArea?.querySelector<HTMLButtonElement>('button[type="submit"]');
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

  // Localhost preview of the end states (the server sets the attributes only there): no request.
  if (root.dataset.socioPreview === 'conferma' && root.dataset.socioPreviewAnswer) {
    showDone(
      JSON.parse(root.dataset.socioPreviewAnswer) as Extract<MembershipResponse, { ok: true }>,
    );
  } else if (root.dataset.socioPreview === 'errore') {
    goStep(2, false);
    showSendFailure('generic');
  }
  $('[data-socio-back] button')?.addEventListener('click', back);
  $('[data-socio-retry] button')?.addEventListener('click', retry);

  // "Altro" opens its text input; unticked, the input and its error go away.
  const otherBox = $<HTMLInputElement>('#socio-areas-other');
  const otherField = $('[data-socio-other]');
  otherBox?.addEventListener('change', () => {
    if (otherField) otherField.hidden = !otherBox.checked;
    if (!otherBox.checked) clearError('areasOther');
  });

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
