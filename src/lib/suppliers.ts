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
  };
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
