<script setup lang="ts">
import {computed,nextTick,onMounted,onBeforeUnmount,ref,watch} from 'vue';
import {NAV_GROUPS,SERVICE_LINKS,activeNavigation,navSections,activeNavSection,type NavGroupId,type NavSectionId} from '../config/navigation';
const props=defineProps<{path:string;section?:'profile'|'meta'}>();
const active=computed(()=>activeNavigation(props.path,props.section));
const root=ref<HTMLElement|null>(null);
const mobileButton=ref<HTMLButtonElement|null>(null);
const expanded=ref<NavGroupId|null>(null);
const mobileOpen=ref(false);
const sectionOpen=ref<NavSectionId|null>(null);
function defaultSection(id:NavGroupId|null){
 const current=activeNavSection(props.path);
 return id&&current&&navSections(id).some(s=>s.id===current.id)?current.id:id?navSections(id)[0]?.id??null:null;
}
function toggleSection(id:NavSectionId){sectionOpen.value=sectionOpen.value===id?null:id;}
let media:MediaQueryList|undefined;
function trigger(id:NavGroupId){return root.value?.querySelector<HTMLButtonElement>('#global-nav-trigger-'+id);}
function close(){expanded.value=null;sectionOpen.value=null;mobileOpen.value=false;}
function closeAndRestore(){const mobile=mobileOpen.value;const id=expanded.value;close();void nextTick(()=>mobile?mobileButton.value?.focus():id?trigger(id)?.focus():undefined);}
function toggleGroup(id:NavGroupId){expanded.value=expanded.value===id?null:id;sectionOpen.value=defaultSection(expanded.value);}
function toggleMobile(){
 if(mobileOpen.value){close();return;}
 mobileOpen.value=true;expanded.value=active.value?.group??null;sectionOpen.value=defaultSection(expanded.value);
}
function outside(e:PointerEvent){if(e.target instanceof Node&&!root.value?.contains(e.target))close();}
function focusOutside(e:FocusEvent){
 if(!(e.target instanceof Node))return;
 if(!root.value?.contains(e.target)){close();return;}
 if(!mobileOpen.value&&expanded.value){
  const group=trigger(expanded.value)?.parentElement;
  if(group&&!group.contains(e.target))expanded.value=null;
 }
}
function onKey(e:KeyboardEvent){
 if(e.key==='Escape'&&e.target===mobileButton.value&&mobileOpen.value){e.preventDefault();closeAndRestore();return;}
 if(e.key!=='Escape'||(!expanded.value&&!mobileOpen.value))return;
 e.preventDefault();
 if(expanded.value){const id=expanded.value;expanded.value=null;void nextTick(()=>trigger(id)?.focus());}
 else{close();void nextTick(()=>mobileButton.value?.focus());}
}
function resize(){const hadFocus=root.value?.contains(document.activeElement);close();if(hadFocus)void nextTick(()=>media?.matches?mobileButton.value?.focus():root.value?.querySelector<HTMLAnchorElement>('.site-brand')?.focus());}
watch(()=>props.path,close);
onMounted(()=>{
 media=window.matchMedia('(max-width: 900px)');
 media.addEventListener('change',resize);
 document.addEventListener('pointerdown',outside);
 document.addEventListener('focusin',focusOutside);
});
onBeforeUnmount(()=>{
 media?.removeEventListener('change',resize);
 document.removeEventListener('pointerdown',outside);
 document.removeEventListener('focusin',focusOutside);
});
</script>
<template>
<header ref="root" class="site-header" @keydown="onKey">
 <div class="header-inner">
  <a class="site-brand" href="/" aria-label="TFT Profile 홈" @click="close"><span class="logo">P</span><span class="wordmark">TFT<span>PROFILE</span></span></a>
  <button ref="mobileButton" type="button" class="mobile-toggle" :aria-expanded="mobileOpen" aria-controls="global-navigation" :aria-label="mobileOpen?'전체 메뉴 닫기':'전체 메뉴 열기'" @click="toggleMobile">
   <svg v-if="mobileOpen" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
   <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
   <span>메뉴</span>
  </button>
  <nav id="global-navigation" class="global-nav" :class="{'mobile-open':mobileOpen}" aria-label="주 메뉴">
   <div v-for="group in NAV_GROUPS" :key="group.id" class="nav-group">
    <button :id="'global-nav-trigger-'+group.id" type="button" class="nav-trigger" :class="{'is-active':active?.group===group.id}" :aria-expanded="expanded===group.id" :aria-controls="'global-nav-panel-'+group.id" @click="toggleGroup(group.id)">
     {{group.label}}<span class="chevron" aria-hidden="true"></span>
    </button>
    <div v-show="expanded===group.id" :id="'global-nav-panel-'+group.id" class="nav-panel" :class="{'mega-panel':navSections(group.id).length>0}" :aria-labelledby="'global-nav-trigger-'+group.id">
     <template v-if="navSections(group.id).length">
      <div class="mega-heading"><strong>{{group.label}}</strong><small>{{group.id==='lck'?'2027 시즌 준비':'역대 LCK 기록 탐색'}}</small></div>
      <div class="mega-grid">
       <section v-for="sub in navSections(group.id)" :key="sub.id" class="mega-section" :class="{'feature-section':sub.id==='dream','section-expanded':sectionOpen===sub.id,'section-current':activeNavSection(path)?.id===sub.id}">
        <div class="mega-section-heading"><strong>{{sub.label}}</strong><small>{{sub.description}}</small></div>
        <button type="button" class="mobile-sub-trigger" :aria-expanded="sectionOpen===sub.id" :aria-controls="'global-sub-'+sub.id" @click="toggleSection(sub.id)">{{sub.label}}<span class="chevron" aria-hidden="true"></span></button>
        <div :id="'global-sub-'+sub.id" class="mega-links">
         <a v-for="item in sub.items" :key="item.href" :href="item.href" :aria-current="active?.href===item.href?(path===item.href?'page':'location'):undefined">
          <span class="link-copy"><strong>{{item.label}}</strong><small>{{item.description}}</small></span><span class="link-arrow" aria-hidden="true">↗</span>
         </a>
        </div>
       </section>
      </div>
     </template>
     <template v-else>
      <div class="panel-label">{{group.label}}</div>
      <a v-for="item in group.items" :key="item.href" :href="item.href" :aria-current="active?.href===item.href?(path===item.href?'page':'location'):undefined">
       <span class="link-copy"><strong>{{item.label}}</strong><small>{{item.description}}</small></span><span class="link-arrow" aria-hidden="true">↗</span>
      </a>
     </template>
    </div>
   </div>
   <div class="mobile-services"><a v-for="item in SERVICE_LINKS.slice(0,2)" :key="item.href" :href="item.href" @click="close">{{item.label}}</a></div>
  </nav>
  <span class="server-label" title="TFT 한국 서버">KR <span>한국 서버</span></span>
 </div>
