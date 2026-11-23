// Usage: node profile.mjs <path> [runs]  → CPU profile of uncached renders on local workerd
import { writeFileSync } from 'node:fs';
const path = process.argv[2];
const runs = Number(process.argv[3] ?? 5);
const out = process.argv[4];
const get = async () => {
  const r = await fetch('http://127.0.0.1:8790' + path, { headers: { Cookie: '__draftMode=measure' } });
  const b = await r.text();
  return { status: r.status, bytes: b.length };
};
// warm-up (module init, JIT) outside the profile
console.log('warm', await get(), await get());
const ws = new WebSocket(process.env.WS);
ws.onclose = (e) => console.log('ws closed', e.code);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
  }
};
await new Promise((r) => (ws.onopen = r));
await send('Profiler.enable');
await send('Profiler.setSamplingInterval', { interval: 100 });
await send('Profiler.start');
for (let i = 0; i < runs; i++) await get();
const { profile } = await send('Profiler.stop');
ws.close();
if (out) writeFileSync(out, JSON.stringify(profile));

const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dts = profile.timeDeltas;
profile.samples.forEach((s, i) => self.set(s, (self.get(s) ?? 0) + (dts[i] ?? 0)));
const parent = new Map();
for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const short = (u) => u.replace(/^.*\/dist\/server\//, '').replace(/^file:\/\//, '') || '(native)';
const byFn = new Map(), byFile = new Map();
let total = 0, idle = 0;
for (const [nid, us] of self) {
  const cf = nodes.get(nid).callFrame;
  if (cf.functionName === '(idle)' || cf.functionName === '(program)') { idle += us; continue; }
  total += us;
  const k = `${cf.functionName || '(anon)'} — ${short(cf.url)}:${cf.lineNumber + 1}`;
  byFn.set(k, (byFn.get(k) ?? 0) + us);
  byFile.set(short(cf.url), (byFile.get(short(cf.url)) ?? 0) + us);
}
const ms = (us) => (us / 1000 / runs).toFixed(1).padStart(7);
console.log(`\n${path}: active CPU ${ms(total)} ms/request over ${runs} runs (idle+program excluded: ${ms(idle)})`);
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
console.log('\nSelf time by function (ms/request):');
for (const [k, v] of top(byFn, 25)) console.log(ms(v), ((v / total) * 100).toFixed(1).padStart(5) + '%', k);
console.log('\nSelf time by file (ms/request):');
for (const [k, v] of top(byFile, 12)) console.log(ms(v), ((v / total) * 100).toFixed(1).padStart(5) + '%', k);
