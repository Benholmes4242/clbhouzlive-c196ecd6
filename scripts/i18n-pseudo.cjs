const fs = require('fs');
const path = require('path');
const dir = 'public/locales';
// Wave 3d — include every catalog. Regenerating en-XA is idempotent and
// mirrors en for the source locales that aren't translated yet.
const nss = ['common', 'auth', 'composer', 'messaging', 'achievements', 'courses'];
const accents = { a:'á',b:'ƀ',c:'ĉ',d:'đ',e:'é',f:'ƒ',g:'ĝ',h:'ĥ',i:'í',j:'ĵ',k:'ǩ',l:'ļ',m:'ɱ',n:'ñ',o:'ő',p:'ƥ',q:'ʠ',r:'ř',s:'š',t:'ţ',u:'ú',v:'ṽ',w:'ŵ',x:'ẋ',y:'ý',z:'ž',A:'Á',B:'Ɓ',C:'Ĉ',D:'Đ',E:'É',F:'Ƒ',G:'Ĝ',H:'Ĥ',I:'Í',J:'Ĵ',K:'Ǩ',L:'Ļ',M:'Ṁ',N:'Ñ',O:'Ő',P:'Ƥ',Q:'Ǫ',R:'Ř',S:'Š',T:'Ţ',U:'Ú',V:'Ṽ',W:'Ŵ',X:'Ẋ',Y:'Ý',Z:'Ž' };
// Padding: ~35% expansion via bracket wrapping + tilde markers.
// Preserves ICU {{tokens}} and JSX/HTML <tags> verbatim so interpolation
// and <Trans> markup keep working under the pseudo locale.
function pseudo(s) {
  const parts = s.split(/(\{\{[^}]+\}\}|<\/?[a-zA-Z][^>]*>)/g);
  const mapped = parts.map(function (p) {
    if (/^\{\{/.test(p) || /^</.test(p)) return p;
    return [...p].map(function (c) { return accents[c] || c; }).join('');
  });
  return '[~~' + mapped.join('') + '~~]';
}
function walk(o) {
  if (typeof o === 'string') return pseudo(o);
  if (Array.isArray(o)) return o.map(walk);
  const r = {};
  for (const k of Object.keys(o)) r[k] = walk(o[k]);
  return r;
}
for (const ns of nss) {
  const p = path.join(dir, 'en', ns + '.json');
  if (!fs.existsSync(p)) { console.log('skip ' + ns + ' (no en source)'); continue; }
  const en = JSON.parse(fs.readFileSync(p, 'utf8'));
  const xaDir = path.join(dir, 'en-XA');
  if (!fs.existsSync(xaDir)) fs.mkdirSync(xaDir, { recursive: true });
  fs.writeFileSync(path.join(xaDir, ns + '.json'), JSON.stringify(walk(en), null, 2) + '\n');
  for (const l of ['ja', 'ko', 'es', 'de']) {
    const lDir = path.join(dir, l);
    if (!fs.existsSync(lDir)) fs.mkdirSync(lDir, { recursive: true });
    const target = path.join(lDir, ns + '.json');
    // Only seed missing catalogs — don't clobber existing translations.
    if (!fs.existsSync(target)) {
      fs.writeFileSync(target, JSON.stringify(en, null, 2) + '\n');
    }
  }
  console.log('ok ' + ns);
}
