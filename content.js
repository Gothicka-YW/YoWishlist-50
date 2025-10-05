// ---- Added: robust container resolver to avoid "getBoundingClientRect is not a function" ----
function __resolveContainerElement__(container) {
  // If it's already a DOM Element, return as-is
  if (container && (container.nodeType === 1 || container instanceof Element)) return container;

  // Support jQuery objects / NodeLists / arrays
  if (container && container.jquery && container[0]) return container[0];
  if (Array.isArray(container) && container.length && container[0] && (container[0].nodeType === 1 || container[0] instanceof Element)) return container[0];
  if (container && typeof container.length === "number" && container[0]) return container[0];

  // String CSS selector
  if (typeof container === "string") {
    const el = document.querySelector(container);
    if (el) return el;
  }

  // Window / Document / <body> -> use documentElement for dimensions
  if (container === window || container === document || container === document.body) return document.documentElement;

  // Fallback
  return document.documentElement;
}

// YoWishlist 50 — Content script v0.4.5 (stitched cropped export; no force-capture route)
(function(){
  const state = { limit: 50, which: 'wish', removed: [], selectorHint: '', containerSel: '', cardSel: '', picking: false };

  chrome.storage.sync.get({ yl50_limit: 50, yl50_scope: 'wish', yl50_selectors: '', yl50_container: '', yl50_card: '' }, (res) => {
    state.limit = Number(res.yl50_limit) || 50;
    state.which = res.yl50_scope || 'wish';
    state.selectorHint = res.yl50_selectors || '';
    state.containerSel = res.yl50_container || '';
    state.cardSel = res.yl50_card || '';
    console.debug('[YoWishlist 50] ready (limit=%s, scope=%s, hint=%s, container=%s, card=%s)', state.limit, state.which, state.selectorHint, state.containerSel, state.cardSel);
  });

  function toast(msg, ms=1800){
    let t = document.getElementById('yl50-toast');
    if(!t){
      t = document.createElement('div'); t.id = 'yl50-toast';
      Object.assign(t.style, { position:'fixed', left:'50%', transform:'translateX(-50%)', bottom:'16px', background:'#111', color:'#fff', padding:'8px 12px', borderRadius:'10px', fontSize:'12px', zIndex: 2147483647, opacity: 0, transition:'opacity .2s ease' });
      (document.body||document.documentElement).appendChild(t);
    }
    t.textContent = msg; requestAnimationFrame(() => t.style.opacity = 1); setTimeout(() => t.style.opacity = 0, ms);
  }

  function ensurePreviewOn(){
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    const cb = cbs.find(cb => (cb.nextSibling && (cb.nextSibling.textContent||'').toLowerCase().includes('preview'))) ||
               cbs.find(cb => (cb.id && (document.querySelector(`label[for="${cb.id}"]`)?.textContent||'').toLowerCase().includes('preview')));
    if (cb && !cb.checked) { try { cb.click(); } catch(e){} }
  }

  // Helpers
  function tagAndClasses(el){ if (!el || el.nodeType !== 1) return 'div'; const tag = (el.tagName ? el.tagName.toLowerCase() : 'div'); const cls = Array.from(el.classList||[]).filter(Boolean); return tag + (cls.length ? '.'+cls.join('.') : ''); }
  function uniqueCssPath(el){ if (!el || el.nodeType !== 1) return 'body'; const parts=[]; let cur=el; while(cur && cur.nodeType===1 && cur!==document && cur!==document.documentElement){ if(cur.id){parts.unshift('#'+cur.id); break;} const tag=(cur.tagName||'div').toLowerCase(); const cls=Array.from(cur.classList||[]).filter(Boolean); let sel=tag+(cls.length?'.'+cls.join('.') : ''); const parent=cur.parentElement; if(parent){ const sibs=Array.from(parent.children).filter(n=>n.tagName && n.tagName.toLowerCase()===tag); if(sibs.length>1){ const idx=sibs.indexOf(cur)+1; sel+=`:nth-of-type(${idx})`; } } parts.unshift(sel); if(cur===document.body) break; cur=parent; } return parts.join(' > '); }
  function closestCard(node){ if (!node || node.nodeType !== 1) return null; const list = ['[data-item]','.template-item','.item','.card','.tile','.grid > div','.row > [class*="col"]','ul > li','ol > li','[class*="col"]']; return node.closest(list.join(',')); }

  // Sections by headings
  function findSectionContainers(){ function lower(n){ return (n && (n.textContent||'')).trim().toLowerCase(); } const heads=Array.from(document.querySelectorAll('h1,h2,h3,.section-title,[class*="title"],[class*="header"]')); function containerAfter(head){ if(!head) return null; let s=head.nextElementSibling; for(let i=0;i<6 && s;i++,s=s.nextElementSibling){ const imgs=s.querySelectorAll ? s.querySelectorAll('img') : []; if (imgs.length>=4) return s; } return head.parentElement; } let wishHead=heads.find(h=>/wish[\s-]?list|wishlist|wish-list/i.test(lower(h))); let saleHead=heads.find(h=>/sale(\s|-)items|^sale$/i.test(lower(h))); return { wishHead, saleHead, wish: containerAfter(wishHead), sale: containerAfter(saleHead) }; }
  function sectionRootFor(el){ if(!el||el.nodeType!==1) return {root:document, head:null, name:'unknown'}; const {wish,sale,wishHead,saleHead}=findSectionContainers(); if(wish&&wish.contains(el)) return {root:wish, head:wishHead, name:'wish'}; if(sale&&sale.contains(el)) return {root:sale, head:saleHead, name:'sale'}; let cur=el; for(let hops=0;cur&&hops<10;hops++,cur=cur.parentElement){ if(wish&&wish.contains(cur)) return {root:wish, head:wishHead, name:'wish'}; if(sale&&sale.contains(cur)) return {root:sale, head:saleHead, name:'sale'}; } return {root:el, head:null, name:'unknown'}; }
  function pickTargetSection(scope, container){
    const {wish,sale,wishHead,saleHead}=findSectionContainers();
    if(scope==='wish'&&wish) return {root:wish, head:wishHead, name:'wish'};
    if(scope==='sale'&&sale) return {root:sale, head:saleHead, name:'sale'};
    // Auto: infer based on picked container if available
    if(scope==='auto' && container){
      const info = sectionRootFor(container);
      if(info && info.root) return info;
    }
    return sectionRootFor(container);
  }

  const _removedStacks = [];
  function removeOtherSection(selectedRoot){ const {wish,sale,wishHead,saleHead}=findSectionContainers(); const removed=[]; function rm(node){ if(node && node.parentNode){ removed.push({node, parent: node.parentNode, next: node.nextSibling}); node.parentNode.removeChild(node); } } if(wish&&sale){ if(selectedRoot===wish){ rm(sale); rm(saleHead); } else if(selectedRoot===sale){ rm(wish); rm(wishHead); } } _removedStacks.push(removed); return removed.length; }
  function restoreRemovedSections(){ const removed=_removedStacks.pop()||[]; for(const r of removed){ try{ if(r.next && r.parent.contains(r.next)) r.parent.insertBefore(r.node, r.next); else r.parent.appendChild(r.node);}catch{} } }

  // Cropped, stitched export
  function forceWhiteBackground(on){ try{ let tag=document.getElementById('yl50-white-style'); if(on){ if(!tag){ tag=document.createElement('style'); tag.id='yl50-white-style'; tag.textContent=`html, body, #root, .container, * { background: #ffffff !important; }`; (document.head||document.documentElement).appendChild(tag);} } else { if(tag) tag.remove(); } }catch{} }
  function dataUrlToImage(dataUrl){ return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=(e)=>reject(e); img.src=dataUrl; }); }

  async function captureStitchedTo(container, padding=22){
  const dpr = window.devicePixelRatio || 1;
  const el = __resolveContainerElement__(container);
  if (!el || typeof el.getBoundingClientRect !== "function") {
    throw new TypeError("captureStitchedTo: resolved container does not support getBoundingClientRect()");
  }
  const rect = el.getBoundingClientRect();
  // Existing implementation may rely on scrolling/tiling;
  // keep the rest of the original logic if present below this header.
const docTop = rect.top + window.scrollY;
    const docLeft = rect.left + window.scrollX;
    const top = Math.max(0, Math.floor(docTop - padding));
    const left = Math.max(0, Math.floor(docLeft - padding));
    const totalW = Math.ceil(rect.width + padding*2);
    const totalH = Math.ceil(rect.height + padding*2);

    const prevScrollX = window.scrollX, prevScrollY = window.scrollY;
    const prevBehavior = document.documentElement.style.scrollBehavior || '';
    document.documentElement.style.scrollBehavior = 'auto';

    const viewH = window.innerHeight;
    const overlap = 80;
    const stride = Math.max(50, viewH - overlap);

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(totalW * dpr);
    canvas.height = Math.ceil(totalH * dpr);
    const ctx = canvas.getContext('2d');

    for (let y = top; y < top + totalH; y += stride){
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 380));
      const reply = await new Promise(res => chrome.runtime.sendMessage({ type:'yl50-capture' }, r => res(r)));
      if (!reply || !reply.ok || !reply.dataUrl) continue;
      const img = await dataUrlToImage(reply.dataUrl);

      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;
      const sliceTop = Math.max(top, viewportTop);
      const sliceBottom = Math.min(top + totalH, viewportBottom);
      const visibleH = Math.max(0, sliceBottom - sliceTop);
      if (visibleH <= 0) continue;

      const sx = Math.max(0, Math.floor((left - window.scrollX) * dpr));
      const sy = Math.max(0, Math.floor((sliceTop - viewportTop) * dpr));
      const sw = Math.min(Math.floor(totalW * dpr), img.width - sx);
      const sh = Math.min(Math.floor(visibleH * dpr), img.height - sy);
      const dy = Math.floor((sliceTop - top) * dpr);

      try { ctx.drawImage(img, sx, sy, sw, sh, 0, dy, sw, sh); } catch(e){}
    }

    window.scrollTo(prevScrollX, prevScrollY);
    document.documentElement.style.scrollBehavior = prevBehavior;

    return canvas.toDataURL('image/png');
  }

  // DOM ops
  function getContainer(){ if (state.containerSel){ try { const c=document.querySelector(state.containerSel); if(c) return c; } catch{} } return document; }
  function findCards(){
    const container = getContainer() || document;
    if (state.cardSel){ try { const arr = Array.from(container.querySelectorAll(state.cardSel)).filter(n=>n.offsetParent!==null); if (arr.length) return arr; } catch{} }
    if (state.selectorHint){ try { const hinted=document.querySelector(state.selectorHint); const card=closestCard(hinted); if(card){ const sel=tagAndClasses(card); const arr=Array.from(container.querySelectorAll(sel)).filter(n=>n.offsetParent!==null); if(arr.length) return arr; } } catch{} }
    const list=['[data-item]','.template-item','.item','.card','.tile','.grid > div','.row > [class*="col"]','ul > li','ol > li','[class*="col"]'];
    const imgs = Array.from(container.querySelectorAll('img')); const set = new Set();
    imgs.forEach(img=>{ const parent=img.closest(list.join(',')); if(parent && parent.offsetParent!==null) set.add(parent); });
    return Array.from(set);
  }
  function restore(){ if (Array.isArray(state.removed) && state.removed.length){ for (const r of state.removed){ try{ if(r.next && r.parent.contains(r.next)) r.parent.insertBefore(r.node, r.next); else r.parent.appendChild(r.node); }catch{} } state.removed=[]; } Array.from(document.querySelectorAll('[yl50-hidden="true"]')).forEach(n=>n.removeAttribute('yl50-hidden')); }
  function removeBeyond(limit){ restore(); const cards=findCards(); if(!cards.length) return {ok:false,count:0,total:0,reason:'no-cards'}; for(let i=limit;i<cards.length;i++){ const n=cards[i]; state.removed.push({node:n,parent:n.parentNode,next:n.nextSibling}); if(n&&n.parentNode) n.parentNode.removeChild(n);} return {ok:true,count:Math.min(limit,cards.length),total:cards.length}; }
  function clickDownload(){ const labels=['download template','download','export','save image','save','png','jpg']; const btns=Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')); for(const b of btns){ const t=(b.textContent||b.value||'').trim().toLowerCase(); if(t && labels.some(l=>t.includes(l))){ b.click(); return true; } } const all=Array.from(document.querySelectorAll('*')); for(const el of all){ const t=(el.getAttribute('title')||el.getAttribute('aria-label')||'').toLowerCase(); if(t && ['download','export','save'].some(l=>t.includes(l))){ el.click(); return true; } } return false; }

  // Picker
  function startPicker(){ if(state.picking) return; state.picking=true; const overlay=document.createElement('div'); Object.assign(overlay.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,0.08)',zIndex:2147483646,cursor:'crosshair',pointerEvents:'none'}); const tip=document.createElement('div'); tip.textContent='Click a single tile (outer white area). Press Esc to cancel.'; Object.assign(tip.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',top:'10px',background:'#111',color:'#fff',padding:'6px 10px',borderRadius:'8px',fontSize:'12px',zIndex:2147483647}); document.documentElement.append(overlay,tip); toast('Picker armed — click a tile');
    function cleanup(){ try{ overlay.remove(); tip.remove(); }catch{} document.removeEventListener('click', onDocClick, true); document.removeEventListener('keydown', onKey, true); state.picking=false; }
    function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); cleanup(); toast('Picker cancelled'); } }
  function onDocClick(e){ e.preventDefault(); e.stopPropagation(); const target=document.elementFromPoint(e.clientX,e.clientY); let node=target; while(node && node!==document.body && (!node.classList || node.classList.length===0)){ node=node.parentElement; } const card=closestCard(node)||node; const cardSelector=tagAndClasses(card); let chosenContainer=null, chosenCount=0; let cur=card.parentElement; for(let hops=0;cur && hops<12;hops++,cur=cur.parentElement){ try{ const count=Array.from(cur.querySelectorAll(cardSelector)).filter(n=>n.offsetParent!==null).length; if(count>=6){ chosenContainer=cur; chosenCount=count; break; } if(!chosenContainer && count>=3){ chosenContainer=cur; chosenCount=count; } }catch{} } if(!chosenContainer) chosenContainer=document; state.containerSel=uniqueCssPath(chosenContainer); state.cardSel=cardSelector; state.selectorHint=uniqueCssPath(card); state.which = 'auto'; chrome.storage.sync.set({ yl50_container: state.containerSel, yl50_card: state.cardSel, yl50_selectors: state.selectorHint, yl50_scope: 'auto' }); cleanup(); toast(`Saved ✓ Found ${chosenCount} tiles — scope set to Auto`); }
    document.addEventListener('click', onDocClick, true); document.addEventListener('keydown', onKey, true);
  }

  // Messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'yl50-ping'){ sendResponse && sendResponse({ ok:true, ready:true }); return true; }
    if (msg.type === 'yl50-update-settings'){ if (typeof msg.limit==='number') state.limit=msg.limit; if (typeof msg.which==='string') state.which=msg.which; chrome.storage.sync.set({ yl50_limit: state.limit, yl50_scope: state.which }); sendResponse && sendResponse({ ok:true }); return true; }
    if (msg.type === 'yl50-preview'){ ensurePreviewOn(); const container=getContainer(); const rootInfo=pickTargetSection(state.which, container); removeOtherSection(rootInfo.root); const res=removeBeyond(state.limit); if(!res.ok) toast('Could not detect item grid — use Pick card selector on the desired section.'); else toast(`Preview: showing first ${res.count} of ${res.total}`); sendResponse && sendResponse({ ok: res.ok, count: res.count, total: res.total }); return true; }
    if (msg.type === 'yl50-export'){ ensurePreviewOn(); const container=getContainer(); const rootInfo=pickTargetSection(state.which, container); removeOtherSection(rootInfo.root); const res=removeBeyond(state.limit); if(!res.ok){ toast('Could not detect item grid — use Pick card selector first.'); sendResponse && sendResponse({ ok:false }); restoreRemovedSections(); return true; } forceWhiteBackground(true); const clicked=clickDownload(); if(!clicked) toast('Download button not found — click it manually.'); setTimeout(()=>{ forceWhiteBackground(false); restore(); restoreRemovedSections(); }, 1400); sendResponse && sendResponse({ ok:true, count: res.count, clicked }); return true; }
    if (msg.type === 'yl50-export-crop'){ ensurePreviewOn(); const container=getContainer(); const rootInfo=pickTargetSection(state.which, container); removeOtherSection(rootInfo.root); const res=removeBeyond(state.limit); if(!res.ok){ toast('Could not detect item grid — use Pick card selector first.'); sendResponse && sendResponse({ ok:false }); restoreRemovedSections(); return true; } forceWhiteBackground(true); setTimeout(async ()=>{ const dataUrl = await captureStitchedTo(rootInfo.root, 22); forceWhiteBackground(false); if(dataUrl){ chrome.runtime.sendMessage({ type:'yl50-download', dataUrl, filename:'yowishlist50_cropped.png' }, ()=>{ restore(); restoreRemovedSections(); }); } else { restore(); restoreRemovedSections(); toast('Crop capture failed — try normal Export.'); } }, 250); sendResponse && sendResponse({ ok:true, cropped:true }); return true; }
  if (msg.type === 'yl50-export-crop-data'){ ensurePreviewOn(); const container=getContainer(); const rootInfo=pickTargetSection(state.which, container); removeOtherSection(rootInfo.root); const res=removeBeyond(state.limit); if(!res.ok){ toast('Could not detect item grid — use Pick card selector first.'); sendResponse && sendResponse({ ok:false }); restoreRemovedSections(); return true; } forceWhiteBackground(true); setTimeout(async ()=>{ try { const dataUrl = await captureStitchedTo(rootInfo.root, 22); forceWhiteBackground(false); restore(); restoreRemovedSections(); if(dataUrl){ sendResponse && sendResponse({ ok:true, dataUrl }); } else { toast('Crop capture failed — try normal Export.'); sendResponse && sendResponse({ ok:false }); } } catch(e){ forceWhiteBackground(false); restore(); restoreRemovedSections(); sendResponse && sendResponse({ ok:false, error: String(e&&e.message||e) }); } }, 250); return true; }
    if (msg.type === 'yl50-restore'){ restore(); restoreRemovedSections(); toast('List restored'); sendResponse && sendResponse({ ok:true }); return true; }
    if (msg.type === 'yl50-pick'){ startPicker(); sendResponse && sendResponse({ ok:true }); return true; }
  });
})();