// /diventa-socio page script: validates the membership form, shows the field errors and the
// summary, shows the "Altro" field and runs Turnstile. The send path comes with V2.
// The markup contract (data-socio-* attributes, ids `socio-<key>`) is defined in index.astro.
import { createFieldErrors, loadTurnstile } from '~/lib/form.client';
import {
  AREA_OTHER,
  MEMBERSHIP_ACTION,
  MEMBERSHIP_EMAIL,
  MEMBERSHIP_LABELS,
  validateMembershipFields,
  type MembershipFields,
} from '~/lib/membership';

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
  'payment',
  'areas',
  'areasOther',
  'consent',
  'turnstile',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

const MSG = {
  turnstileMissing: 'Completa la verifica anti-spam qui sopra, poi invia di nuovo.',
  turnstileLoad: 'La verifica anti-spam non si carica: riprova più tardi o scrivici via email.',
  notActive: `L'invio dal sito non è ancora attivo: scrivi a ${MEMBERSHIP_EMAIL}.`,
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
  const othersField = $('[data-socio-areas-other]');

  let token = '';
  let turnstileRequested = false;

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
    groupKeys: ['fee', 'payment', 'areas'],
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
    const areas = checked('areas').map((el) => el.value);
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
      payment: checked('payment')[0]?.value ?? '',
      areas,
      areasOther: areas.includes(AREA_OTHER) ? val('areasOther') : '',
      consent: $<HTMLInputElement>('#socio-consent')?.checked ?? false,
    };
  };

  const syncOthers = () => {
    if (othersField) othersField.hidden = !readFields().areas.includes(AREA_OTHER);
  };

  // --- Turnstile ----------------------------------------------------------

  const loadWidget = () => {
    const sitekey = form.dataset.sitekey;
    const container = $('#socio-turnstile');
    if (!sitekey || !container || turnstileRequested) return;
    turnstileRequested = true;
    // The widget handle (reset) is needed once the send path exists, in V2.
    loadTurnstile({
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

  // --- Submit -------------------------------------------------------------

  const onSubmit = (event: Event) => {
    event.preventDefault();
    hideFormError();
    clearAllErrors();
    if (status) status.textContent = '';
    loadWidget();

    const problems = validateMembershipFields(readFields());
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

    // Until V2 the send path does not exist: say so.
    if (status) status.textContent = MSG.notActive;
  };

  form.addEventListener('submit', onSubmit);
  form.addEventListener('focusin', loadWidget, { once: true });

  const onFieldChange = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    if (target.name === 'areas') {
      syncOthers();
      if (!readFields().areas.includes(AREA_OTHER)) clearError('areasOther');
    }
    const key = target.name || target.id.replace(/^socio-/, '');
    if (!isErrorKey(key) || key === 'turnstile') return;
    const el = errorEl(key);
    if (!el || el.hidden) return;
    if (!validateMembershipFields(readFields())[key]) clearError(key);
  };
  form.addEventListener('input', onFieldChange);
  form.addEventListener('change', onFieldChange);

  syncOthers();
}