</header>
</template>
<style scoped>
.site-header{position:sticky;top:0;z-index:40;background:#0c111b;border-bottom:1px solid #283141}
.header-inner{max-width:1312px;margin:auto;min-height:72px;padding:0 28px;display:flex;align-items:center;gap:clamp(12px,2vw,28px)}
.site-brand{display:flex;align-items:center;gap:10px;flex:none;white-space:nowrap}
.logo{width:32px;height:32px;display:grid;place-items:center;background:var(--mint);color:#102b27;border-radius:7px;font-weight:800}
.wordmark{font-size:16px;font-weight:800;letter-spacing:.04em}.wordmark span{font-weight:500;color:#a9b8ca}
.global-nav{display:flex;align-items:center;gap:4px;min-width:0}
.nav-group{position:relative;flex:none}
.nav-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;white-space:nowrap;padding:10px 12px;color:#b8c5d7;border:1px solid transparent;border-radius:8px;background:transparent;font-size:14px;font-weight:600}
.nav-trigger:hover,.nav-trigger[aria-expanded=true]{background:#182636;color:#f1f5fa}
.nav-trigger.is-active{color:var(--mint);background:#19332d;border-color:#31564b}
.chevron{width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);margin:-4px 2px 0 2px}
.nav-trigger[aria-expanded=true] .chevron{transform:rotate(225deg);margin-top:3px}
.nav-panel{position:absolute;top:calc(100% + 9px);left:0;min-width:260px;width:max-content;max-width:340px;max-height:calc(100dvh - 90px);overflow:auto;overscroll-behavior:contain;padding:8px;background:#141e2b;border:1px solid #35465a;border-radius:12px;box-shadow:0 12px 36px #0008}
.nav-group:nth-last-child(2) .nav-panel,.nav-group:nth-last-child(3) .nav-panel{left:auto;right:0}
.panel-label{font-size:11px;letter-spacing:.06em;color:#98a6ba;font-weight:700;padding:9px 10px}
.nav-panel a{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:54px;padding:10px 12px;border:1px solid transparent;border-radius:7px}
.nav-panel a:hover,.nav-panel a:focus-visible{background:#213043}.nav-panel a:focus-visible{outline-offset:-2px}
.nav-panel a[aria-current]{background:#1a342f;border-color:#38594f;color:var(--mint)}
.link-copy{display:grid;gap:4px}.link-copy strong{font-size:14px;font-weight:600}.link-copy small{font-size:11px;color:#9fadc0}.link-arrow{color:#8497ac;font-size:12px}
.server-label{font-size:12px;color:#b9c6d7;white-space:nowrap;margin-left:auto;flex:none}.server-label span{margin-left:5px;color:var(--muted)}
.mobile-toggle,.mobile-services{display:none}
@media(max-width:1100px){.header-inner{gap:12px}.nav-trigger{padding:9px 9px;font-size:13px}.server-label span{display:none}}
@media(max-width:900px){
 .header-inner{min-height:64px;padding:0 16px;gap:12px}
 .server-label{margin-left:auto;order:1}
 .mobile-toggle{order:2;display:flex;align-items:center;justify-content:center;gap:5px;min-height:44px;padding:8px 10px;background:#151e2b;border:1px solid #35465a;border-radius:8px;font-size:12px}
 .mobile-toggle svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}
 .global-nav{display:none;position:absolute;top:100%;left:0;right:0;max-height:calc(100dvh - 65px);overflow:auto;overscroll-behavior:contain;padding:12px 16px 20px;background:#0f1824;border-bottom:1px solid #35465a;box-shadow:0 12px 25px #0007}
 .global-nav.mobile-open{display:grid;gap:8px}.global-nav a:focus-visible,.global-nav button:focus-visible{outline-offset:-2px}
 .nav-group{min-width:0}.nav-trigger{width:100%;min-height:48px;padding:12px;font-size:14px;background:#162232;border-color:#28384b}
 .nav-panel,.nav-group:nth-last-child(2) .nav-panel,.nav-group:nth-last-child(3) .nav-panel{position:static;width:auto;max-width:none;min-width:0;max-height:none;overflow:visible;border:0;box-shadow:none;background:transparent;padding:4px 0 0 8px}
 .panel-label{display:none}.nav-panel a{min-height:48px}
 .mobile-services{display:flex;flex-wrap:wrap;gap:16px;padding:14px 4px 0;border-top:1px solid #283141;font-size:13px;color:var(--muted)}
}
@media(max-width:340px){.header-inner{gap:8px;padding:0 12px}.wordmark{font-size:14px}.server-label{display:none}.mobile-toggle{margin-left:auto}}

/* Grouped LCK/history desktop menu; on phones only one nested section is open. */
.nav-panel.mega-panel{width:480px;min-width:0;max-width:calc(100vw - 32px);padding:13px}
.mega-heading{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:5px 6px 12px;border-bottom:1px solid #334354;margin-bottom:12px}
.mega-heading strong{font-size:15px}.mega-heading small{font-size:11px;color:var(--muted)}
.mega-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mega-section{min-width:0;background:#101a27;border:1px solid #29394c;border-radius:9px;padding:7px}
.mega-section.section-current{border-color:#3c6b5e}
.mega-section-heading{padding:8px 9px;border-bottom:1px solid #2e4050;margin-bottom:4px}
.mega-section-heading strong,.mega-section-heading small{display:block}.mega-section-heading strong{font-size:13px;color:var(--mint)}.mega-section-heading small{font-size:10px;color:#9eafc2;margin-top:4px}
.mega-links a{min-height:49px;padding:9px 8px;gap:6px}.mega-links .link-copy{min-width:0}.mega-links .link-copy strong{font-size:13px}.mega-links .link-copy small{font-size:11px;overflow-wrap:anywhere;line-height:1.5}
.feature-section{grid-column:1/-1;display:grid;grid-template-columns:125px minmax(0,1fr);align-items:center;border-color:#4a425d;background:#1c2031}.feature-section .mega-section-heading{border-bottom:0;margin:0}.feature-section .mega-section-heading strong{color:#d6c6f6}
.mobile-sub-trigger{display:none}
@media(max-width:900px){
 .nav-panel.mega-panel{width:auto;max-width:none;min-width:0;padding:8px 0 0 8px}
 .mega-heading,.mega-section-heading{display:none}
 .mega-grid{display:grid;grid-template-columns:1fr;gap:6px}
 .mega-section,.feature-section{grid-column:auto;display:block;padding:0;background:#131e2c;border-color:#2a3b50}
 .mobile-sub-trigger{display:flex;width:100%;align-items:center;justify-content:space-between;min-height:44px;padding:9px 12px;border:0;background:transparent;color:#c3cedd;font-size:13px;text-align:left}
 .section-current .mobile-sub-trigger{color:var(--mint)}.mobile-sub-trigger[aria-expanded=true] .chevron{transform:rotate(225deg);margin-top:3px}
 .mega-links{display:none;padding:0 6px 6px}.section-expanded .mega-links{display:block}
}
</style>
