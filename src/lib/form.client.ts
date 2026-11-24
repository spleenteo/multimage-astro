// Browser helpers shared by the forms (/borsa order, /diventa-socio membership): the Cloudflare
// Turnstile loader and the field error handling. No server code and no page-specific imports.

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

/** Injects the Turnstile script once; resolves when `window.turnstile` is usable. */
const ensureScript = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      scriptPromise = null; // a later call may try again
      script.remove();
      reject(new Error('Turnstile script failed to load'));
    });
    document.head.append(script);
  });
  return scriptPromise;
};

export interface TurnstileOptions {
  container: HTMLElement;
  sitekey: string;
  action: string;
  onToken: (token: string) => void;
  onExpire: () => void;
  /** The script did not load, or the widget failed (bad site key or hostname). */
  onError: () => void;
}

/** Loads Turnstile (once per page) and renders a widget; callable at any time, not only at init. */
export function loadTurnstile(options: TurnstileOptions): { reset: () => void } {
  let widgetId: string | undefined;
  ensureScript()
    .then(() => {
      if (!window.turnstile) throw new Error('Turnstile is missing');
      widgetId = window.turnstile.render(options.container, {
        sitekey: options.sitekey,
        action: options.action,
        language: 'it',
        size: 'flexible',
        callback: options.onToken,
        'expired-callback': options.onExpire,
        'error-callback': options.onError,
      });
    })
    .catch(() => options.onError());
  return {
    reset: () => {
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
    },
  };
}

export const checkFieldsLabel = (n: number) =>
  n === 1 ? 'Controlla 1 campo:' : `Controlla ${n} campi:`;

export interface FieldErrorsOptions<K extends string> {
  root: HTMLElement;
  /** Controls are `#<idPrefix>-<key>`, error paragraphs `[data-error-for="<key>"]`. */
  idPrefix: string;
  /** Field keys in DOM order: the summary lists them in this order. */
  keys: readonly K[];
  /** The names the summary links to, as the labels and legends read. */
  names: Record<K, string>;
  /** Keys whose control is a fieldset of inputs named after the key (radio groups). */
  groupKeys?: readonly K[];
  /** Keys whose control is a plain element: no aria-invalid. */
  plainKeys?: readonly K[];
  box: HTMLElement | null;
  boxText: HTMLElement | null;
  boxList: HTMLElement | null;
  /** The email way out inside the box, shown on request. */
  mailto?: HTMLElement | null;
}

export function createFieldErrors<K extends string>(options: FieldErrorsOptions<K>) {
  const { root, idPrefix, keys, names, box, boxText, boxList, mailto } = options;
  const groupKeys: readonly string[] = options.groupKeys ?? [];
  const plainKeys: readonly string[] = options.plainKeys ?? [];

  const errorEl = (key: K) => root.querySelector<HTMLElement>(`[data-error-for="${key}"]`);

  const controlFor = (key: K): HTMLElement | null => {
    if (groupKeys.includes(key))
      return root.querySelector<HTMLElement>(`input[name="${key}"]`)?.closest('fieldset') ?? null;
    return root.querySelector<HTMLElement>(`#${idPrefix}-${key}`);
  };

  // A group's focus goes to its checked input, else its first.
  const focusTarget = (key: K): HTMLElement | null => {
    if (groupKeys.includes(key)) {
      return (
        root.querySelector<HTMLElement>(`input[name="${key}"]:checked`) ??
        root.querySelector<HTMLElement>(`input[name="${key}"]`)
      );
    }
    return controlFor(key);
  };

  const setError = (key: K, message: string) => {
    const el = errorEl(key);
    const control = controlFor(key);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
    if (control) {
      // A plain container (the widget div) has no use for aria-invalid.
      if (!plainKeys.includes(key)) control.setAttribute('aria-invalid', 'true');
      // Keep the hint ids the markup already gave the control, then append the error id.
      if (control.dataset.fieldHints === undefined)
        control.dataset.fieldHints = control.getAttribute('aria-describedby') ?? '';
      if (el?.id)
        control.setAttribute(
          'aria-describedby',
          [control.dataset.fieldHints, el.id].filter(Boolean).join(' '),
        );
    }
  };

  const clearError = (key: K) => {
    const el = errorEl(key);
    const control = controlFor(key);
    if (el) {
      el.textContent = '';
      el.hidden = true;
    }
    if (control) {
      control.removeAttribute('aria-invalid');
      const hints = control.dataset.fieldHints;
      if (hints) control.setAttribute('aria-describedby', hints);
      else if (hints === '') control.removeAttribute('aria-describedby');
    }
  };

  const clearAll = () => keys.forEach(clearError);

  const showFormError = (text: string, withMailto: boolean) => {
    if (!box || !boxText) return;
    boxText.textContent = text;
    if (mailto) mailto.hidden = !withMailto;
    if (boxList) {
      boxList.replaceChildren();
      boxList.hidden = true;
    }
    box.hidden = false;
  };

  const hideFormError = () => {
    if (!box || !boxText) return;
    boxText.textContent = '';
    boxList?.replaceChildren();
    box.hidden = true;
  };

  // The summary of invalid fields (client check or server answer): "Controlla N campi:" and one
  // link per field, in DOM order, each moving focus to its control. Focus goes to the box.
  const showFieldSummary = (invalid: readonly K[]) => {
    const ordered = keys.filter((k) => invalid.includes(k));
    showFormError(checkFieldsLabel(ordered.length), false);
    if (boxList) {
      boxList.replaceChildren(
        ...ordered.map((key) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.textContent = names[key];
          a.setAttribute('href', `#${idPrefix}-${key}-error`);
          a.addEventListener('click', (event) => {
            event.preventDefault();
            focusTarget(key)?.focus();
          });
          li.append(a);
          return li;
        }),
      );
      boxList.hidden = ordered.length === 0;
    }
    box?.focus();
  };

  return {
    errorEl,
    setError,
    clearError,
    clearAll,
    showFormError,
    hideFormError,
    showFieldSummary,
  };
}
