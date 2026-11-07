// Unpacks bundle.json (source files), copies repo img/ into public/img, runs tools/build.js. Used as Vercel buildCommand.
const fs = require('fs/promises'); const path = require('path');
(async () => {
  const ROOT = path.join(__dirname, 'src');
  const bundle = JSON.parse(await fs.readFile(path.join(__dirname, 'bundle.json'), 'utf8'));
  for (const [rel, b64] of Object.entries(bundle.files)) { const fp = path.join(ROOT, rel); await fs.mkdir(path.dirname(fp), { recursive: true }); await fs.writeFile(fp, Buffer.from(b64, 'base64')); }
  await fs.mkdir(path.join(ROOT, 'public', 'img'), { recursive: true });
  try { await fs.cp(path.join(__dirname, 'img'), path.join(ROOT, 'public', 'img'), { recursive: true }); } catch (e) { console.log('no img dir', e.message); }
  const code = await fs.readFile(path.join(ROOT, 'tools', 'build.js'), 'utf8');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const res = await new AsyncFunction('fs', 'path', 'ROOT', code)(fs, path, ROOT);
  await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
  await fs.cp(path.join(ROOT, 'dist'), path.join(__dirname, 'dist'), { recursive: true });
  console.log('built', JSON.stringify(res), 'bundle', bundle.created);
  if (res.missingImgs && res.missingImgs.length) console.log('MISSING IMAGES', res.missingImgs.join(', '));
  if (process.env.VERCEL_ENV === 'production' && res.indexnowKey && res.recent && res.recent.length) {
    const host = new URL(res.baseUrl).host; const body = JSON.stringify({ host, key: res.indexnowKey, keyLocation: res.baseUrl + '/' + res.indexnowKey + '.txt', urlList: res.recent.concat([res.baseUrl + '/', res.baseUrl + '/calendar/']) });
    for (const ep of ['https://api.indexnow.org/indexnow', 'https://searchadvisor.naver.com/indexnow']) { try { const r = await fetch(ep, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body }); console.log('indexnow', ep, r.status, res.recent.length); } catch (e) { console.log('indexnow fail', ep, e.message); } }
  }
})().catch(e => { console.error(e); process.exit(1); });
