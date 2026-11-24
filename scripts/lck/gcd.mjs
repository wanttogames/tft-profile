// Only the public Riot GCD KR tab. Never persist legal names or contact columns.
export const SOURCE = 'https://docs.google.com/spreadsheets/d/1Y7k5kQ2AegbuyiGwEPsa62e883FYVtHqr6UVut9RC4o/pubhtml#gid=905624073';
export const CSV_URL = SOURCE.split('/pubhtml')[0]+'/pub?gid=905624073&single=true&output=csv';
const aliases={
 t1:['t1'],geng:['gen.g','geng','gen.g esports'],hle:['hanwha life esports','hanwha life','hle'],
 dk:['dplus kia','dk','dwg kia'],kt:['kt rolster','kt'],ns:['nongshim redforce','nongshim red force','ns'],
 bfx:['bnk fearx','bnk fear x','fearx','bfx'],dns:['dn supers','dn super s','dn freecs','dn soopers','dn soop ers','dn soop','dns','dnf','kwangdong freecs'],
 bro:['hanjin brion','hanjin brion esports','ok savingsbank brion','oksavingsbank brion','brion','bro'],
 krx:['kiwoom drx','kiwoomdrx','drx','krx']
};
const norm=s=>s.trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const teamMap=new Map(Object.entries(aliases).flatMap(([key,values])=>values.map(v=>[norm(v),key])));
export function parseCsv(input){
 const text=input.replace(/^\uFEFF/,'');let row=[],cell='',quoted=false,closed=false,rows=[];
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;continue;}
  if(ch==='"'&&!cell&&!closed){quoted=true;continue;}
  if(ch===','||ch==='\n'||ch==='\r'){
   row.push(cell.trim());cell='';closed=false;
   if(ch!==','){if(ch==='\r'&&text[i+1]==='\n')i++;rows.push(row);row=[];}
  }else {if(closed||ch==='"')throw Error('Malformed CSV cell');cell+=ch;}
 }
 if(quoted)throw Error('Unclosed CSV quote');
 if(cell||row.length||closed){row.push(cell.trim());rows.push(row);}
 return rows;
}
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
export function isoDate(raw){
 const s=raw.trim();let y,m,d;
 let match=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
 if(match){[,y,m,d]=match;}else if((match=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))){[,m,d,y]=match;}
 else if((match=s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/))){m=months.findIndex(v=>v===match[1].toLowerCase()||v.slice(0,3)===match[1].toLowerCase())+1;d=match[2];y=match[3];}else return null;
 const n=[Number(y),Number(m),Number(d)];if(n[0]<2020||n[0]>2040||n[1]<1||n[1]>12||n[2]<1||n[2]>31)return null;
 const iso=n[0]+'-'+String(n[1]).padStart(2,'0')+'-'+String(n[2]).padStart(2,'0');
 const date=new Date(iso+'T00:00:00Z');return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===iso?iso:null;
}
export function parseGcd(csv){
 if(csv.length>5_000_000||/^\s*<(?:!doctype|html)/i.test(csv))throw Error('Unexpected source response');
 const table=parseCsv(csv);
 const index=table.findIndex(r=>{const h=r.map(norm);return h.includes('league')&&h.includes('team')&&h.includes('officialsummonername')&&h.some(v=>v==='enddate'||v.startsWith('enddatemonthdayyear')||v==='contractenddate');});
 if(index<0)throw Error('GCD header not recognized');
 const headers=table[index].map(norm),li=headers.indexOf('league'),ti=headers.indexOf('team'),pi=headers.indexOf('officialsummonername'),di=headers.findIndex(v=>v==='enddate'||v.startsWith('enddatemonthdayyear')||v==='contractenddate');
 const pre=table.slice(0,index).flat().join(' ');
 const stamp=pre.match(/(?:last\s+updated|updated|as\s+of)\s*(?:on|:|-)?\s*((?:[A-Za-z]+\s+\d{1,2},?\s+\d{4})|(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2})|(?:\d{1,2}\/\d{1,2}\/\d{4}))/i);
 const sourceDate=stamp?isoDate(stamp[1]):null;
 const rows=new Map(),names=new Map();let league='',team='',invalid=0,unknown=0;
 for(const r of table.slice(index+1)){
  if(r.every(v=>!v)){league='';team='';continue;}
  if(r[li]){const next=norm(r[li]);if(next!==league)team='';league=next;}
  if(r[ti])team=r[ti];
  if(league!=='lck')continue; // do not import LCK CL, staff from other leagues or retirement list
  const player=(r[pi]??'').trim(),raw=(r[di]??'').trim();
  if(!player&&!raw)continue;
  const slug=teamMap.get(norm(team));
  if(!slug){unknown++;continue;}
  if(!/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/.test(player)){invalid++;continue;}
  const expires=isoDate(raw);if(!expires){invalid++;continue;}
  const id=player.toLowerCase(),key=slug+':'+id;
  if(names.has(id)&&names.get(id)!==slug)throw Error('Duplicate registration across teams');
  names.set(id,slug);
  if(rows.has(key)&&rows.get(key).expires!==expires)throw Error('Conflicting expiry for same registration');
  rows.set(key,{team:slug,player,expires});
 }
 if(unknown||invalid)throw Error('Unmapped team or invalid LCK row: '+unknown+' / '+invalid);
 const result=[...rows.values()].sort((a,b)=>(a.team+':'+a.player.toLowerCase()).localeCompare(b.team+':'+b.player.toLowerCase(),'en'));
 if(result.length<20||new Set(result.map(r=>r.team)).size<8)throw Error('Incomplete LCK snapshot');
 return {sourceDate,rows:result};
}
export function diffRows(before,after){
 const key=r=>r.team+':'+r.player.toLowerCase(),old=new Map(before.map(r=>[key(r),r])),next=new Map(after.map(r=>[key(r),r]));
 const changes=[];
 for(const [k,r] of next){const prev=old.get(k);if(!prev)changes.push({kind:'added',...r});else if(prev.expires!==r.expires)changes.push({kind:'expiry',...r,previousExpires:prev.expires});}
 for(const [k,r] of old)if(!next.has(k))changes.push({kind:'removed',...r});
 return changes;
}
export function nextSnapshot(previous,parsed,now){
 if(previous.version!==1||!Array.isArray(previous.rows))throw Error('Invalid previous snapshot');
 if(parsed.sourceDate&&parsed.sourceDate>now.slice(0,10))throw Error('Future GCD date');
 if(previous.sourceDate&&(!parsed.sourceDate||parsed.sourceDate<previous.sourceDate))throw Error('Missing or regressed GCD date');
 if(previous.rows.length&&parsed.rows.length<Math.ceil(previous.rows.length*.7))throw Error('Registration count fell over 30%; manual review required');
 if(previous.rows.length&&new Set(parsed.rows.map(r=>r.team)).size<new Set(previous.rows.map(r=>r.team)).size)throw Error('Team coverage decreased; manual review required');
 const changes=diffRows(previous.rows,parsed.rows);
 if(previous.capturedAt&&!changes.length&&previous.sourceDate===parsed.sourceDate)return previous;
 return {version:1,source:SOURCE,sourceDate:parsed.sourceDate,capturedAt:now,rows:parsed.rows,changes:previous.capturedAt?changes:[]};
}
