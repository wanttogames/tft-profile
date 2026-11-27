import { expect,it,vi,afterEach } from 'vitest';
import fixture from './fixtures/riot-official-patch-list.json';
import { parsePatchSchedule,syncPatchCalendar,PATCH_SCHEDULE_URL } from '../scripts/collector/patchCalendar';
import { OFFICIAL_PATCH_LIST } from '../scripts/collector/officialPatch';
const html='<table><tr><th>패치</th><th>예정일</th></tr><tr><td>전략적 팀 전투 18.3</td><td>2026년 9월 23일(목요일)</td></tr><tr><td>전략적 팀 전투 18.4</td><td>2026년 10월 7일</td></tr></table>';
afterEach(()=>vi.useRealTimers());
it('parses only official schedule table and rejects conflicting or invalid dates',()=>{
 expect(parsePatchSchedule(html)).toEqual([{patch:'18.3',date:'2026-09-23'},{patch:'18.4',date:'2026-10-07'}]);
 expect(()=>parsePatchSchedule('<p>전략적 팀 전투 18.3 2026년 9월 23일</p>')).toThrow();
 expect(()=>parsePatchSchedule(html.replace('9월 23일','2월 30일'))).toThrow();
});
it('syncs article and schedule independently from match probe',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-25T03:00:00Z'));
 const fetcher=vi.fn(async (url:RequestInfo|URL)=>new Response(url===PATCH_SCHEDULE_URL?html:`<script id="__NEXT_DATA__">${JSON.stringify(fixture.cards)}</script>`));
 const request=vi.fn(async()=>({status:'registered'}));
 await syncPatchCalendar({request},fetcher);
 expect(fetcher.mock.calls[0]?.[0]).toBe(OFFICIAL_PATCH_LIST);
 expect(request).toHaveBeenCalledWith('rpc/sync_tft_patch_calendar','POST',expect.objectContaining({proposed_patch:'18.3',scheduled_date:'2026-09-23',next_scheduled_date:'2026-10-07'}),1);
});
it('unavailable schedule registers article but no estimated date',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-25T03:00:00Z'));
 const fetcher=vi.fn(async (url:RequestInfo|URL)=>url===PATCH_SCHEDULE_URL?new Response('',{status:503}):new Response(`<script id="__NEXT_DATA__">${JSON.stringify(fixture.cards)}</script>`));
 const request=vi.fn(async()=>({status:'registered'}));
 await syncPatchCalendar({request},fetcher);
 expect(request).toHaveBeenCalledWith('rpc/sync_tft_patch_calendar','POST',expect.objectContaining({scheduled_date:null,next_scheduled_date:null}),1);
});
