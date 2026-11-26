<script setup lang="ts">
import {computed,nextTick,onMounted,onBeforeUnmount,ref,watch} from 'vue';
import {NAV_GROUPS,SERVICE_LINKS,activeNavigation,type NavGroupId} from '../config/navigation';
const props=defineProps<{path:string;section?:'profile'|'meta'}>();
const active=computed(()=>activeNavigation(props.path,props.section));
const root=ref<HTMLElement|null>(null);
const mobileButton=ref<HTMLButtonElement|null>(null);
const expanded=ref<NavGroupId|null>(null);
const mobileOpen=ref(false);
let media:MediaQueryList|undefined;
function trigger(id:NavGroupId){return root.value?.querySelector<HTMLButtonElement>('#global-nav-trigger-'+id);}
function close(){expanded.value=null;mobileOpen.value=false;}
function toggleGroup(id:NavGroupId){expanded.value=expanded.value===id?null:id;}
function toggleMobile(){
 if(mobileOpen.value){close();return;}
 mobileOpen.value=true;expanded.value=active.value?.group??null;
}
function outside(e:PointerEvent){if(e.target instanceof Node&&!root.value?.contains(e.target))close();}
function focusOutside(e:FocusEvent){if(e.target instanceof Node&&!root.value?.contains(e.target))close();}
function onKey(e:KeyboardEvent){
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
    <div v-show="expanded===group.id" :id="'global-nav-panel-'+group.id" class="nav-panel" :aria-labelledby="'global-nav-trigger-'+group.id">
     <div class="panel-label">{{group.label}}</div>
     <a v-for="item in group.items" :key="item.href" :href="item.href" :aria-current="active?.href===item.href?(path===item.href?'page':'location'):undefined" @click="close">
      <span class="link-copy"><strong>{{item.label}}</strong><small>{{item.description}}</small></span>
      <span class="link-arrow" aria-hidden="true">↗</span>
     </a>
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
.nav-panel a:hover,.nav-panel a:focus-visible{background:#213043}
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
 .global-nav.mobile-open{display:grid;gap:8px}
 .nav-group{min-width:0}.nav-trigger{width:100%;min-height:48px;padding:12px;font-size:14px;background:#162232;border-color:#28384b}
 .nav-panel,.nav-group:nth-last-child(2) .nav-panel,.nav-group:nth-last-child(3) .nav-panel{position:static;width:auto;max-width:none;min-width:0;max-height:none;overflow:visible;border:0;box-shadow:none;background:transparent;padding:4px 0 0 8px}
 .panel-label{display:none}.nav-panel a{min-height:48px}
 .mobile-services{display:flex;flex-wrap:wrap;gap:16px;padding:14px 4px 0;border-top:1px solid #283141;font-size:13px;color:var(--muted)}
}
@media(max-width:340px){.header-inner{gap:8px;padding:0 12px}.wordmark{font-size:14px}.server-label{display:none}.mobile-toggle{margin-left:auto}}
</style>
