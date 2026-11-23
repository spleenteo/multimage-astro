import { readFileSync } from 'node:fs';
const [file, runsArg, topN] = process.argv.slice(2);
const runs = Number(runsArg ?? 5);
const profile = JSON.parse(readFileSync(file, 'utf8'));
const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const dts = profile.timeDeltas;
const sorted = [...dts].sort((a, b) => a - b);
const med = sorted[sorted.length >> 1];
const CAP = med * 3; // a longer gap = isolate was not running (I/O wait), not CPU
const self = new Map();
let raw = 0;
profile.samples.forEach((s, i) => { const d = dts[i] ?? 0; raw += d; self.set(s, (self.get(s) ?? 0) + Math.min(d, CAP)); });
const short = (u) => u.replace(/^.*\/dist\/server\//, '') || '(native)';
const byFn = new Map(), byFile = new Map(); let total = 0;
for (const [nid, us] of self) {
  const cf = nodes.get(nid).callFrame;
  if (['(idle)', '(program)', '(root)'].includes(cf.functionName)) continue;
  total += us;
  const k = `${cf.functionName || '(anon)'} — ${short(cf.url)}:${cf.lineNumber + 1}`;
  byFn.set(k, (byFn.get(k) ?? 0) + us);
  byFile.set(short(cf.url), (byFile.get(short(cf.url)) ?? 0) + us);
}
const ms = (us) => (us / 1000 / runs).toFixed(1).padStart(6);
console.log(`samples ${dts.length}, median delta ${med} µs, gaps>cap ${dts.filter((d) => d > CAP).length}, raw ${(raw / 1000 / runs).toFixed(0)} ms/req`);
console.log(`CPU (capped) ${ms(total)} ms/request`);
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
for (const [k, v] of top(byFn, Number(topN ?? 14))) console.log(ms(v), ((v / total) * 100).toFixed(1).padStart(5) + '%', k);
console.log('by file:');
for (const [k, v] of top(byFile, 6)) console.log(ms(v), ((v / total) * 100).toFixed(1).padStart(5) + '%', k);
