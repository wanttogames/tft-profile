import { DREAM_THEMES, ROLE_CODES, DREAM_STATUS, dreamPlayer, normalizeDream, type Dream } from '../data/lckDream';
import { POSITIONS } from '../data/lck2027';
export const DREAM_CARD_WIDTH=1200;
export const DREAM_CARD_HEIGHT=900;
export function drawDreamCard(canvas:HTMLCanvasElement,value:Dream){
  const d=normalizeDream(value),theme=DREAM_THEMES[d.theme];
  canvas.width=DREAM_CARD_WIDTH;canvas.height=DREAM_CARD_HEIGHT;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('카드 그리기를 지원하지 않는 브라우저입니다.');
  const ctx:CanvasRenderingContext2D=context;
  ctx.fillStyle=theme.background;ctx.fillRect(0,0,1200,900);
  ctx.fillStyle=theme.accent;ctx.fillRect(0,0,1200,10);
  const font='system-ui, "Noto Sans KR", "Malgun Gothic", sans-serif';
  function write(text:string,x:number,y:number,max:number,size:number,color:string,bold=false){
    ctx.fillStyle=color;ctx.font=(bold?'700 ':'400 ')+size+'px '+font;
    while(ctx.measureText(text).width>max&&size>15){size-=1;ctx.font=(bold?'700 ':'400 ')+size+'px '+font;}
    if(ctx.measureText(text).width>max){while(text.length>1&&ctx.measureText(text+'…').width>max)text=Array.from(text).slice(0,-1).join('');text+='…';}
    ctx.fillText(text,x,y);
  }
  write('LCK 2027  /  FAN DREAM TEAM',58,72,1084,26,theme.accent,true);
  write(d.name,58,146,1084,58,'#f6f8ff',true);
  write('나만의 LCK 드림팀 · 팬이 구성한 가상 로스터',60,190,1080,23,'#bdccda');
  d.picks.forEach((id,i)=>{
    const y=225+i*116,p=dreamPlayer(id);
    ctx.fillStyle=theme.panel;ctx.fillRect(58,y,1084,102);
    ctx.fillStyle=theme.accent;ctx.fillRect(58,y,6,102);
    write(ROLE_CODES[i],84,y+42,150,27,theme.accent,true);
    write(POSITIONS[i],84,y+73,150,20,'#c4d0dd');
    write(p?.player??'미선택',250,y+49,600,38,'#f5f7ff',true);
    write(p?.context??'선수를 선택하세요',252,y+80,590,21,'#b8c6d8');
    if(p)write(DREAM_STATUS[p.status],873,y+58,242,23,p.status==='confirmed'?theme.accent:'#f1cb8a',true);
  });
  write('TFT PROFILE  ·  tft-profile.pages.dev',58,858,690,22,theme.accent,true);
  write('비공식 팬 콘텐츠',875,858,267,20,'#bdccda');
}
export async function dreamCardBlob(value:Dream):Promise<Blob>{
  const canvas=document.createElement('canvas');
  if(document.fonts)await document.fonts.ready;
  drawDreamCard(canvas,value);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 생성 실패')),'image/png'));
}
