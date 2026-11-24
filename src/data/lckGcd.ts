import data from './lck-gcd.json';
export interface GcdRow {team:string;player:string;expires:string}
export interface GcdChange extends GcdRow {kind:'added'|'removed'|'expiry';previousExpires?:string}
interface GcdSnapshot {version:number;source:string;sourceDate:string|null;capturedAt:string|null;rows:GcdRow[];changes:GcdChange[]}
export const GCD = data as GcdSnapshot;
export const GCD_BASELINE = '2026-11-24';
// The official sheet does not identify positions in the KR tab. Never promote an unknown
// registration into a confirmed starter or infer free agency from a missing row.
export function syncedExpiry(team:string,player:string|null,snapshot:GcdSnapshot=GCD):string|null{
 if(!player||!snapshot.sourceDate||snapshot.sourceDate<GCD_BASELINE)return null;
 const row=snapshot.rows.find(r=>r.team===team&&r.player.toLowerCase()===player.toLowerCase());
 return row&&row.expires>snapshot.sourceDate&&row.expires>='2027-01-01'?row.expires:null;
}
