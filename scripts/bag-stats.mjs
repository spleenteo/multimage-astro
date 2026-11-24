// Bag counters from Workers Analytics Engine (dataset multimage_bag_events, written by /api/evento
// and /api/ordine; see src/lib/bag-events.ts). Aggregate figures only: there is no visitor id.
//
//   npx dotenv -e .env.cloudflare -- npm run stats:bag            # last 30 days
//   npx dotenv -e .env.cloudflare -- npm run stats:bag -- 7       # last 7 days
//
// Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (a token with Account Analytics: Read).
// Counts use SUM(_sample_interval), so they stay right if Analytics Engine samples.

const DATASET = 'multimage_bag_events';
const days = Math.max(1, Math.min(90, Number(process.argv[2]) || 30));
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Account Analytics: Read).');
  process.exit(1);
}

const since = `timestamp > NOW() - INTERVAL '${days}' DAY`;

async function sql(query) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: `${query} FORMAT JSON` },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).data ?? [];
}

const [books, places, funnel] = await Promise.all([
  sql(`SELECT blob2 AS slug, SUM(_sample_interval) AS adds FROM ${DATASET}
       WHERE blob1 = 'add' AND ${since} GROUP BY slug ORDER BY adds DESC LIMIT 20`),
  sql(`SELECT blob3 AS place, SUM(_sample_interval) AS adds FROM ${DATASET}
       WHERE blob1 = 'add' AND ${since} GROUP BY place ORDER BY adds DESC`),
  sql(`SELECT blob1 AS event, SUM(_sample_interval) AS n FROM ${DATASET}
       WHERE blob1 IN ('start', 'order', 'emptied') AND ${since} GROUP BY event`),
]);

const count = (event) => Number(funnel.find((r) => r.event === event)?.n ?? 0);
const started = count('start');
const ordered = count('order');
const emptied = count('emptied');
const dead = Math.max(0, started - ordered - emptied);
const pct = (n) => (started ? ` (${Math.round((n / started) * 100)}%)` : '');

console.log(`\nBorse, ultimi ${days} giorni`);
console.log(`  iniziate      ${started}`);
console.log(`  ordinate      ${ordered}${pct(ordered)}`);
console.log(`  svuotate      ${emptied}${pct(emptied)}`);
console.log(`  rimaste lì    ${dead}${pct(dead)}  (stima: iniziate − ordinate − svuotate)`);

console.log('\nAggiunte per punto di partenza');
for (const r of places) console.log(`  ${String(r.place).padEnd(8)} ${Number(r.adds)}`);

console.log('\nLibri più aggiunti alla borsa');
books.forEach((r, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${String(Number(r.adds)).padStart(5)}  ${r.slug}`),
);
console.log('');
