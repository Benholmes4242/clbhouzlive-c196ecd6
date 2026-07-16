const fs = require('fs');
const dir = 'public/locales';
const nss = ['common', 'auth', 'composer'];
const accents = { a:'á',b:'ƀ',c:'ĉ',d:'đ',e:'é',f:'ƒ',g:'ĝ',h:'ĥ',i:'í',j:'ĵ',k:'ǩ',l:'ļ',m:'ɱ',n:'ñ',o:'ő',p:'ƥ',q:'ʠ',r:'ř',s:'š',t:'ţ',u:'ú',v:'ṽ',w:'ŵ',x:'ẋ',y:'ý',z:'ž',A:'Á',B:'Ɓ',C:'Ĉ',D:'Đ',E:'É',F:'Ƒ',G:'Ĝ',H:'Ĥ',I:'Í',J:'Ĵ',K:'Ǩ',L:'Ļ',M:'Ṁ',N:'Ñ',O:'Ő',P:'Ƥ',Q:'Ǫ',R:'Ř',S:'Š',T:'Ţ',U:'Ú',V:'Ṽ',W:'Ŵ',X:'Ẋ',Y:'Ý',Z:'Ž' };
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
  const r = {};
  for (const k of Object.keys(o)) r[k] = walk(o[k]);
  return r;
}
for (const ns of nss) {
  const p = dir + '/en/' + ns + '.json';
  if (!fs.existsSync(p)) continue;
  const en = JSON.parse(fs.readFileSync(p, 'utf8'));
  fs.writeFileSync(dir + '/en-XA/' + ns + '.json', JSON.stringify(walk(en), null, 2) + '\n');
  for (const l of ['ja','ko','es','de']) {
    fs.writeFileSync(dir + '/' + l + '/' + ns + '.json', JSON.stringify(en, null, 2) + '\n');
  }
}
console.log('ok');
