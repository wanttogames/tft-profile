import {readFile,writeFile,rename} from 'node:fs/promises';
import {CSV_URL,parseGcd,nextSnapshot} from './gcd.mjs';
const path=new URL('../../src/data/lck-gcd.json',import.meta.url);
const previous=JSON.parse(await readFile(path,'utf8'));
let parsed;
if(process.env.LCK_GCD_FIXTURE){
 parsed=parseGcd(await readFile(process.env.LCK_GCD_FIXTURE,'utf8'));
}else{
 const res=await fetch(CSV_URL,{signal:AbortSignal.timeout(30000),headers:{accept:'text/csv'}});
 if(!res.ok)throw Error('GCD HTTP '+res.status);
 const len=Number(res.headers.get('content-length')??0);
 if(len>5_000_000)throw Error('Oversize GCD response');
 parsed=parseGcd(await res.text());
}
const next=nextSnapshot(previous,parsed,new Date().toISOString());
console.log('GCD rows:',next.rows.length,'source date:',next.sourceDate??'not available','changes:',next===previous?0:next.changes.length);
if(next!==previous){
 if(process.argv.includes('--check')||process.env.LCK_GCD_FIXTURE){console.log('Check only; no repository data written');}
 else{const tmp=new URL(path.href+'.tmp');await writeFile(tmp,JSON.stringify(next,null,2)+'\n');await rename(tmp,path);}
}else console.log('No changes; retaining last captured snapshot.');
