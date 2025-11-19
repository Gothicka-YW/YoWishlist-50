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
  const state = { limit: 50, columns: 5, which: 'wish', scopeName: '', removed: [], selectorHint: '', containerSel: '', cardSel: '', pickIndex: -1, picking: false, previewStartIdx: -1, previewContainerSel: '' };

  chrome.storage.sync.get({ yl50_limit: 50, yl50_columns: 5, yl50_scope: 'wish', yl50_scope_name: '', yl50_selectors: '', yl50_container: '', yl50_card: '', yl50_pick_index: -1 }, (res) => {
    state.limit = Number(res.yl50_limit) || 50;
    state.columns = Number(res.yl50_columns) || 5;
    state.which = res.yl50_scope || 'wish';
    state.scopeName = res.yl50_scope_name || '';
    state.selectorHint = res.yl50_selectors || '';
    state.containerSel = res.yl50_container || '';
    state.cardSel = res.yl50_card || '';
    state.pickIndex = (typeof res.yl50_pick_index === 'number') ? res.yl50_pick_index : -1;
    console.debug('[YoWishlist 50] ready (limit=%s, scope=%s, scopeName=%s, hint=%s, container=%s, card=%s)', state.limit, state.which, state.scopeName, state.selectorHint, state.containerSel, state.cardSel);
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
    // If a specific container (from picker) is provided, prefer that first
    if (container && container !== document){
      const info = sectionRootFor(container);
      if (info && info.root) return info;
    }
    // Otherwise, if a scopeName is provided, try to find matching label/input/header
    if (state.scopeName){
      const name = String(state.scopeName).trim().toLowerCase();
      if (name){
        const heads = Array.from(document.querySelectorAll('h1,h2,h3,.section-title,[class*="title"],[class*="header"]'));
        const labelInput = Array.from(document.querySelectorAll('.selling-label-input, input[type="text"][class*="label"], [class*="label"] input[type="text"]'));
        const pool = [...labelInput, ...heads];
        const match = pool.find(el => {
          try{
            const val = (el.value||el.placeholder||'').toString().trim().toLowerCase();
            const txt = (el.textContent||'').toString().trim().toLowerCase();
            return (val && val.includes(name)) || (txt && txt.includes(name));
          }catch{return false;}
        });
        if (match){
          // Prefer container following the label/head
          let root = match.nextElementSibling; let hops=0;
          while(root && hops<8 && (!root.querySelectorAll || root.querySelectorAll('img').length<4)){ root = root.nextElementSibling; hops++; }
          if (!root) root = match.parentElement || document;
          return { root, head: match, name: 'named' };
        }
      }
    }
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
  function removeOtherSection(selectedRoot){
    const {wish,sale,wishHead,saleHead}=findSectionContainers();
    const removed=[];
    function rm(node){ if(node && node.parentNode){ removed.push({node, parent: node.parentNode, next: node.nextSibling}); node.parentNode.removeChild(node); } }
    if (wish && sale){
      // Remove the opposite section by containment or equality
      if (selectedRoot === wish || (wish && selectedRoot && wish.contains(selectedRoot))){ rm(sale); rm(saleHead); }
      else if (selectedRoot === sale || (sale && selectedRoot && sale.contains(selectedRoot))){ rm(wish); rm(wishHead); }
    }
    _removedStacks.push(removed);
    return removed.length;
  }
  function restoreRemovedSections(){ const removed=_removedStacks.pop()||[]; for(const r of removed){ try{ if(r.next && r.parent.contains(r.next)) r.parent.insertBefore(r.node, r.next); else r.parent.appendChild(r.node);}catch{} } }

  // Cropped, stitched export
  function forceWhiteBackground(on){ try{ let tag=document.getElementById('yl50-white-style'); if(on){ if(!tag){ tag=document.createElement('style'); tag.id='yl50-white-style'; tag.textContent=`html, body, #root, .container, * { background: #ffffff !important; }`; (document.head||document.documentElement).appendChild(tag);} } else { if(tag) tag.remove(); } }catch{} }
  function dataUrlToImage(dataUrl){ return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=(e)=>reject(e); img.src=dataUrl; }); }

  // Build a filesystem-safe filename from a title
  function __safeFilenameFromTitle__(title, fallback='yowishlist50'){
    try{
      let t = String(title||'').trim();
      if (!t) t = fallback;
      // Prefer value inside quotes; strip illegal Windows/macOS characters
      t = t.replace(/[\\/:*?"<>|]/g, ' ');
      // Collapse whitespace and replace with underscores
      t = t.replace(/\s+/g, ' ').trim().replace(/\s/g, '_');
      // Remove trailing dots/spaces and limit length
      t = t.replace(/[\s\.]+$/g, '');
      if (!t) t = fallback;
      if (t.length > 80) t = t.slice(0, 80);
      return t + '.png';
    } catch { return (fallback||'yowishlist50') + '.png'; }
  }
  function __deriveTitleFromRoot__(rootInfo){
    try{
      if (!rootInfo) return '';
      // Prefer explicit Scope name from state
      if (state.scopeName && String(state.scopeName).trim()) return String(state.scopeName).trim();
      // Else try header text or associated input value/placeholder
      const head = rootInfo.head;
      if (head){
        const v = (head.value||'').toString().trim();
        const ph = (head.placeholder||'').toString().trim();
        const txt = (head.textContent||'').toString().trim();
        return v || ph || txt || '';
      }
      return '';
    } catch { return ''; }
  }

  // Hide common fixed/sticky overlays (headers, nav bars) that can occlude the grid during capture
  const __hiddenOverlaysStack = [];
  function hideFixedAndStickyOverlays(root){
    const hidden = [];
    try{
      const rootRect = (root && root.getBoundingClientRect) ? root.getBoundingClientRect() : null;
      const candidates = Array.from(document.querySelectorAll('*'));
      for (const el of candidates){
        try{
          if (!el || el === root) continue;
          const cs = getComputedStyle(el);
          const pos = cs.position;
          if (pos !== 'fixed' && pos !== 'sticky') continue;
          const r = el.getBoundingClientRect();
          // Heuristic: things near the top that span horizontally and could block content
          const nearTop = r.top <= 140; // px from top of viewport
          const wide = r.width >= Math.min(window.innerWidth * 0.5, 480);
          const overlapsRoot = !rootRect || (r.bottom > rootRect.top - 2);
          if (nearTop && wide && overlapsRoot && r.height > 10){
            // Hide it
            hidden.push({ el, prev: el.getAttribute('style') });
            el.setAttribute('style', (el.getAttribute('style')||'') + '; display: none !important; visibility: hidden !important;');
          }
        } catch {}
      }
    } catch {}
    __hiddenOverlaysStack.push(hidden);
    return hidden.length;
  }
  function restoreHiddenOverlays(){
    const hidden = __hiddenOverlaysStack.pop() || [];
    for (const h of hidden){
      try{
        if (h.prev == null) h.el.removeAttribute('style');
        else h.el.setAttribute('style', h.prev);
      } catch {}
    }
  }

  async function captureStitchedTo(container, padding=22){
  const dpr = window.devicePixelRatio || 1;
  const el = __resolveContainerElement__(container);
  if (!el || typeof el.getBoundingClientRect !== "function") {
    throw new TypeError("captureStitchedTo: resolved container does not support getBoundingClientRect()");
  }
  const rect = el.getBoundingClientRect();
  // Use full content height of the container (handles scrollable grids)
  const contentH = Math.ceil(Math.max(rect.height, el.scrollHeight || 0));
  // Existing implementation may rely on scrolling/tiling;
  // keep the rest of the original logic if present below this header.
const docTop = rect.top + window.scrollY;
    const docLeft = rect.left + window.scrollX;
    // Support numeric padding or an object: { top, right, bottom, left }
    const pad = (typeof padding === 'object' && padding) ? padding : { top: padding, right: padding, bottom: padding, left: padding };
    const pTop = Math.max(0, Math.floor(pad.top||0));
    const pLeft = Math.max(0, Math.floor(pad.left||0));
    const pRight = Math.max(0, Math.floor(pad.right||0));
    const pBottom = Math.max(0, Math.floor(pad.bottom||0));
  const top = Math.max(0, Math.floor(docTop - pTop));
  const left = Math.max(0, Math.floor(docLeft - pLeft));
  const totalW = Math.ceil(rect.width + pLeft + pRight);
  const bottomDoc = Math.ceil(docTop + contentH + pBottom);
  const totalH = Math.max(0, bottomDoc - top);

    const prevScrollX = window.scrollX, prevScrollY = window.scrollY;
    const prevBehavior = document.documentElement.style.scrollBehavior || '';
    document.documentElement.style.scrollBehavior = 'auto';

  const viewH = window.innerHeight;
  const overlap = 180; // larger overlap to reduce seam/gap risk and header occlusion
  const stride = Math.max(50, viewH - overlap);

  // Work canvas with a small bottom overscan to ensure final rows are fully covered
  const targetW = Math.ceil(totalW * dpr);
  const targetH = Math.ceil(totalH * dpr);
  const overscanPx = Math.ceil(128 * dpr);
  const workH = targetH + overscanPx;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = workH;
  const ctx = canvas.getContext('2d');

    // Prewarm: scroll through the region once to trigger any lazy-loaded rows/images
    try {
      for (let y = top; y < top + totalH; y += stride){
        const targetScrollY = Math.max(0, Math.min(y, (top + totalH) - window.innerHeight));
        window.scrollTo(0, targetScrollY);
        await new Promise(r => setTimeout(r, 140));
      }
      window.scrollTo(0, top);
      await new Promise(r => setTimeout(r, 180));
    } catch {}

    for (let y = top; y < top + totalH; y += stride){
      const bottom = top + totalH;
      const isLast = (y + stride >= bottom);
      const targetScrollY = isLast ? Math.max(0, bottom - window.innerHeight) : y;
      window.scrollTo(0, targetScrollY);
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

      const sx = Math.max(0, Math.round((left - window.scrollX) * dpr));
      const sy = Math.max(0, Math.round((sliceTop - viewportTop) * dpr));
      const sw = Math.min(Math.ceil(totalW * dpr), img.width - sx);
      let sh = Math.min(Math.round(visibleH * dpr), img.height - sy);
      const dy = Math.max(0, Math.round((sliceTop - top) * dpr));
      // Clamp to work canvas height so we never write past the buffer
      if (dy + sh > workH) sh = Math.max(0, workH - dy);

      try { ctx.drawImage(img, sx, sy, sw, sh, 0, dy, sw, sh); } catch(e){}
    }

    window.scrollTo(prevScrollX, prevScrollY);
    document.documentElement.style.scrollBehavior = prevBehavior;

    // Crop work canvas to the exact target size to remove overscan area
    if (workH !== targetH) {
      const out = document.createElement('canvas');
      out.width = targetW;
      out.height = targetH;
      const octx = out.getContext('2d');
      try { octx.drawImage(canvas, 0, 0, targetW, targetH, 0, 0, targetW, targetH); } catch(e){}
      return out.toDataURL('image/png');
    }
    return canvas.toDataURL('image/png');
  }

  // New: capture an arbitrary document-absolute rectangle (left/top in document coords)
  async function captureStitchedRect(absLeft, absTop, width, height, padding={ top:8, right:14, bottom:14, left:14 }){
    const dpr = window.devicePixelRatio || 1;
    // Normalize padding
    const pad = (typeof padding === 'object' && padding) ? padding : { top: padding, right: padding, bottom: padding, left: padding };
    const pTop = Math.max(0, Math.floor(pad.top||0));
    const pLeft = Math.max(0, Math.floor(pad.left||0));
    const pRight = Math.max(0, Math.floor(pad.right||0));
    const pBottom = Math.max(0, Math.floor(pad.bottom||0));

    const top = Math.max(0, Math.floor(absTop - pTop));
    const left = Math.max(0, Math.floor(absLeft - pLeft));
    const totalW = Math.ceil(width + pLeft + pRight);
    const totalH = Math.ceil(height + pTop + pBottom);

    const prevScrollX = window.scrollX, prevScrollY = window.scrollY;
    const prevBehavior = document.documentElement.style.scrollBehavior || '';
    document.documentElement.style.scrollBehavior = 'auto';

    const viewH = window.innerHeight;
    const overlap = 180;
    const stride = Math.max(50, viewH - overlap);

    const targetW = Math.ceil(totalW * dpr);
    const targetH = Math.ceil(totalH * dpr);
    const overscanPx = Math.ceil(128 * dpr);
    const workH = targetH + overscanPx;

    const canvas = document.createElement('canvas');
    canvas.width = targetW; canvas.height = workH;
    const ctx = canvas.getContext('2d');

    // Prewarm lazy content
    try{
      for (let y = top; y < top + totalH; y += stride){
        const targetScrollY = Math.max(0, Math.min(y, (top + totalH) - window.innerHeight));
        window.scrollTo(0, targetScrollY);
        await new Promise(r => setTimeout(r, 140));
      }
      window.scrollTo(0, top);
      await new Promise(r => setTimeout(r, 180));
    } catch {}

    for (let y = top; y < top + totalH; y += stride){
      const bottom = top + totalH;
      const isLast = (y + stride >= bottom);
      const targetScrollY = isLast ? Math.max(0, bottom - window.innerHeight) : y;
      window.scrollTo(0, targetScrollY);
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

      const sx = Math.max(0, Math.round((left - window.scrollX) * dpr));
      const sy = Math.max(0, Math.round((sliceTop - viewportTop) * dpr));
      const sw = Math.min(Math.ceil(totalW * dpr), img.width - sx);
      let sh = Math.min(Math.round(visibleH * dpr), img.height - sy);
      const dy = Math.max(0, Math.round((sliceTop - top) * dpr));
      if (dy + sh > workH) sh = Math.max(0, workH - dy);
      try { ctx.drawImage(img, sx, sy, sw, sh, 0, dy, sw, sh); } catch{}
    }

    window.scrollTo(prevScrollX, prevScrollY);
    document.documentElement.style.scrollBehavior = prevBehavior;

    if (workH !== targetH){
      const out = document.createElement('canvas');
      out.width = targetW; out.height = targetH;
      const octx = out.getContext('2d');
      try { octx.drawImage(canvas, 0, 0, targetW, targetH, 0, 0, targetW, targetH); } catch{}
      return out.toDataURL('image/png');
    }
    return canvas.toDataURL('image/png');
  }

  // Compute a tight union rect for the first N visible card "image areas"
  function firstNCards(root, n=6){
    try{ const arr = findCards(root).filter(n=> n && n.offsetParent!==null); return arr.slice(0, Math.max(0, n)); }catch{return [];} }
  function rectForImageArea(card){
    try{
      const imgs = Array.from(card.querySelectorAll('img'));
      let best = null, bestA = 0;
      for (const im of imgs){
        try{ const r = im.getBoundingClientRect(); const a = Math.max(0, r.width*r.height); if (a > bestA){ best = r; bestA = a; } }catch{}
      }
      const r = best || card.getBoundingClientRect();
      return { left: r.left + window.scrollX, top: r.top + window.scrollY, right: r.right + window.scrollX, bottom: r.bottom + window.scrollY };
    }catch{ return null; }
  }
  function rectForCardBounds(card){
    try{
      const r = card.getBoundingClientRect();
      return { left: r.left + window.scrollX, top: r.top + window.scrollY, right: r.right + window.scrollX, bottom: r.bottom + window.scrollY };
    }catch{ return null; }
  }
  function isPreviewActive(){
    try{
      const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      const cb = cbs.find(cb => (cb.nextSibling && (cb.nextSibling.textContent||'').toLowerCase().includes('preview')))
        || cbs.find(cb => (cb.id && (document.querySelector(`label[for="${cb.id}"]`)?.textContent||'').toLowerCase().includes('preview')));
      return !!(cb && cb.checked);
    }catch{ return false; }
  }
  function unionRectForCards(cards, useCardBounds=false){
    let L=Infinity, T=Infinity, R=-Infinity, B=-Infinity, count=0;
    for (const c of cards){
      const rr = useCardBounds ? rectForCardBounds(c) : rectForImageArea(c);
      if (!rr) continue;
      L = Math.min(L, rr.left); T = Math.min(T, rr.top); R = Math.max(R, rr.right); B = Math.max(B, rr.bottom); count++;
    }
    if (!count || !isFinite(L) || !isFinite(T) || !isFinite(R) || !isFinite(B)) return null;
    return { left: Math.floor(L), top: Math.floor(T), width: Math.ceil(R - L), height: Math.ceil(B - T) };
  }

  // Choose padding based on how many cards we're including (approx rows at 3 columns)
  function paddingForCount(count){
    // Make bottom padding consistent across all limits to avoid caption/manual text clipping
    // Sides stay tight; top modest; bottom generous
    return { top: 8, right: 4, bottom: 74, left: 4 };
  }

  // DOM ops
  function getContainer(){ if (state.containerSel){ try { const c=document.querySelector(state.containerSel); if(c) return c; } catch{} } return document; }
  function findCards(rootOverride){
    const container = rootOverride || getContainer() || document;
    // If a specific card selector is saved, try direct-children first, then deep fallback
    if (state.cardSel){
      try {
        let arr = Array.from(container.querySelectorAll(`:scope > ${state.cardSel}`)).filter(n=>n.offsetParent!==null);
        if (!arr.length) arr = Array.from(container.querySelectorAll(state.cardSel)).filter(n=>n.offsetParent!==null);
        if (arr.length) return arr;
      } catch{}
    }
    // Try hint → closest card → derive selector within container
    if (state.selectorHint){
      try {
        const hinted = document.querySelector(state.selectorHint);
        const card = closestCard(hinted);
        if(card){
          const sel = tagAndClasses(card);
          const arr = Array.from(container.querySelectorAll(sel)).filter(n=>n.offsetParent!==null);
          if(arr.length) return arr;
        }
      } catch{}
    }
    // Generic patterns within the container
    const list=['[data-item]','.template-item','.item','.card','.tile','.grid > div','.row > [class*="col"]','ul > li','ol > li','[class*="col"]'];
    const imgs = Array.from(container.querySelectorAll('img'));
    const set = new Set();
    imgs.forEach(img=>{ const parent=img.closest(list.join(',')); if(parent && parent.offsetParent!==null && container.contains(parent)) set.add(parent); });
    const fallback = Array.from(set);
    if (fallback.length) return fallback;
    // Last resort: take visible direct children grid items
    const gridish = Array.from(container.querySelectorAll('*')).filter(el=>{
      const d = getComputedStyle(el);
      return (d.display.includes('grid') || d.display.includes('flex')) && el.children && el.children.length>=3;
    });
    for (const g of gridish){
      const kids = Array.from(g.children).filter(n=> n.offsetParent!==null);
      if (kids.length>=3) return kids;
    }
    return [];
  }
  function restore(){
    if (Array.isArray(state.removed) && state.removed.length){
      for (const r of state.removed){
        try{
          if(r.next && r.parent.contains(r.next)) r.parent.insertBefore(r.node, r.next);
          else r.parent.appendChild(r.node);
        }catch{}
      }
      state.removed=[];
    }
    document.querySelectorAll('[yl50-hidden="true"]').forEach(n=> n.removeAttribute('yl50-hidden'));
    // Clear preview-derived start index on full restore
    state.previewStartIdx = -1;
    state.previewContainerSel = '';
  }
  function trimStartByIndex(root, idx){
    try{
      const count = Math.max(0, Number(idx)||0);
      if (count <= 0) return 0;
      // Prefer the originally saved container within this root for consistent ordering
      let target = root;
      try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===root || root.contains(saved))) target = saved; }catch{}
      const cards = findCards(target);
      const upto = Math.min(count, cards.length);
      for (let i=0; i<upto; i++){
        const n = cards[i];
        state.removed.push({node:n,parent:n.parentNode,next:n.nextSibling});
        if(n&&n.parentNode) n.parentNode.removeChild(n);
      }
      return upto;
    } catch { return 0; }
  }
  function removeBeyond(limit, root, skipRestore=false){
    if (!skipRestore) restore();
    let target = root;
    try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===root || root.contains(saved))) target = saved; }catch{}
    const cards=findCards(target);
    if(!cards.length) return {ok:false,count:0,total:0,reason:'no-cards'};
    for(let i=limit;i<cards.length;i++){
      const n=cards[i];
      state.removed.push({node:n,parent:n.parentNode,next:n.nextSibling});
      if(n&&n.parentNode) n.parentNode.removeChild(n);
    }
    return {ok:true,count:Math.min(limit,cards.length),total:cards.length};
  }

  // Remove all cards before the clicked/ hinted card to start the list at the user's pick
  function trimStartFromHint(root){
    try{
      // Prefer saved container within this root for stable enumeration
      let target = root;
      try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===root || root.contains(saved))) target = saved; }catch{}
      const cards = findCards(target);
      if (!cards.length) return { idx: 0, used: 'auto' };
      // Prefer matching the originally clicked element by selector path
      let idx = -1;
      let used = 'auto';
      if (state.selectorHint){
        const hinted = document.querySelector(state.selectorHint);
        if (hinted){
          // First try strict equality (exact card match) to avoid ancestor matches shifting start up a row
          idx = cards.findIndex(c => c === hinted);
          // Fallback to contains only if equality not found (handles cases where saved element is inner child)
          if (idx < 0) idx = cards.findIndex(c => c && hinted && c.contains(hinted));
          if (idx >= 0) used = 'picked';
        }
      }
      // Fallback: use stored pickIndex only when we have a selector hint AND the saved container matches this root/section
      if (idx < 0 && state.selectorHint && typeof state.pickIndex === 'number' && state.pickIndex > 0){
        let okContainer = false;
        try {
          const savedContainer = state.containerSel ? document.querySelector(state.containerSel) : null;
          if (savedContainer){
            okContainer = (savedContainer === root) || savedContainer.contains(root) || root.contains(savedContainer);
          }
        } catch {}
        if (okContainer) {
          // Use pickIndex directly (aligns with enumeration used during picking) when valid
          idx = Math.min(state.pickIndex, cards.length - 1);
          if (idx >= 0) used = 'picked';
        }
      }
      if (idx > 0){
        for (let i=0; i<idx; i++){
          const n = cards[i];
          state.removed.push({node:n,parent:n.parentNode,next:n.nextSibling});
          if(n&&n.parentNode) n.parentNode.removeChild(n);
        }
        return { idx, used };
      }
      return { idx: 0, used };
    } catch { return { idx: 0, used: 'auto' }; }
  }
  function clickDownload(){ const labels=['download template','download','export','save image','save','png','jpg']; const btns=Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')); for(const b of btns){ const t=(b.textContent||b.value||'').trim().toLowerCase(); if(t && labels.some(l=>t.includes(l))){ b.click(); return true; } } const all=Array.from(document.querySelectorAll('*')); for(const el of all){ const t=(el.getAttribute('title')||el.getAttribute('aria-label')||'').toLowerCase(); if(t && ['download','export','save'].some(l=>t.includes(l))){ el.click(); return true; } } return false; }

  // Picker
  function startPicker(){ if(state.picking) return; state.picking=true; const overlay=document.createElement('div'); Object.assign(overlay.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,0.08)',zIndex:2147483646,cursor:'crosshair',pointerEvents:'none'}); const tip=document.createElement('div'); tip.textContent='Click anywhere on a card. Press Esc to cancel.'; Object.assign(tip.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',top:'10px',background:'#111',color:'#fff',padding:'6px 10px',borderRadius:'8px',fontSize:'12px',zIndex:2147483647}); document.documentElement.append(overlay,tip); toast('Picker armed — click a card');
    function cleanup(){ try{ overlay.remove(); tip.remove(); }catch{} document.removeEventListener('click', onDocClick, true); document.removeEventListener('keydown', onKey, true); state.picking=false; }
    function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); cleanup(); toast('Picker cancelled'); } }
    function countDirectChildrenMatching(parent, selector){ try{ return Array.from(parent.children).filter(ch=> ch.matches(selector) && ch.offsetParent!==null).length; }catch{return 0;} }
    function onDocClick(e){
      e.preventDefault(); e.stopPropagation();
      const target=document.elementFromPoint(e.clientX,e.clientY);
      const card=closestCard(target)||target;
      const cardSelector=tagAndClasses(card);
      let chosenContainer=null, chosenCount=0; let cur=card.parentElement;
      for(let hops=0;cur && hops<12;hops++,cur=cur.parentElement){
        const directCount = countDirectChildrenMatching(cur, cardSelector);
        if(directCount>=6){ chosenContainer=cur; chosenCount=directCount; break; }
        if(!chosenContainer && directCount>=3){ chosenContainer=cur; chosenCount=directCount; }
      }
      if(!chosenContainer) chosenContainer=document;
      state.containerSel=uniqueCssPath(chosenContainer);
      state.cardSel=cardSelector;
      state.selectorHint=uniqueCssPath(card);
      state.which = 'auto';
      // Persist index among direct children for robust mid-list starts
      // Compute index using same enumeration strategy as capture to avoid off-by-one when direct children differ from deep query.
      let pickIndex = -1;
      try {
        const listing = findCards(chosenContainer);
        pickIndex = listing.findIndex(c => c === card || c.contains(card));
        // Fallback to direct children heuristic if not found
        if (pickIndex < 0){
          const within = Array.from(chosenContainer.children).filter(ch=> ch.matches(cardSelector) && ch.offsetParent!==null);
          pickIndex = within.indexOf(card);
        }
      } catch {}
      state.pickIndex = pickIndex;
      chrome.storage.sync.set({ yl50_container: state.containerSel, yl50_card: state.cardSel, yl50_selectors: state.selectorHint, yl50_scope: 'auto', yl50_pick_index: state.pickIndex });
      // Ask background to reopen popup (Chrome closes extension popup when user clicks page)
      try { chrome.runtime.sendMessage({ type: 'yl50-reopen-popup' }); } catch {}
      cleanup(); toast(`Saved ✓ Found ${chosenCount} tiles in section`);
    }
    document.addEventListener('click', onDocClick, true); document.addEventListener('keydown', onKey, true);
  }

  // Messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'yl50-ping'){ sendResponse && sendResponse({ ok:true, ready:true }); return true; }
    if (msg.type === 'yl50-update-settings'){
      if (typeof msg.limit==='number') state.limit=msg.limit;
  if (typeof msg.which==='string') state.which=msg.which; // legacy
      if (typeof msg.scopeName==='string') state.scopeName=msg.scopeName;
  if (typeof msg.columns==='number') state.columns = msg.columns;
      if (typeof msg.containerSel==='string') state.containerSel=msg.containerSel;
      if (typeof msg.cardSel==='string') state.cardSel=msg.cardSel;
      if (typeof msg.selectorHint==='string') state.selectorHint=msg.selectorHint;
      chrome.storage.sync.set({
        yl50_limit: state.limit,
        yl50_columns: state.columns,
        yl50_scope: state.which,
        yl50_scope_name: state.scopeName,
        yl50_container: state.containerSel,
        yl50_card: state.cardSel,
        yl50_selectors: state.selectorHint
      });
      sendResponse && sendResponse({ ok:true });
      return true;
    }
    if (msg.type === 'yl50-preview'){
      ensurePreviewOn();
      // Always start from a restored list so changing Limit works predictably across previews
      restore();
      const container=getContainer();
      const rootInfo=pickTargetSection(state.which, container);
      removeOtherSection(rootInfo.root);
      // Hide items above the picked tile, then remove beyond N
      const startInfo = trimStartFromHint(rootInfo.root);
      // Persist starting index and container selector for export to reuse without re-picking
        try{
          let target = rootInfo.root;
          try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===rootInfo.root || rootInfo.root.contains(saved))) target = saved; }catch{}
          const cards = findCards(target);
          state.previewStartIdx = Math.max(0, Number(startInfo && startInfo.idx || 0));
          state.previewContainerSel = uniqueCssPath(target);
        } catch {}
      const res=removeBeyond(state.limit, rootInfo.root, true);
      if(!res.ok) toast('Could not detect item grid — pick a tile again or scroll the section into view, then retry.');
      else toast(`Preview: showing first ${res.count} of ${res.total}`);
  sendResponse && sendResponse({ ok: res.ok, count: res.count, total: res.total, startFrom: (startInfo && startInfo.used) || 'auto' });
      return true;
    }
    if (msg.type === 'yl50-export'){
      ensurePreviewOn();
      // Ensure previously removed items are restored before applying a new Limit
      restore();
      const container=getContainer();
      const rootInfo=pickTargetSection(state.which, container);
      removeOtherSection(rootInfo.root);
      // Reuse preview start if targeting same container
      let startInfo = null;
      if (state.previewStartIdx > 0){
        try{
          let target = rootInfo.root;
          try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===rootInfo.root || rootInfo.root.contains(saved))) target = saved; }catch{}
          const same = state.previewContainerSel && (uniqueCssPath(target) === state.previewContainerSel);
          if (same){ trimStartByIndex(rootInfo.root, state.previewStartIdx); startInfo = { idx: state.previewStartIdx, used: 'picked' }; }
        } catch {}
      }
      if (!startInfo) startInfo = trimStartFromHint(rootInfo.root);
      const res=removeBeyond(state.limit, rootInfo.root, true);
      if(!res.ok){ toast('Could not detect item grid — use Pick card selector first.'); sendResponse && sendResponse({ ok:false }); restoreRemovedSections(); return true; }
      forceWhiteBackground(true);
      const clicked=clickDownload(); if(!clicked) toast('Download button not found — click it manually.');
      setTimeout(()=>{ forceWhiteBackground(false); restore(); restoreRemovedSections(); }, 1400);
  sendResponse && sendResponse({ ok:true, count: res.count, clicked, startFrom: (startInfo && startInfo.used) || 'auto' });
      return true;
    }
    if (msg.type === 'yl50-export-crop'){
      ensurePreviewOn();
      // Restore full list first so union/crop can include newly requested rows
      restore();
      const container=getContainer();
      const rootInfo=pickTargetSection(state.which, container);
      removeOtherSection(rootInfo.root);
      // Reuse preview start if targeting same container
      let startInfo = null;
      if (state.previewStartIdx > 0){
        try{
          let target = rootInfo.root;
          try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===rootInfo.root || rootInfo.root.contains(saved))) target = saved; }catch{}
          const same = state.previewContainerSel && (uniqueCssPath(target) === state.previewContainerSel);
          if (same){ trimStartByIndex(rootInfo.root, state.previewStartIdx); startInfo = { idx: state.previewStartIdx, used: 'picked' }; }
        } catch {}
      }
      if (!startInfo) startInfo = trimStartFromHint(rootInfo.root);
      const res=removeBeyond(state.limit, rootInfo.root, true);
      if(!res.ok){ toast('Could not detect item grid — use Pick card selector first.'); sendResponse && sendResponse({ ok:false }); restoreRemovedSections(); return true; }
      forceWhiteBackground(true);
      setTimeout(async ()=>{
        // Hide sticky/fixed overlays that could block rows during capture
        hideFixedAndStickyOverlays(rootInfo.root);
        let dataUrl = '';
        try{
          // Prefer tight union of the first N cards (limit) by image area
          const n = Math.max(1, Number(state.limit||6));
          const cards = firstNCards(rootInfo.root, n);
          const uni = unionRectForCards(cards, isPreviewActive());
          if (uni){
            // Expand union height to cover desired rows even if only a subset is currently rendered
            const cols = Math.max(1, Number(state.columns||5));
            const rowsDesired = Math.max(1, Math.ceil(n / cols));
            // Estimate row height from visible cards' image areas
            let sumH = 0, cntH = 0;
            for (const c of cards){
              try { const r = (isPreviewActive() ? rectForCardBounds(c) : rectForImageArea(c)); const h = Math.max(0, (r.bottom||0) - (r.top||0)); if (h > 0){ sumH += h; cntH++; } } catch {}
            }
            let rowH = 0;
            if (cntH > 0) rowH = Math.round(sumH / cntH);
            if (!rowH){
              const visibleRows = Math.max(1, Math.ceil(cards.length / cols));
              rowH = Math.max(1, Math.round(uni.height / visibleRows));
            }
            const targetH = Math.max(uni.height, rowH * rowsDesired);
            const pad = paddingForCount(cards.length);
            dataUrl = await captureStitchedRect(uni.left, uni.top, uni.width, targetH, pad);
          } else {
            // Fallback to container crop with minimal side padding
            dataUrl = await captureStitchedTo(rootInfo.root, { top: 6, right: 0, bottom: 68, left: 0 });
          }
        } finally {
          forceWhiteBackground(false);
          restoreHiddenOverlays();
        }
        if(dataUrl){
          const title = __deriveTitleFromRoot__(rootInfo);
          const filename = __safeFilenameFromTitle__(title || 'yowishlist50');
          chrome.runtime.sendMessage({ type:'yl50-download', dataUrl, filename }, ()=>{ restore(); restoreRemovedSections(); });
        } else {
          restore(); restoreRemovedSections();
          toast('Crop capture failed — try again or use the page\'s Download button.');
        }
      }, 300);
  sendResponse && sendResponse({ ok:true, cropped:true, startFrom: (startInfo && startInfo.used) || 'auto' });
      return true;
    }
    if (msg.type === 'yl50-export-crop-data'){
      ensurePreviewOn();
      // Restore before computing new union in data-returning mode
      restore();
      const container=getContainer();
      const rootInfo=pickTargetSection(state.which, container);
      removeOtherSection(rootInfo.root);
      // Reuse preview start if targeting same container
      let startInfo = null;
      if (state.previewStartIdx > 0){
        try{
          let target = rootInfo.root;
          try{ const saved = state.containerSel ? document.querySelector(state.containerSel) : null; if (saved && (saved===rootInfo.root || rootInfo.root.contains(saved))) target = saved; }catch{}
          const same = state.previewContainerSel && (uniqueCssPath(target) === state.previewContainerSel);
          if (same){ trimStartByIndex(rootInfo.root, state.previewStartIdx); startInfo = { idx: state.previewStartIdx, used: 'picked' }; }
        } catch {}
      }
      if (!startInfo) startInfo = trimStartFromHint(rootInfo.root);
      const res=removeBeyond(state.limit, rootInfo.root, true);
  if(!res.ok){ toast('Could not detect item grid — use Pick card selector first.'); sendResponse && sendResponse({ ok:false, startFrom: (startInfo && startInfo.used) || 'auto' }); restoreRemovedSections(); return true; }
      forceWhiteBackground(true);
      setTimeout(async ()=>{
        hideFixedAndStickyOverlays(rootInfo.root);
        try {
          let dataUrl = '';
          const n = Math.max(1, Number(state.limit||6));
          const cards = firstNCards(rootInfo.root, n);
          const uni = unionRectForCards(cards, isPreviewActive());
          if (uni){
            const cols = Math.max(1, Number(state.columns||5));
            const rowsDesired = Math.max(1, Math.ceil(n / cols));
            let sumH = 0, cntH = 0;
            for (const c of cards){
              try { const r = (isPreviewActive() ? rectForCardBounds(c) : rectForImageArea(c)); const h = Math.max(0, (r.bottom||0) - (r.top||0)); if (h > 0){ sumH += h; cntH++; } } catch {}
            }
            let rowH = 0;
            if (cntH > 0) rowH = Math.round(sumH / cntH);
            if (!rowH){
              const visibleRows = Math.max(1, Math.ceil(cards.length / cols));
              rowH = Math.max(1, Math.round(uni.height / visibleRows));
            }
            const targetH = Math.max(uni.height, rowH * rowsDesired);
            const pad = paddingForCount(cards.length);
            dataUrl = await captureStitchedRect(uni.left, uni.top, uni.width, targetH, pad);
          } else {
            dataUrl = await captureStitchedTo(rootInfo.root, { top: 6, right: 0, bottom: 68, left: 0 });
          }
          forceWhiteBackground(false);
          restoreHiddenOverlays();
          restore(); restoreRemovedSections();
          if(dataUrl){
            const title = __deriveTitleFromRoot__(rootInfo);
            const filename = __safeFilenameFromTitle__(title || 'yowishlist50');
            sendResponse && sendResponse({ ok:true, dataUrl, filename, startFrom: (startInfo && startInfo.used) || 'auto' });
          }
          else { toast('Crop capture failed — try again or use the page\'s Download button.'); sendResponse && sendResponse({ ok:false, startFrom: (startInfo && startInfo.used) || 'auto' }); }
        } catch(e){
          forceWhiteBackground(false);
          restoreHiddenOverlays();
          restore(); restoreRemovedSections();
          sendResponse && sendResponse({ ok:false, error: String(e&&e.message||e) });
        }
      }, 300);
      return true;
    }
    if (msg.type === 'yl50-restore'){ restore(); restoreRemovedSections(); toast('List restored'); sendResponse && sendResponse({ ok:true }); return true; }
    if (msg.type === 'yl50-pick'){ startPicker(); sendResponse && sendResponse({ ok:true }); return true; }
    if (msg.type === 'yl50-find-scope'){
      // Try to resolve the target root by scopeName, then scroll and highlight it
      try{
        const container=getContainer();
        const rootInfo=pickTargetSection(state.which, container);
        const root = rootInfo && rootInfo.root;
        if (root && root.scrollIntoView){
          root.scrollIntoView({ behavior:'smooth', block:'start' });
          // Brief highlight
          const hl = document.createElement('div');
          const r = root.getBoundingClientRect();
          Object.assign(hl.style, { position:'fixed', left:(r.left-6)+'px', top:(r.top-6)+'px', width:(r.width+12)+'px', height:(r.height+12)+'px', border:'3px solid #2f71ff', borderRadius:'12px', pointerEvents:'none', zIndex:2147483646, boxSizing:'border-box' });
          document.body.appendChild(hl);
          setTimeout(()=>{ try{ hl.remove(); }catch{} }, 1200);
          toast('Focused on the section matching your Scope.');
          sendResponse && sendResponse({ ok:true });
        } else {
          toast('No section matched your Scope — try Pick card selector.');
          sendResponse && sendResponse({ ok:false });
        }
      }catch(e){ toast('Could not focus on scope: '+(e&&e.message||e)); sendResponse && sendResponse({ ok:false, error:String(e&&e.message||e) }); }
      return true;
    }
  });
})();