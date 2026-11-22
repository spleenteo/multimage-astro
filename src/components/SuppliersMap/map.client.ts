import type { GeoJSONSource } from 'maplibre-gl';
import type { SuppliersMapPoint } from './index.astro';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const NAVY = '#004881';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Loads MapLibre on demand and draws the points, clustered, with an Italian popup each. */
export async function mountSuppliersMap(container: HTMLElement) {
  const dataNode = container.parentElement?.querySelector('[data-suppliers-points]');
  const points: SuppliersMapPoint[] = JSON.parse(dataNode?.textContent ?? '[]');
  if (points.length === 0) return;

  const [maplibre, worker] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  const { Map, Popup, NavigationControl, LngLatBounds, setWorkerUrl } = maplibre;
  // Point MapLibre at its worker file explicitly: bundlers move it away from the main module.
  setWorkerUrl(worker.default);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bounds = new LngLatBounds();
  points.forEach((point) => bounds.extend([point.longitude, point.latitude]));

  container.innerHTML = '';
  const map = new Map({
    container,
    style: STYLE_URL,
    bounds,
    fitBoundsOptions: { padding: 48, maxZoom: 12 },
    cooperativeGestures: true,
    attributionControl: false,
    locale: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rotellina per ingrandire la mappa',
      'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rotellina per ingrandire la mappa',
      'CooperativeGesturesHandler.MobileHelpText': 'Usa due dita per spostare la mappa',
      'NavigationControl.ZoomIn': 'Ingrandisci',
      'NavigationControl.ZoomOut': 'Riduci',
      'NavigationControl.ResetBearing': 'Orienta a nord',
    },
  });
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

  map.on('load', () => {
    // The base map in Italian, where OpenStreetMap has the name; the local name otherwise.
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field')) {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', 'name:it'],
          ['get', 'name:latin'],
          ['get', 'name'],
        ]);
      }
    }

    map.addSource('places', {
      type: 'geojson',
      cluster: true,
      clusterRadius: 36,
      clusterMaxZoom: 13,
      data: {
        type: 'FeatureCollection',
        features: points.map((point) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
          properties: {
            id: point.id,
            name: point.name,
            place: point.place,
            directionsUrl: point.directionsUrl ?? '',
          },
        })),
      },
    });

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'places',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': NAVY,
        'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 10, 24],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'places',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 13,
        'text-font': ['Noto Sans Bold'],
      },
      paint: { 'text-color': '#ffffff' },
    });
    map.addLayer({
      id: 'place',
      type: 'circle',
      source: 'places',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': NAVY,
        'circle-radius': 7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map.on('click', 'clusters', async (event) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') return;
      const source = map.getSource<GeoJSONSource>('places');
      if (!source) return;
      const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
      const [lng, lat] = feature.geometry.coordinates;
      map.easeTo({ center: [lng, lat], zoom, duration: reducedMotion ? 0 : 500 });
    });

    map.on('click', 'place', (event) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') return;
      const { id, name, place, directionsUrl } = feature.properties as Record<string, string>;
      const [lng, lat] = feature.geometry.coordinates;
      const directions = directionsUrl
        ? `<a href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener noreferrer">Indicazioni<span class="sr-only"> (si apre in una nuova scheda)</span></a>`
        : '';
      new Popup({ offset: 12, maxWidth: '260px' })
        .setLngLat([lng, lat])
        .setHTML(
          `<p class="suppliers-map-name">${escapeHtml(name)}</p>` +
            (place ? `<p>${escapeHtml(place)}</p>` : '') +
            `<p class="suppliers-map-links"><a href="#luogo-${escapeHtml(id)}">Vedi nell'elenco</a>${directions}</p>`,
        )
        .addTo(map);
    });

    for (const layer of ['clusters', 'place']) {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }
  });
}
