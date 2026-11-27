import { loadOfficialPatch } from './officialPatch';
import type { Store } from './supabase';
export const PATCH_SCHEDULE_URL =
  'https://support.riotgames.com/ko-kr/tft/events/patch-schedule-teamfight-tactics/';
type ScheduleRow = { patch: string; date: string };
/** Read only the official schedule table, not prose, dates or arbitrary version numbers. */
export function parsePatchSchedule(html: string): ScheduleRow[] {
  const rows = new Map<string, string>();
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1]!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1]!.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/\s+/g, ' ').trim(),
    );
    if (cells.length !== 2) continue;
    const patch = /^전략적 팀 전투 ([1-9]\d?\.\d{1,2})$/.exec(cells[0]!);
    const date = /^(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일(?:\s*\([^)]*\))?$/.exec(cells[1]!);
    if (!patch || !date) continue;
    const iso = [date[1], date[2]!.padStart(2,'0'), date[3]!.padStart(2,'0')].join('-');
    const time = Date.parse(iso+'T00:00:00Z');
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10)!==iso) throw Error('Invalid schedule date');
    if (rows.has(patch[1]!) && rows.get(patch[1]!)!==iso) throw Error('Conflicting schedule rows');
    rows.set(patch[1]!,iso);
  }
  if (!rows.size) throw Error('Official TFT schedule schema changed');
  return [...rows].map(([patch,date])=>({patch,date})).sort((a,b)=>a.date.localeCompare(b.date));
}
export async function syncPatchCalendar(store: Pick<Store,'request'>, fetcher=fetch) {
  const article=await loadOfficialPatch(fetcher);
  let scheduled: string|null=null, next: string|null=null;
  try {
    const response=await fetcher(PATCH_SCHEDULE_URL,{signal:AbortSignal.timeout(12000),redirect:'error'});
    if (!response.ok) throw Error('Schedule HTTP error');
    const html=await response.text();
    if(html.length>3_000_000) throw Error('Schedule response too large');
    const rows=parsePatchSchedule(html);
    const row=rows.find(r=>r.patch===article.patch);
    if(!row) throw Error('Current patch absent from schedule');
    // Validate publication proximity before passing calendar data to DB.
    const publicationDay=Date.parse(article.publishedAt.slice(0,10)+'T00:00:00Z');
    if(Math.abs(Date.parse(row.date+'T00:00:00Z')-publicationDay)>2*86400000) throw Error('Schedule/article disagreement');
    scheduled=row.date;
    const candidate=rows.find(r=>r.date>row.date);
    if(candidate && Date.parse(candidate.date)-Date.parse(row.date)<=60*86400000) next=candidate.date;
  } catch {
    console.warn('[patch-calendar] Schedule unavailable or inconsistent; retaining existing evidence, no new estimate');
  }
  const result=await store.request('rpc/sync_tft_patch_calendar','POST',{
    proposed_patch:article.patch,source_url:article.sourceUrl,published_at:article.publishedAt,
    scheduled_date:scheduled,next_scheduled_date:next,
  },1) as {status?:string};
  if(!['registered','older-source-ignored'].includes(result?.status??'')) throw Error('Patch calendar registration not completed');
  console.log('[patch-calendar]',result);
  return result;
}
