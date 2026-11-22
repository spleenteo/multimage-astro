import type { AssetImage } from './datocms/types';
import { toRichTextHtml } from './text';

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildGoogleMapsUrl(
  supplier: SupplierRecord,
  normalizedAddress: string | null,
): string | null {
  const latitude = supplier.map?.latitude;
  const longitude = supplier.map?.longitude;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  const queryParts = [
    normalizedAddress,
    normalize(supplier.city),
    normalize(supplier.region),
  ].filter((part): part is string => Boolean(part));

  if (queryParts.length === 0) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(', '))}`;
}

type SupplierMapLocation = {
  latitude: number | null;
  longitude: number | null;
} | null;

export type SupplierRecord = {
  id: string;
  name: string | null;
  logo: AssetImage | null;
  city: string | null;
  region: string | null;
  address: string | null;
  telephone: string | null;
  description: string | null;
  url: string | null;
  email: string | null;
  map: SupplierMapLocation;
};

export type SupplierCardViewModel = {
  id: string;
  name: string;
  region: string;
  city: string;
  address: string | null;
  googleMapsUrl: string | null;
  telephone: string | null;
  email: string | null;
  website: string | null;
  descriptionHtml: string | null;
  logo: AssetImage | null;
  /** From the CMS `map` field; both null when the record has no point. */
  latitude: number | null;
  longitude: number | null;
};

export function toSupplierCard(record: SupplierRecord): SupplierCardViewModel {
  const name = normalize(record.name) ?? 'Distributore in aggiornamento';
  const region = normalize(record.region) ?? 'Da definire';
  const city = normalize(record.city) ?? '';
  const address = normalize(record.address);
  const telephone = normalize(record.telephone);
  const email = normalize(record.email);
  const website = normalize(record.url);
  const descriptionHtml = toRichTextHtml(record.description ?? null);

  const googleMapsUrl = buildGoogleMapsUrl(record, address);

  return {
    id: record.id,
    name,
    region,
    city,
    address,
    googleMapsUrl,
    telephone,
    email,
    website,
    descriptionHtml,
    logo: record.logo ?? null,
    latitude: typeof record.map?.latitude === 'number' ? record.map.latitude : null,
    longitude: typeof record.map?.longitude === 'number' ? record.map.longitude : null,
  };
}

// Italian area codes with three digits; the others have four (mobiles: 3xx).
const THREE_DIGIT_PREFIXES = new Set([
  '010', '011', '015', '019', '030', '031', '035', '039', '040', '041', '045', '049', '050', '051',
  '055', '059', '070', '071', '075', '079', '080', '081', '085', '089', '090', '091', '095', '099',
]);

function formatItalianNumber(digits: string): string {
  if (digits.startsWith('3') && digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.startsWith('0')) {
    const prefixLength = /^0[26]/.test(digits) ? 2 : THREE_DIGIT_PREFIXES.has(digits.slice(0, 3)) ? 3 : 4;
    return `${digits.slice(0, prefixLength)} ${digits.slice(prefixLength)}`;
  }
  return digits;
}

export type SupplierPhone = {
  /** Who answers ("Roberto Innocenti"), when the CMS names a person. */
  label: string | null;
  display: string;
  /** `tel:` target; null for fax numbers, which are shown but not dialled. */
  href: string | null;
};

/**
 * The CMS telephone field is free text ("06.3218874", "Tel 0571 72746 - Fax 0571 534497",
 * "Roberto Innocenti tel. 3290759899", "011.18892655-347.5977883"): pull out each number,
 * format it the Italian way and make it dialable. Text that holds no number stays as it is.
 */
export function parseSupplierPhones(raw: string | null): SupplierPhone[] {
  if (!raw) return [];
  const pattern = /(\+39[\s.]?)?(\d[\d .]{4,}\d)/g;
  const phones: SupplierPhone[] = [];
  let cursor = 0;
  for (const match of raw.matchAll(pattern)) {
    const digits = match[2].replace(/\D/g, '');
    if (digits.length < 6) continue;
    const before = raw.slice(cursor, match.index).replace(/[-–,;/]/g, ' ').trim();
    cursor = (match.index ?? 0) + match[0].length;
    const isFax = /fax/i.test(before);
    const label = before.replace(/\b(tel|telefono|fax|cell)\.?/gi, '').trim() || null;
    phones.push({
      label,
      display: `${isFax ? 'fax ' : ''}${formatItalianNumber(digits)}`,
      href: isFax ? null : `tel:+39${digits}`,
    });
  }
  return phones.length > 0 ? phones : [{ label: null, display: raw.trim(), href: null }];
}

/** "facebook.com" says little as a link: name the network, else the bare host. */
export function supplierWebsiteLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '');
    if (/(^|\.)facebook\.com$/i.test(host)) return 'Facebook';
    if (/(^|\.)instagram\.com$/i.test(host)) return 'Instagram';
    return host;
  } catch {
    return url.replace(/^https?:\/\//i, '');
  }
}

export function mapSuppliersToCards(records: Array<SupplierRecord> | null | undefined) {
  return (records ?? []).map(toSupplierCard);
}

export type SupplierRegionGroup = {
  region: string;
  suppliers: SupplierCardViewModel[];
};

export function groupSuppliersByRegion(suppliers: SupplierCardViewModel[]): SupplierRegionGroup[] {
  const groups = new Map<string, SupplierCardViewModel[]>();

  for (const supplier of suppliers) {
    const regionKey = supplier.region || 'Altre regioni';
    if (!groups.has(regionKey)) {
      groups.set(regionKey, []);
    }
    groups.get(regionKey)?.push(supplier);
  }

  return Array.from(groups.entries())
    .sort(([regionA], [regionB]) => regionA.localeCompare(regionB, 'it', { sensitivity: 'base' }))
    .map(([region, items]) => ({
      region,
      suppliers: items.sort((a, b) => {
        const cityComparison = a.city.localeCompare(b.city, 'it', { sensitivity: 'base' });
        if (cityComparison !== 0) {
          return cityComparison;
        }
        return a.name.localeCompare(b.name, 'it', { sensitivity: 'base' });
      }),
    }));
}
