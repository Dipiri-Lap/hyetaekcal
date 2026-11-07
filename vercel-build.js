// Unpacks bundle.json (source files) and runs tools/build.js. Used as Vercel buildCommand.
const fs = require('fs/promises'); const path = require('path');
(async () => {
  const ROOT = path.join(__dirname, 'src');
  const bundle = JSON.parse(await fs.readFile(path.join(__dirname, 'bundle.json'), 'utf8'));
  for (const [rel, b64] of Object.entries(bundle.files)) { const fp = path.join(ROOT, rel); await fs.mkdir(path.dirname(fp), { recursive: true }); await fs.writeFile(fp, Buffer.from(b64, 'base64')); }
  const code = await fs.readFile(path.join(ROOT, 'tools', 'build.js'), 'utf8');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const res = await new AsyncFunction('fs', 'path', 'ROOT', code)(fs, path, ROOT);
  await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
  await fs.cp(path.join(ROOT, 'dist'), path.join(__dirname, 'dist'), { recursive: true });
  console.log('built', JSON.stringify(res), 'bundle', bundle.created);
})().catch(e => { console.error(e); process.exit(1); });
