(function(){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const __uuid = () => { try{ if (crypto && crypto.randomUUID) return crypto.randomUUID(); }catch{} return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36); };
  const STORAGE_KEYS = {
    limit: 'yl50_limit',
    columns: 'yl50_columns',
    scope: 'yl50_scope', // legacy
    scopeName: 'yl50_scope_name',
    container: 'yl50_container',
    card: 'yl50_card',
    hint: 'yl50_selectors',
    profiles: 'yl50_profiles', // legacy
    lastProfile: 'yl50_profiles_last', // legacy
    imgbbKey: 'yl50_imgbb_key',
    lastTab: 'yl50_lastTab',
    theme: 'yl50_theme',
    autoSwitchShare: 'yl50_auto_switch_share',
    profileImages: 'yl50_profile_images', // legacy
    headerFont: 'yl50_header_font',
    savedEntries: 'yl50_saved_entries',
    savedCap: 'yl50_saved_cap',
    migratedV2: 'yl50_migrated_v2',
    savedLast: 'yl50_saved_last',
    includeTitle: 'yl50_include_title'
    , avatars: 'yl50_avatars'
    , avatarCap: 'yl50_avatar_cap'
    , avatarLast: 'yl50_avatar_last'
    , avatarLastGroup: 'yl50_avatar_last_group'
    , avatarSearch: 'yl50_avatar_search'
    , imagesSavedEntries: 'yl50_images_saved_entries'
    , imagesSavedLast: 'yl50_images_saved_last'
    , imagesIncludeTitle: 'yl50_images_include_title'
    , savedTitleDraft: 'yl50_saved_title_draft'
    , avatarDraft: 'yl50_av_draft'
  };
  // Inline notice helper
  let __noticeTimer = null;
  function showNotice(type, message, timeout=2500){
    try{
      const box = document.getElementById('notice');
      const text = document.getElementById('notice-text');
      if(!box || !text) { alert(String(message||'')); return; }
      box.classList.remove('notice-success','notice-error','notice-info');
      const cls = type==='error' ? 'notice-error' : (type==='success' ? 'notice-success' : 'notice-info');
      box.classList.add(cls);
      text.textContent = String(message||'');
      box.style.display = 'block';
      const closer = document.getElementById('notice-close');
      if (closer && !closer.__wired){ closer.__wired = true; closer.addEventListener('click', ()=>{ box.style.display='none'; }); }
      if (__noticeTimer) clearTimeout(__noticeTimer);
      __noticeTimer = setTimeout(()=>{ box.style.display='none'; }, Math.max(1200, timeout|0));
    }catch{ try{ alert(String(message||'')); }catch{} }
  }
  chrome.storage.sync.get({ yl50_limit:50, yl50_columns:5, yl50_scope_name:'', yl50_imgbb_key:'', yl50_theme:'default', yl50_auto_switch_share:true, yl50_header_font:'', yl50_saved_cap:'50', yl50_saved_entries:[], yl50_lastTab:'home', yl50_include_title:true, yl50_avatars:[], yl50_avatar_cap:'100', yl50_avatar_last:'', yl50_avatar_last_group:'', yl50_avatar_search:'', yl50_images_saved_entries:[], yl50_images_saved_last:'', yl50_images_include_title:true, yl50_saved_title_draft:'', yl50_av_draft:{} }, (res) => {
    $('#limit').value = res.yl50_limit || 50;
    if (document.getElementById('columns')) document.getElementById('columns').value = res.yl50_columns || 5;
    $('#imgbb-key').value = res.yl50_imgbb_key || '';
    const warn = document.getElementById('qu-warning'); if(warn) warn.style.display = (res.yl50_imgbb_key ? 'none' : 'inline');
    if ($('#scope-name')) $('#scope-name').value = res.yl50_scope_name || '';
    applyTheme(res.yl50_theme || 'default');
    if ($('#theme-select')) $('#theme-select').value = res.yl50_theme || 'default';
    if ($('#auto-switch-share')) $('#auto-switch-share').checked = !!res.yl50_auto_switch_share;
  // Populate local fonts from fonts.css and apply
  initLocalFonts(res.yl50_header_font || '');
    // Saved cap + saved entries
    if ($('#saved-cap-select')) $('#saved-cap-select').value = String(res.yl50_saved_cap || '50');
  if ($('#include-title')) $('#include-title').checked = !!res.yl50_include_title;
  if (document.getElementById('images-include-title')) document.getElementById('images-include-title').checked = !!res.yl50_images_include_title;
  // Avatars initial
  if (document.getElementById('av-cap-select')) document.getElementById('av-cap-select').value = String(res.yl50_avatar_cap || '100');
  if (document.getElementById('av-search')) document.getElementById('av-search').value = String(res.yl50_avatar_search || '');
  // Load avatars and render grid placeholder
  initAvatars(res.yl50_avatars || [], res.yl50_avatar_last || '', res.yl50_avatar_last_group || '', res.yl50_avatar_search || '');
  initImages(res.yl50_images_saved_entries || [], res.yl50_images_saved_last || '');
    // Migration from legacy data if needed, then render
    maybeMigrateLegacy(() => {
      loadSavedEntries((entries)=> renderSavedSelect(entries));
    });
    // Restore drafts
    try{
      if (document.getElementById('saved-title')) document.getElementById('saved-title').value = String(res.yl50_saved_title_draft||'');
      const avd = (res.yl50_av_draft||{});
      if (document.getElementById('av-name')) document.getElementById('av-name').value = String(avd.name||'');
      if (document.getElementById('av-group')) document.getElementById('av-group').value = String(avd.group||'');
      if (document.getElementById('av-tags')) document.getElementById('av-tags').value = String(avd.tags||'');
      if (document.getElementById('av-desc')) document.getElementById('av-desc').value = String(avd.desc||'');
    }catch{}
    // Brand icon preload: try to swap to custom raven icon only if available
    const brand = document.getElementById('brand-logo');
    if (brand){
      const desired = brand.getAttribute('data-brand');
      if (desired){
        const testImg = new Image();
        testImg.onload = () => { try{ brand.src = desired; }catch{} };
        testImg.onerror = () => {/* keep default */};
        testImg.src = desired;
      }
    }
  });
  function activeTemplateTab(cb){
    chrome.tabs.query({ active:true, currentWindow:true }, (tabs) => {
      const tab = tabs && tabs[0]; if (!tab) return;
      try {
        const url = new URL(tab.url || '');
        const ok = (url.hostname && url.hostname.endsWith('yoworld.info')) && (url.pathname || '').includes('template');
        if (ok) { cb(tab.id); return; }
      } catch(e){}
      showNotice('info', 'Screen Grab works only on yoworld.info/template. Use "Open template page" to navigate there.');
    });
  }

  function gateMainTabByUrl(){
    try{
      chrome.tabs.query({ active:true, currentWindow:true }, (tabs)=>{
        const tab = tabs && tabs[0];
        let ok = false;
        try{
          const url = new URL(tab?.url || '');
          ok = (url.hostname && url.hostname.endsWith('yoworld.info')) && (url.pathname || '').includes('template');
        } catch{}
        const ids = ['btn-preview','btn-export-crop','btn-restore','btn-pick','btn-clear-selectors'];
        ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled = !ok; });
        const status = document.getElementById('start-status');
        if (status){
          if (!ok) status.textContent = 'Screen Grab is available only on yoworld.info/template';
          else updateStartStatus(); // will be refreshed on actions
        }
      });
    }catch{}
  }
  // ================== Avatars Data Model ==================
  function normalizeTags(raw){
    return Array.from(new Set(String(raw||'').split(/[,\n]/).map(t=>t.trim()).filter(Boolean)));
  }
  function avatarCapValue(){ return document.getElementById('av-cap-select')?.value || '100'; }
  function enforceAvatarCap(list, cap){
    if (!Array.isArray(list)) return [];
    if (!cap || cap === 'unlimited') return list;
    const n = Number(cap)||100; if (list.length <= n) return list;
    // Drop oldest by updatedAt/createdAt
    const sorted = [...list].sort((a,b)=> (b.updatedAt||b.createdAt||0) - (a.updatedAt||a.createdAt||0));
    return sorted.slice(0, n);
  }
  function loadAvatars(cb){ chrome.storage.sync.get({ [STORAGE_KEYS.avatars]:[] }, r => { const arr = Array.isArray(r[STORAGE_KEYS.avatars])? r[STORAGE_KEYS.avatars] : []; cb(sanitizeAvatars(arr)); }); }
  function saveAvatars(list, cb){ chrome.storage.sync.set({ [STORAGE_KEYS.avatars]: list }, ()=> cb && cb()); }
  function sanitizeAvatars(list){
    return (Array.isArray(list)? list : []).map(e=>({
  id: String(e.id||__uuid()),
      name: String(e.name||'').trim(),
      group: String(e.group||'').trim(),
      tags: Array.isArray(e.tags)? e.tags.map(t=>String(t)) : normalizeTags(e.tags),
      desc: String(e.desc||'').trim(),
      url: String(e.url||''),
      createdAt: Number(e.createdAt||Date.now()),
      updatedAt: Number(e.updatedAt||e.createdAt||Date.now())
    }));
  }
  function initAvatars(initial, lastId, lastGroup, search){
    const list = sanitizeAvatars(initial);
    renderAvatarGrid(list, lastGroup, search);
    if (lastId) {
      const found = list.find(a=> a.id === lastId);
      if (found) selectAvatar(found, list);
    }
  }
  function renderAvatarGrid(list, groupFilter, search){
    const grid = document.getElementById('av-grid'); if(!grid) return;
    const gf = String(groupFilter||'').trim().toLowerCase();
    const q = String(search||'').trim().toLowerCase();
    let filtered = list.filter(a => {
      const passesGroup = !gf || gf === 'all' || (gf === 'ungrouped' ? !a.group : a.group.toLowerCase() === gf);
      if (!passesGroup) return false;
      if (!q) return true;
      const hay = [a.name, a.group, a.desc, ...(a.tags||[])].join(' ').toLowerCase();
      return hay.includes(q);
    });
    // Sort
    const sortVal = document.getElementById('av-sort')?.value || 'name';
    const byName = (a,b)=> (a.name||'').localeCompare(b.name||'', undefined, { sensitivity:'base' });
    if (sortVal === 'name') filtered.sort(byName);
    else if (sortVal === 'updated') filtered.sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));
    else if (sortVal === 'created') filtered.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    grid.innerHTML = '';
    if (!filtered.length){
      const empty = document.createElement('div'); empty.className='muted'; empty.textContent = 'No avatars.'; grid.appendChild(empty); updateAvatarCount(0, list.length); renderAvatarGroupFilter(list, groupFilter); return;
    }
    const bulk = !!document.getElementById('av-bulk-toggle')?.checked;
    const selectedSet = window.__avSel || (window.__avSel = new Set());
    chrome.storage.sync.get({ [STORAGE_KEYS.avatarLast]: '' }, (st)=>{
      const lastId = st[STORAGE_KEYS.avatarLast] || '';
      for (const a of filtered){
        const card = document.createElement('div');
        card.className = 'avatar-card';
        if (lastId === a.id && !bulk) card.classList.add('selected');
        const tagsHtml = (a.tags||[]).slice(0,2).map(t=>`<span class="tag-chip" title="${escapeAttr(t)}">${escapeAttr(t)}</span>`).join('');
        const imgHtml = a.url ? `<img src="${escapeAttr(a.url)}" alt="${escapeAttr(a.name)}"/>` : `<div class="avatar-placeholder">No Image</div>`;
        card.innerHTML = `
          <div class="avatar-thumb">${imgHtml}</div>
          <div class="avatar-name" title="${escapeAttr(a.name)}">${escapeAttr(a.name||'(unnamed)')}</div>
          ${a.group? `<div class="group-badge" title="${escapeAttr(a.group)}">${escapeAttr(a.group)}</div>`:''}
          <div class="avatar-tags">${tagsHtml}</div>
        `;
        if (bulk){
          const cb=document.createElement('input'); cb.type='checkbox'; cb.checked = selectedSet.has(a.id);
          cb.addEventListener('change', ()=>{ if(cb.checked) selectedSet.add(a.id); else selectedSet.delete(a.id); updateBulkButtons(); });
          // Toggle selection by clicking anywhere on the card (except the checkbox itself)
          card.addEventListener('click', (e)=>{ const t=e.target; if(t && t.tagName==='INPUT') return; cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
          card.appendChild(cb);
        } else {
          card.addEventListener('click', ()=>{
            selectAvatar(a, list);
            chrome.storage.sync.set({ [STORAGE_KEYS.avatarLast]: a.id });
            // Update selected highlighting
            $$('#av-grid .avatar-card.selected').forEach(el=> el.classList.remove('selected'));
            card.classList.add('selected');
          });
        }
        grid.appendChild(card);
      }
      updateBulkButtons();
      updateAvatarCount(filtered.length, list.length);
      renderAvatarGroupFilter(list, groupFilter);
    });
  }
  function escapeAttr(str){
    return String(str||'').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }
  function updateBulkButtons(){
    const bulk = !!document.getElementById('av-bulk-toggle')?.checked;
    const del = document.getElementById('av-btn-bulk-delete');
    const exp = document.getElementById('av-btn-export-selected');
    const clr = document.getElementById('av-btn-clear-selection');
    if (!bulk){ if (del) del.disabled=true; if (exp) exp.disabled=true; if (clr) clr.disabled=true; return; }
    const sel = window.__avSel || new Set();
    const has = sel.size>0; if (del) del.disabled=!has; if (exp) exp.disabled=!has; if (clr) clr.disabled=!has;
  }
  function updateAvatarCount(shown, total){ const el=document.getElementById('av-count'); if(el) el.textContent = `${shown}/${total}`; }
  function renderAvatarGroupFilter(list, groupFilter){
    const sel=document.getElementById('av-group-filter'); if(!sel) return;
    const groups = Array.from(new Set(list.map(a=>a.group).filter(Boolean))).sort((a,b)=> a.localeCompare(b, undefined,{sensitivity:'base'}));
    const prev = sel.value;
    sel.innerHTML='';
    const opts=[{v:'all',t:'All'},{v:'ungrouped',t:'Ungrouped'},...groups.map(g=>({v:g.toLowerCase(), t:g}))];
    for(const o of opts){ const opt=document.createElement('option'); opt.value=o.v; opt.textContent=o.t; sel.appendChild(opt); }
    // Restore selection preference
    const target = (groupFilter||prev||'all').toLowerCase();
    if (opts.some(o=>o.v===target)) sel.value=target; else sel.value='all';
  }
  function selectAvatar(avatar, list){
    const body=document.getElementById('av-preview-body'); const empty=document.getElementById('av-preview-empty'); if(!body||!empty) return;
    empty.style.display='none'; body.style.display='block';
    const img=document.getElementById('av-preview-image'); if(img){ img.src=avatar.url||''; }
    if(document.getElementById('av-meta-name')) document.getElementById('av-meta-name').value = avatar.name||'';
    if(document.getElementById('av-meta-group')) document.getElementById('av-meta-group').value = avatar.group||'';
    if(document.getElementById('av-meta-tags')) document.getElementById('av-meta-tags').value = (avatar.tags||[]).join(', ');
    if(document.getElementById('av-meta-desc')) document.getElementById('av-meta-desc').value = avatar.desc||'';
    chrome.storage.sync.set({ [STORAGE_KEYS.avatarLast]: avatar.id });
    // Wire Save meta
    const saveBtn=document.getElementById('av-btn-save-meta'); if(saveBtn){
      saveBtn.onclick = ()=>{
        loadAvatars(entries=>{
          const idx = entries.findIndex(e=> e.id===avatar.id); if(idx<0) return;
          entries[idx].name = String(document.getElementById('av-meta-name')?.value||'').trim();
          entries[idx].group = String(document.getElementById('av-meta-group')?.value||'').trim();
          entries[idx].tags = normalizeTags(document.getElementById('av-meta-tags')?.value||'');
          entries[idx].desc = String(document.getElementById('av-meta-desc')?.value||'').trim();
          entries[idx].updatedAt = Date.now();
          saveAvatars(entries, ()=> renderAvatarGrid(entries, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value));
        });
      };
    }
    const delBtn=document.getElementById('av-btn-delete'); if(delBtn){
      delBtn.onclick = ()=>{
        if(!confirm('Delete this avatar?')) return;
        loadAvatars(entries=>{
          const next = entries.filter(e=> e.id!==avatar.id);
          saveAvatars(next, ()=>{
            renderAvatarGrid(next, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value);
            const body=document.getElementById('av-preview-body'); const empty=document.getElementById('av-preview-empty'); if(body&&empty){ body.style.display='none'; empty.style.display='block'; }
          });
        });
      };
    }
    const replaceBtn=document.getElementById('av-btn-replace'); if(replaceBtn){
      replaceBtn.onclick = ()=>{
        // Use staged dataUrl from av-image-url dataset if present
        const staged = document.getElementById('av-image-url')?.dataset?.dataUrl || '';
        if(!staged){ showNotice('error', 'Load/paste a new image first.'); return; }
        uploadAvatarDataUrl(staged, (url)=>{
          loadAvatars(entries=>{
            const idx = entries.findIndex(e=> e.id===avatar.id); if(idx<0) return;
            entries[idx].url = url; entries[idx].updatedAt = Date.now();
            saveAvatars(entries, ()=>{
              delete document.getElementById('av-image-url')?.dataset?.dataUrl;
              document.getElementById('av-image-url').value = url;
              renderAvatarGrid(entries, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value);
              selectAvatar(entries[idx], entries);
            });
          });
        });
      };
    }
    const copy2=document.getElementById('av-btn-copy-url2'); if(copy2){ copy2.onclick = ()=>{ if(avatar.url) navigator.clipboard.writeText(avatar.url); }; }
    const copyBB=document.getElementById('av-btn-copy-bb'); if(copyBB){ copyBB.onclick = ()=>{ if(avatar.url){ const bb=`[img]${avatar.url}[/img]`; navigator.clipboard.writeText(bb); } }; }
    const dl=document.getElementById('av-btn-download'); if(dl){ dl.onclick = ()=>{ if(avatar.url){ try{ chrome.downloads.download({ url: avatar.url, filename: (avatar.name||'avatar')+'.png' }); }catch{ window.open(avatar.url, '_blank'); } } }; }
  }
  // Upload & Save new avatar
  if (document.getElementById('av-btn-upload')){
    document.getElementById('av-btn-upload').addEventListener('click', ()=>{
      const name = String(document.getElementById('av-name')?.value||'').trim(); if(!name){ showNotice('error', 'Enter a name.'); return; }
      const group = String(document.getElementById('av-group')?.value||'').trim();
      const tagsRaw = document.getElementById('av-tags')?.value||'';
      const desc = String(document.getElementById('av-desc')?.value||'').trim();
      const staged = document.getElementById('av-image-url')?.dataset?.dataUrl || '';
      if(!staged){ showNotice('error', 'Load or paste an image first.'); return; }
      uploadAvatarDataUrl(staged, (url)=>{
        loadAvatars(entries=>{
          const cap = avatarCapValue();
          const now = Date.now();
          const dupIdx = entries.findIndex(e => String(e.name||'').trim().toLowerCase() === name.toLowerCase());
          if (dupIdx >= 0){
            const ok = confirm(`An avatar named "${entries[dupIdx].name}" already exists. Override its image and details?`);
            if (!ok) return;
            entries[dupIdx].group = group;
            entries[dupIdx].tags = normalizeTags(tagsRaw);
            entries[dupIdx].desc = desc;
            entries[dupIdx].url = url;
            entries[dupIdx].updatedAt = now;
            const next = enforceAvatarCap(entries, cap);
            saveAvatars(next, ()=>{
              delete document.getElementById('av-image-url')?.dataset?.dataUrl;
              document.getElementById('av-image-url').value = url;
              renderAvatarGrid(next, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value);
            });
          } else {
            const next = enforceAvatarCap([...entries, { id: __uuid(), name, group, tags: normalizeTags(tagsRaw), desc, url, createdAt: now, updatedAt: now }], cap);
            saveAvatars(next, ()=>{
              delete document.getElementById('av-image-url')?.dataset?.dataUrl;
              document.getElementById('av-image-url').value = url;
              renderAvatarGrid(next, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value);
            });
          }
        });
      });
    });
  }
  // Avatar file load controls
  if (document.getElementById('av-btn-load-file')){
    document.getElementById('av-btn-load-file').addEventListener('click', ()=> document.getElementById('av-file-input')?.click());
    document.getElementById('av-file-input').addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const r = new FileReader(); r.onload = ()=> stageAvatarDataUrl(r.result); r.readAsDataURL(f);
    });
  }
  if (document.getElementById('av-btn-clear-image')){
    document.getElementById('av-btn-clear-image').addEventListener('click', ()=>{
      const img=document.getElementById('av-image-preview'); if(img){ img.src=''; img.style.display='none'; }
      const iu=document.getElementById('av-image-url'); if(iu){ iu.value=''; delete iu.dataset.dataUrl; }
    });
  }
  // Drag/drop zone
  const avDrop = document.getElementById('av-drop-zone');
  if (avDrop){
    avDrop.addEventListener('click', ()=> document.getElementById('av-btn-load-file')?.click());
    avDrop.addEventListener('dragover', (e)=>{ e.preventDefault(); avDrop.classList.add('dragover'); });
    avDrop.addEventListener('dragleave', ()=> avDrop.classList.remove('dragover'));
    avDrop.addEventListener('drop', (e)=>{
      e.preventDefault(); avDrop.classList.remove('dragover');
      const dt = e.dataTransfer; if(!dt) return;
      const file = (dt.files && dt.files[0]) || null;
      if (file && file.type && file.type.startsWith('image/')){
        const reader = new FileReader(); reader.onload = ()=> stageAvatarDataUrl(reader.result); reader.readAsDataURL(file);
      }
    });
  }
  // Paste to avatar staging
  document.addEventListener('paste', (e)=>{
    if (!document.getElementById('view-avatars') || document.getElementById('view-avatars').style.display==='none') return; // only when avatar tab visible
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const it of items){
      if (it.kind === 'file'){
        const f = it.getAsFile(); if(f && f.type && f.type.startsWith('image/')){
          const r=new FileReader(); r.onload=()=> stageAvatarDataUrl(r.result); r.readAsDataURL(f); e.preventDefault(); break;
        }
      }
    }
  });
  function stageAvatarDataUrl(dataUrl){
    if(!dataUrl) return; const iu=document.getElementById('av-image-url'); const img=document.getElementById('av-image-preview'); if(iu){ iu.value=''; iu.dataset.dataUrl=dataUrl; } if(img){ img.src=dataUrl; img.style.display='block'; }
  }
  // Persist avatar draft fields while typing
  ;['av-name','av-group','av-tags','av-desc'].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    let t=null; el.addEventListener('input', ()=>{
      clearTimeout(t); t=setTimeout(()=>{
        const draft = {
          name: String(document.getElementById('av-name')?.value||''),
          group: String(document.getElementById('av-group')?.value||''),
          tags: String(document.getElementById('av-tags')?.value||''),
          desc: String(document.getElementById('av-desc')?.value||'')
        };
        chrome.storage.sync.set({ [STORAGE_KEYS.avatarDraft]: draft });
      }, 150);
    });
  });
  // Upload logic (reuse existing fallback chain)
  function uploadAvatarDataUrl(dataUrl, done){
    const status=document.getElementById('av-upload-status'); if(status) status.textContent='Trying imgbb…';
    (async()=>{
      let url='';
      try { url = await uploadDataUrlImgBB(dataUrl); }
      catch(e1){ if(status) status.textContent='imgbb failed, trying catbox…'; try { url = await uploadDataUrlCatbox(dataUrl); } catch(e2){ if(status) status.textContent='All uploads failed.'; throw e2; } }
      if(status) status.textContent='Done.'; done && done(url);
    })().catch(e=>{ showNotice('error', 'Upload failed: ' + (e&&e.message||e)); });
  }
  // Filters & search wiring
  if (document.getElementById('av-group-filter')){
    document.getElementById('av-group-filter').addEventListener('change', ()=>{
      const group = document.getElementById('av-group-filter').value;
      chrome.storage.sync.set({ [STORAGE_KEYS.avatarLastGroup]: group });
      loadAvatars(entries=> renderAvatarGrid(entries, group, document.getElementById('av-search')?.value));
    });
  }
  if (document.getElementById('av-sort')){
    document.getElementById('av-sort').addEventListener('change', ()=>{
      loadAvatars(entries=> renderAvatarGrid(entries, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value));
    });
  }
  if (document.getElementById('av-bulk-toggle')){
    document.getElementById('av-bulk-toggle').addEventListener('change', ()=>{
      loadAvatars(entries=> renderAvatarGrid(entries, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value));
    });
  }
  if (document.getElementById('av-btn-clear-selection')){
    document.getElementById('av-btn-clear-selection').addEventListener('click', ()=>{ window.__avSel && window.__avSel.clear(); updateBulkButtons(); loadAvatars(entries=> renderAvatarGrid(entries, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value)); });
  }
  if (document.getElementById('av-btn-bulk-delete')){
    document.getElementById('av-btn-bulk-delete').addEventListener('click', ()=>{
      const sel = window.__avSel || new Set(); if (!sel.size) return;
      if (!confirm(`Delete ${sel.size} selected avatar(s)?`)) return;
      loadAvatars(entries=>{
        const next = entries.filter(e=> !sel.has(e.id));
        saveAvatars(next, ()=>{ window.__avSel.clear(); updateBulkButtons(); renderAvatarGrid(next, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value); });
      });
    });
  }
  // Avatars JSON import/export are centralized in Settings; removed per standards.
  if (document.getElementById('btn-export-json')){
    document.getElementById('btn-export-json').addEventListener('click', ()=>{
      chrome.storage.sync.get(null, (all)=>{
        const data = {
          // Wish Lists
          yl50_saved_entries: all[STORAGE_KEYS.savedEntries] || [],
          yl50_saved_cap: all[STORAGE_KEYS.savedCap] || '50',
          yl50_saved_last: all[STORAGE_KEYS.savedLast] || '',
          yl50_include_title: all[STORAGE_KEYS.includeTitle] !== false,
          // Images tab
          yl50_images_saved_entries: all[STORAGE_KEYS.imagesSavedEntries] || [],
          yl50_images_saved_last: all[STORAGE_KEYS.imagesSavedLast] || '',
          yl50_images_include_title: all[STORAGE_KEYS.imagesIncludeTitle] !== false,
          // Avatars
          yl50_avatars: all[STORAGE_KEYS.avatars] || [],
          yl50_avatar_cap: all[STORAGE_KEYS.avatarCap] || '100',
          yl50_avatar_last: all[STORAGE_KEYS.avatarLast] || '',
          yl50_avatar_last_group: all[STORAGE_KEYS.avatarLastGroup] || 'all',
          yl50_avatar_search: all[STORAGE_KEYS.avatarSearch] || '',
          // Preferences & settings
          yl50_theme: all[STORAGE_KEYS.theme] || 'default',
          yl50_header_font: all[STORAGE_KEYS.headerFont] || '',
          yl50_auto_switch_share: all[STORAGE_KEYS.autoSwitchShare] !== false,
          yl50_limit: all[STORAGE_KEYS.limit] || 50,
          yl50_columns: all[STORAGE_KEYS.columns] || 5,
          yl50_scope_name: all[STORAGE_KEYS.scopeName] || '',
          yl50_container: all[STORAGE_KEYS.container] || '',
          yl50_card: all[STORAGE_KEYS.card] || '',
          yl50_selectors: all[STORAGE_KEYS.hint] || '',
          yl50_imgbb_key: all[STORAGE_KEYS.imgbbKey] || ''
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'yowishlist50-export.json'; a.click();
        setTimeout(()=> URL.revokeObjectURL(url), 1500);
        showNotice('success', 'Exported JSON (yowishlist50-export.json)');
      });
    });
  }
  // Removed legacy Avatars import handler block (now handled via Settings import).
  // Placeholder for compression toggle (future integration). Currently no-op except stored value.
  if (document.getElementById('av-compress')){
    document.getElementById('av-compress').addEventListener('change', ()=>{
      const on = !!document.getElementById('av-compress').checked;
      // In future, integrate pngquant/Canvas encoding tweaks before upload.
      // Stored via localStorage since it is local-only preference
      try{ localStorage.setItem('yl50_avatar_compress', on ? '1' : '0'); }catch{}
    });
    try{ const on = localStorage.getItem('yl50_avatar_compress')==='1'; document.getElementById('av-compress').checked = on; }catch{}
  }
  if (document.getElementById('av-search')){
    let searchTimer=null;
    document.getElementById('av-search').addEventListener('input', ()=>{
      clearTimeout(searchTimer); searchTimer=setTimeout(()=>{
        const val=document.getElementById('av-search').value;
        chrome.storage.sync.set({ [STORAGE_KEYS.avatarSearch]: val });
        loadAvatars(entries=> renderAvatarGrid(entries, document.getElementById('av-group-filter')?.value, val));
      }, 220);
    });
  }
  if (document.getElementById('av-cap-select')){
    document.getElementById('av-cap-select').addEventListener('change', ()=>{
      const cap=document.getElementById('av-cap-select').value;
      chrome.storage.sync.set({ [STORAGE_KEYS.avatarCap]: cap });
      loadAvatars(entries=>{
        const trimmed=enforceAvatarCap(entries, cap);
        if(trimmed.length!==entries.length){ saveAvatars(trimmed, ()=> renderAvatarGrid(trimmed, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value)); }
        else renderAvatarGrid(trimmed, document.getElementById('av-group-filter')?.value, document.getElementById('av-search')?.value);
      });
    });
  }
  function ensureContentReady(tabId, onReady){
    let responded = false;
    try {
      chrome.tabs.sendMessage(tabId, { type:'yl50-ping' }, (res) => {
        responded = true;
        if (chrome.runtime.lastError || !res || !res.ok) injectThenReady(tabId, onReady);
        else onReady();
      });
      setTimeout(() => { if (!responded) injectThenReady(tabId, onReady); }, 400);
    } catch { injectThenReady(tabId, onReady); }
  }
  function injectThenReady(tabId, onReady){
    chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, () => setTimeout(onReady, 250));
  }
  function withReady(cb){ activeTemplateTab((tabId) => ensureContentReady(tabId, () => cb(tabId))); }
  function sendUpdate(tabId, done){
    const limit = Math.max(1, Math.min(100, Number($('#limit').value)||50));
    const columns = Math.max(1, Math.min(10, Number(document.getElementById('columns')?.value)||5));
    const scopeName = ($('#scope-name') && $('#scope-name').value || '').trim();
    chrome.storage.sync.set({ yl50_limit: limit, yl50_columns: columns, yl50_scope_name: scopeName });
    chrome.tabs.sendMessage(tabId, { type: 'yl50-update-settings', limit, columns, scopeName }, () => done && done());
  }
  function updateStartStatus(res){
    try{
      const el = document.getElementById('start-status'); if(!el) return;
      const v = (res && res.startFrom) ? String(res.startFrom) : '';
      el.textContent = 'Start from: ' + (v ? (v === 'picked' ? 'Picked tile' : 'Auto') : '—');
    }catch{}
  }
  function run(tabId, type){
    sendUpdate(tabId, () => chrome.tabs.sendMessage(tabId, { type }, (res) => { updateStartStatus(res); }));
  }
  $('#btn-preview').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-preview')); });
  if (document.getElementById('btn-export-crop')){
    document.getElementById('btn-export-crop').addEventListener('click', () => {
      withReady((tabId) => run(tabId, 'yl50-export-crop'));
      chrome.storage.sync.get({ [STORAGE_KEYS.autoSwitchShare]: true }, (r) => {
        if (r[STORAGE_KEYS.autoSwitchShare]) {
          setTimeout(() => {
            const shareTab = document.getElementById('tab-share');
            if (shareTab) shareTab.click();
          }, 1600);
        }
      });
    });
  }
  $('#btn-restore').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-restore')); });
  // Generic export button (non-crop) if added later could also trigger auto-switch by similar pattern.
  $('#btn-pick').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-pick')); });

  // Press Enter in Scope to find and highlight the matching section
  if (document.getElementById('scope-name')){
    document.getElementById('scope-name').addEventListener('keydown', (e)=>{
      if (e.key === 'Enter'){
        withReady((tabId)=>{
          sendUpdate(tabId, ()=>{
            chrome.tabs.sendMessage(tabId, { type: 'yl50-find-scope' }, ()=>{});
          });
        });
      }
    });
  }

  // Persist scope name while typing
  if (document.getElementById('scope-name')){
    let t=null; document.getElementById('scope-name').addEventListener('input', ()=>{
      clearTimeout(t); t=setTimeout(()=>{
        const v = (document.getElementById('scope-name').value||'').trim();
        chrome.storage.sync.set({ [STORAGE_KEYS.scopeName]: v });
      }, 200);
    });
  }

  // Persist limit when changed
  if (document.getElementById('limit')){
    document.getElementById('limit').addEventListener('change', ()=>{
      const v = Math.max(1, Math.min(100, Number(document.getElementById('limit').value)||50));
      chrome.storage.sync.set({ [STORAGE_KEYS.limit]: v });
    });
  }

  // Reflect scope-name changes saved elsewhere (optional)
  chrome.storage.onChanged.addListener((changes, area)=>{
    if(area==='sync' && changes && changes[STORAGE_KEYS.scopeName] && $('#scope-name')){
      const nv = changes[STORAGE_KEYS.scopeName].newValue;
      if(typeof nv === 'string') $('#scope-name').value = nv;
    }
  });

  // Tabs
  function showTab(id){
    const map = {
      home: '#view-home',
      avatars: '#view-avatars',
      main: '#view-main',
      share: '#view-share',
      images: '#view-images',
      settings: '#view-settings'
    };
    for (const key of Object.keys(map)){
      const sel = map[key]; const el = document.querySelector(sel); if (!el) continue;
      el.style.display = (key === id) ? '' : 'none';
    }
    // Active tab classes (collect current tabs)
    ['home','avatars','main','share','images','settings'].forEach(t => {
      const el = document.getElementById('tab-'+t); if (el) el.classList.remove('active');
    });
    const active = document.getElementById('tab-'+id); if(active) active.classList.add('active');
    chrome.storage.sync.set({ [STORAGE_KEYS.lastTab]: id });
    if (id === 'main') gateMainTabByUrl();
  }
  if ($('#tab-home')) $('#tab-home').addEventListener('click', () => showTab('home'));
  if ($('#tab-avatars')) $('#tab-avatars').addEventListener('click', () => showTab('avatars'));
  if ($('#tab-main')) $('#tab-main').addEventListener('click', () => showTab('main'));
  if ($('#tab-share')) $('#tab-share').addEventListener('click', () => showTab('share'));
  if ($('#tab-images')) $('#tab-images').addEventListener('click', () => showTab('images'));
  if ($('#tab-settings')) $('#tab-settings').addEventListener('click', () => showTab('settings'));
  chrome.storage.sync.get({ [STORAGE_KEYS.lastTab]:'home' }, (r)=> {
    const last = r[STORAGE_KEYS.lastTab];
    // Fallback migration: if last was an old value not in new set, map 'main'->'main', 'share'->'share'
    const valid = ['home','avatars','main','share','images','settings'];
    showTab(valid.includes(last) ? last : 'home');
    // After initial tab selection, size popup to the bottom of the Main tab
    // so Main shows without inner scrolling; other tabs will scroll inside .app if needed.
    const sizePopupToMain = () => {
      const app = document.querySelector('.app');
      const vm = document.getElementById('view-main');
      if (!app || !vm) return;
      // Track all panels to restore later
      const panels = [
        'view-home','view-avatars','view-main','view-share','view-images','view-settings'
      ].map(id => ({ id, el: document.getElementById(id) })).filter(x => x.el);
      // Store the exact display value, including empty string ("") which is significant
      const prevDisplay = new Map(panels.map(x => [x.id, x.el.style.display]));
      const prevSize = { height: app.style.height, maxHeight: app.style.maxHeight };
      // Show Main only for measurement
      panels.forEach(p => { p.el.style.display = (p.id === 'view-main') ? '' : 'none'; });
      // Temporarily remove max-height clamp so popup can expand while measuring
      app.style.maxHeight = 'none';
      app.style.height = 'auto';
      // Force reflow then measure natural content height
      void app.offsetHeight; // reflow
      const desired = app.scrollHeight;
      // Restore tab visibility
      panels.forEach(p => {
        if (prevDisplay.has(p.id)) {
          // Restore exactly what was present before measurement
          p.el.style.display = prevDisplay.get(p.id);
        } else {
          // Fallback only if we somehow didn't capture it
          p.el.style.display = (p.id === 'view-home') ? '' : 'none';
        }
      });
      // Apply measured height so popup lengthens to fit Main; then re-apply max-height rule
      app.style.height = desired + 'px';
      app.style.maxHeight = prevSize.maxHeight || '';
    };
    // Run after layout settles; repeat once to catch async font/layout tweaks
    requestAnimationFrame(()=>{ sizePopupToMain(); setTimeout(sizePopupToMain, 250); });
  });

  // Persist imgbb key on change
  $('#imgbb-key').addEventListener('change', ()=>{
    const key = $('#imgbb-key').value.trim();
    chrome.storage.sync.set({ [STORAGE_KEYS.imgbbKey]: key });
    const warn = document.getElementById('qu-warning'); if(warn) warn.style.display = (key ? 'none' : 'inline');
  });

  // Persist columns when changed
  if (document.getElementById('columns')){
    document.getElementById('columns').addEventListener('change', ()=>{
      const v = Math.max(1, Math.min(10, Number(document.getElementById('columns').value)||5));
      chrome.storage.sync.set({ [STORAGE_KEYS.columns]: v });
    });
  }

  // Resources: auto switch toggle
  if (document.getElementById('auto-switch-share')){
    document.getElementById('auto-switch-share').addEventListener('change', ()=>{
      const val = !!document.getElementById('auto-switch-share').checked;
      chrome.storage.sync.set({ [STORAGE_KEYS.autoSwitchShare]: val });
    });
  }

  // Main: open template page
  if (document.getElementById('btn-open-template')){
    document.getElementById('btn-open-template').addEventListener('click', ()=>{
      const url = 'https://yoworld.info/template';
      try { chrome.tabs.create({ url }); } catch { window.open(url, '_blank'); }
    });
  }

  // Footer Privacy Policy now links directly via anchor in popup.html

  // Main: clear saved selectors
  if (document.getElementById('btn-clear-selectors')){
    document.getElementById('btn-clear-selectors').addEventListener('click', ()=>{
      chrome.storage.sync.set({ yl50_container:'', yl50_card:'', yl50_selectors:'', yl50_scope:'wish' }, ()=>{
        showNotice('success', 'Selectors reset. Use Pick card selector again if needed.');
      });
    });
  }

  // ===== Saved entries (Lists tab) with type filtering =====
  // Model: { title:string, url:string, type:'wish'|'sale'|'wtb', updatedAt:number, createdAt:number }
  const SAVED_DEFAULT_TYPE = 'wish';
  let __savedFilterTypes = new Set(['wish','sale','wtb']);
  let __savedSearch = '';
  chrome.storage.sync.get({ yl50_saved_filters: ['wish','sale','wtb'], yl50_saved_search: '' }, r => {
    try {
      const arr = Array.isArray(r.yl50_saved_filters) ? r.yl50_saved_filters.filter(t => ['wish','sale','wtb'].includes(t)) : ['wish','sale','wtb'];
      __savedFilterTypes = new Set(arr.length ? arr : ['wish','sale','wtb']);
    } catch {}
    __savedSearch = String(r.yl50_saved_search || '').trim();
    const searchEl = document.getElementById('saved-search'); if (searchEl) searchEl.value = __savedSearch;
    document.querySelectorAll('#saved-filter-chips .saved-type-chip').forEach(chip => {
      const t = chip.getAttribute('data-type'); if (__savedFilterTypes.has(t)) chip.classList.add('active'); else chip.classList.remove('active');
    });
  });
  function loadSavedEntries(cb){
    chrome.storage.sync.get({ [STORAGE_KEYS.savedEntries]: [] }, (r)=>{
      let list = Array.isArray(r[STORAGE_KEYS.savedEntries]) ? r[STORAGE_KEYS.savedEntries] : [];
      list = list.map(e=>({
        title: String(e.title||'').trim(),
        url: String(e.url||''),
        type: ['wish','sale','wtb'].includes(e.type) ? e.type : SAVED_DEFAULT_TYPE,
        updatedAt: Number(e.updatedAt||0),
        createdAt: Number(e.createdAt||Date.now())
      }));
      cb(list);
    });
  }
  function saveSavedEntries(list, cb){
    chrome.storage.sync.set({ [STORAGE_KEYS.savedEntries]: list }, ()=> cb && cb());
  }
  function getSavedCap(cb){
    chrome.storage.sync.get({ [STORAGE_KEYS.savedCap]:'50' }, (r)=> cb(String(r[STORAGE_KEYS.savedCap]||'50')));
  }
  function enforceCap(list, capVal){
    if (!list || !Array.isArray(list)) return [];
    if (!capVal || capVal === 'unlimited') return list;
    const cap = Number(capVal)||50;
    if (list.length <= cap) return list;
    // Drop oldest by updatedAt (fallback to createdAt), keep most recent
    const sorted = [...list].sort((a,b)=> (b.updatedAt||b.createdAt||0) - (a.updatedAt||a.createdAt||0));
    return sorted.slice(0, cap).sort((a,b)=> a.title.localeCompare(b.title, undefined, { sensitivity:'base' }));
  }
  function formatDateYMD(ts){ try{ return new Date(ts||Date.now()).toISOString().slice(0,10); }catch{return ''; } }
  function computeSavedCounts(entries){
    const counts = { wish:0, sale:0, wtb:0 };
    for (const e of entries){ if (counts.hasOwnProperty(e.type)) counts[e.type]++; }
    const el = document.getElementById('saved-counts'); if (el){ el.textContent = `Counts: Wish ${counts.wish} | Sale ${counts.sale} | WTB ${counts.wtb}`; }
  }
  function renderSavedSelect(entries, selectTitle){
    const sel = document.getElementById('saved-select'); if(!sel) return;
    sel.innerHTML = '';
    let list = [...(entries||[])];
    list = list.filter(e => __savedFilterTypes.has(e.type));
    if (__savedSearch){ const q = __savedSearch.toLowerCase(); list = list.filter(e => e.title.toLowerCase().includes(q)); }
    list.sort((a,b)=> a.title.localeCompare(b.title, undefined, { sensitivity:'base' }));
    for (const e of list){
      const opt = document.createElement('option');
      opt.value = e.title;
      const date = e.updatedAt ? formatDateYMD(e.updatedAt) : '';
      const prefix = e.type === 'wish' ? 'WL' : (e.type === 'sale' ? 'S' : 'WTB');
      opt.textContent = date ? `[${prefix}] ${e.title} — ${date}` : `[${prefix}] ${e.title}`;
      opt.dataset.url = e.url||'';
      sel.appendChild(opt);
    }
    computeSavedCounts(entries);
    if (selectTitle && list.some(x=> x.title === selectTitle)) sel.value = selectTitle;
    else {
      chrome.storage.sync.get({ [STORAGE_KEYS.savedLast]: '' }, r => {
        const last = r[STORAGE_KEYS.savedLast] || '';
        if (last && list.some(x=> x.title === last)) sel.value = last;
      });
    }
  }
  function setNoImageHint(){
    const url = ($('#image-url')?.value || '').trim();
    const hint = document.getElementById('no-image-hint'); if(hint) hint.style.display = url ? 'none' : 'block';
    const btnUrl = document.getElementById('btn-copy-url'); if(btnUrl) btnUrl.disabled = !url;
    const btnForum = document.getElementById('btn-copy-forum'); if(btnForum) btnForum.disabled = !url;
  }
  function normalizeTitle(t){ return String(t||'').trim(); }
  function titleExists(entries, t){ const nt = normalizeTitle(t).toLowerCase(); return entries.some(e => normalizeTitle(e.title).toLowerCase() === nt); }
  function nextUniqueTitle(entries, base){
    let t = normalizeTitle(base) || 'Untitled';
    if (!titleExists(entries, t)) return t;
    // Try Title2, Title3...
    for (let i=2; i<1000; i++){
      const cand = `${t}${i}`;
      if (!titleExists(entries, cand)) return cand;
    }
    // Fallback include timestamp
    return `${t}-${Date.now()}`;
  }
  function selectEntryByTitle(title, cb){
    loadSavedEntries((entries)=>{
      const idx = entries.findIndex(e => normalizeTitle(e.title) === normalizeTitle(title));
      cb(entries, idx);
    });
  }
  function updatePreviewAndFieldsFromEntry(entry){
    const url = (entry && entry.url) || '';
    const img = document.getElementById('image-preview'); if (img){ img.src = url || ''; img.style.display = url ? 'block' : 'none'; }
    const iu = document.getElementById('image-url'); if (iu){ iu.value = url; delete iu.dataset?.dataUrl; }
    const fl = document.getElementById('forum-link'); if (fl){ fl.value = makeForumLink(url, entry ? entry.title : ''); }
    setNoImageHint();
  }

  // Saved controls
  if (document.getElementById('btn-saved-save')){
    document.getElementById('btn-saved-save').addEventListener('click', async()=>{
      const input = document.getElementById('saved-title'); const base = normalizeTitle(input?.value||'');
      if (!base){ showNotice('error', 'Enter a title to save.'); return; }
      loadSavedEntries(async(entries)=>{
        const existsIdx = entries.findIndex(e => normalizeTitle(e.title) === base);
        const status = document.getElementById('upload-status');
        if (existsIdx >= 0){
          // Ask if this is an update/replace
          const ok = confirm(`A list named "${entries[existsIdx].title}" already exists.\n\nDo you want to update it with the currently loaded image?\nThis will replace its old image URL.`);
          if (ok){
            let urlToUse = document.getElementById('image-url')?.value?.trim() || '';
            const staged = document.getElementById('image-url')?.dataset?.dataUrl || '';
            try{
              if (!urlToUse && staged){
                // Upload staged image with fallbacks
                if (status) status.textContent = 'Trying imgbb…';
                try { urlToUse = await uploadDataUrlImgBB(staged); }
                catch(e1){ if (status) status.textContent = 'imgbb failed, trying postimages…'; try { urlToUse = await uploadDataUrlPostimages(staged); } catch(e2){ if (status) status.textContent = 'postimages failed, trying catbox…'; urlToUse = await uploadDataUrlCatbox(staged); } }
                if (status) status.textContent = 'Done.';
                // Commit staged image as the active one in UI
                const iu = document.getElementById('image-url'); if (iu){ iu.value = urlToUse; delete iu.dataset.dataUrl; }
              }
            } catch(e){ if (status) status.textContent = 'Upload failed.'; showNotice('error', 'Upload failed: ' + (e&&e.message||e)); return; }
            if (!urlToUse){ showNotice('error', 'No image loaded. Load/paste an image and Upload, then try again.'); return; }
            entries[existsIdx].url = urlToUse; entries[existsIdx].updatedAt = Date.now();
            saveSavedEntries(entries, ()=>{
              loadSavedEntries((fresh)=>{
                renderSavedSelect(fresh, entries[existsIdx].title);
                chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: entries[existsIdx].title });
              });
            });
            const fl = document.getElementById('forum-link'); if (fl) fl.value = makeForumLink(urlToUse, entries[existsIdx].title);
            updatePreviewAndFieldsFromEntry(entries[existsIdx]);
            return;
          }
          // User chose not to replace; fall through to save as a new unique title
        }
        const typeEl = document.getElementById('saved-type');
        const entryType = (typeEl && ['wish','sale','wtb'].includes(typeEl.value)) ? typeEl.value : SAVED_DEFAULT_TYPE;
        const title = nextUniqueTitle(entries, base);
        const now = Date.now();
        const next = enforceCap([...entries, { title, url:'', type: entryType, updatedAt:0, createdAt: now }], document.getElementById('saved-cap-select')?.value || '50');
        saveSavedEntries(next, ()=>{
          // re-read for safety, then render and persist last selection
          loadSavedEntries((fresh)=>{
            renderSavedSelect(fresh, title);
            if (document.getElementById('saved-title')) document.getElementById('saved-title').value = title;
            chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: title });
          });
        });
      });
    });
  }
  if (document.getElementById('btn-saved-rename')){
    document.getElementById('btn-saved-rename').addEventListener('click', ()=>{
      const sel = document.getElementById('saved-select'); if(!sel || !sel.value){ showNotice('error', 'Select an entry to rename.'); return; }
      const input = document.getElementById('saved-title'); const base = normalizeTitle(input?.value||''); if(!base){ showNotice('error', 'Enter a new title.'); return; }
      loadSavedEntries((entries)=>{
        const idx = entries.findIndex(e=> e.title === sel.value);
        if (idx < 0) return;
        let newTitle = base;
        if (normalizeTitle(newTitle).toLowerCase() !== normalizeTitle(entries[idx].title).toLowerCase()){
          newTitle = nextUniqueTitle(entries.filter((_,i)=> i!==idx), base);
        }
        entries[idx].title = newTitle;
        const typeEl = document.getElementById('saved-type');
        if (typeEl && ['wish','sale','wtb'].includes(typeEl.value)) entries[idx].type = typeEl.value;
        saveSavedEntries(entries, ()=>{
          loadSavedEntries((fresh)=>{
            renderSavedSelect(fresh, newTitle);
            if (document.getElementById('saved-title')) document.getElementById('saved-title').value = newTitle;
            chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: newTitle });
          });
        });
      });
    });
  }
  if (document.getElementById('btn-saved-delete')){
    document.getElementById('btn-saved-delete').addEventListener('click', ()=>{
      const sel = document.getElementById('saved-select'); if(!sel || !sel.value) return;
      const title = sel.value;
      if (!confirm(`Delete "${title}"?`)) return;
      loadSavedEntries((entries)=>{
        const next = entries.filter(e=> e.title !== title);
        saveSavedEntries(next, ()=>{
          loadSavedEntries((fresh)=>{
            renderSavedSelect(fresh);
            updatePreviewAndFieldsFromEntry(null);
            chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: '' });
            showNotice('success', `Deleted "${title}".`);
          });
        });
      });
    });
  }
  if (document.getElementById('btn-saved-load')){
    document.getElementById('btn-saved-load').addEventListener('click', ()=>{
      const sel = document.getElementById('saved-select'); if(!sel || !sel.value) return;
      loadSavedEntries((entries)=>{
        const entry = entries.find(e=> e.title === sel.value);
        if (!entry) return;
        const input = document.getElementById('saved-title'); if (input) input.value = entry.title;
        const typeEl = document.getElementById('saved-type'); if (typeEl && ['wish','sale','wtb'].includes(entry.type)) typeEl.value = entry.type;
        updatePreviewAndFieldsFromEntry(entry);
        chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: entry.title });
      });
    });
  }

  // Persist draft title while typing (Lists tab)
  if (document.getElementById('saved-title')){
    let tt=null; document.getElementById('saved-title').addEventListener('input', ()=>{
      clearTimeout(tt); tt=setTimeout(()=>{
        const v = String(document.getElementById('saved-title').value||'');
        chrome.storage.sync.set({ [STORAGE_KEYS.savedTitleDraft]: v });
      }, 150);
    });
  }
  // Persist type preference
  if (document.getElementById('saved-type')){
    document.getElementById('saved-type').addEventListener('change', ()=>{
      const v = document.getElementById('saved-type').value;
      chrome.storage.sync.set({ yl50_saved_type_last: v });
    });
    chrome.storage.sync.get({ yl50_saved_type_last: 'wish' }, r => {
      if (['wish','sale','wtb'].includes(r.yl50_saved_type_last)) document.getElementById('saved-type').value = r.yl50_saved_type_last;
    });
  }
  // Filter chips
  document.querySelectorAll('#saved-filter-chips .saved-type-chip').forEach(chip => {
    chip.addEventListener('click', ()=>{
      const t = chip.getAttribute('data-type'); if (!t) return;
      if (chip.classList.contains('active')){ chip.classList.remove('active'); __savedFilterTypes.delete(t); }
      else { chip.classList.add('active'); __savedFilterTypes.add(t); }
      if (!__savedFilterTypes.size){ __savedFilterTypes = new Set(['wish','sale','wtb']); document.querySelectorAll('#saved-filter-chips .saved-type-chip').forEach(c=> c.classList.add('active')); }
      chrome.storage.sync.set({ yl50_saved_filters: Array.from(__savedFilterTypes) });
      loadSavedEntries(entries=> renderSavedSelect(entries));
    });
  });
  // Search
  if (document.getElementById('saved-search')){
    let st=null; document.getElementById('saved-search').addEventListener('input', ()=>{
      clearTimeout(st); st=setTimeout(()=>{
        __savedSearch = String(document.getElementById('saved-search').value||'').trim();
        chrome.storage.sync.set({ yl50_saved_search: __savedSearch });
        loadSavedEntries(entries=> renderSavedSelect(entries));
      }, 180);
    });
  }

  // Load local image file to upload
  if (document.getElementById('btn-load-file')){
    document.getElementById('btn-load-file').addEventListener('click', ()=> document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        stageDataUrl(reader.result);
      };
      reader.readAsDataURL(f);
    });
  }
  // Share: clear image controls
  if (document.getElementById('btn-clear-image')){
    document.getElementById('btn-clear-image').addEventListener('click', ()=>{
      const img = document.getElementById('image-preview'); if (img){ img.src=''; img.style.display='none'; }
      const iu = document.getElementById('image-url'); if (iu){ iu.value=''; delete iu.dataset.dataUrl; }
      const fl = document.getElementById('forum-link'); if (fl){ fl.value=''; }
      setNoImageHint();
    });
  }

  // Quick Uploader: drag & drop and paste support
  function stageDataUrl(dataUrl){
    if(!dataUrl) return;
    $('#image-url').value = '';
    $('#forum-link').value = '';
    $('#image-url').dataset.dataUrl = dataUrl;
    const img = document.getElementById('image-preview');
    if (img){ img.src = dataUrl; img.style.display = 'block'; }
    setNoImageHint();
  }
  const drop = document.getElementById('drop-zone');
  if (drop){
    drop.addEventListener('click', ()=> document.getElementById('btn-load-file')?.click());
    drop.addEventListener('dragover', (e)=>{ e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', ()=> drop.classList.remove('dragover'));
    drop.addEventListener('drop', (e)=>{
      e.preventDefault(); drop.classList.remove('dragover');
      const dt = e.dataTransfer; if(!dt) return;
      const file = (dt.files && dt.files[0]) || null;
      if (file && file.type && file.type.startsWith('image/')){
        const reader = new FileReader();
        reader.onload = ()=> stageDataUrl(reader.result);
        reader.readAsDataURL(file);
      }
    });
  }
  // Paste image from clipboard
  document.addEventListener('paste', (e)=>{
    // Only process for Wish Lists when that view is visible; otherwise Avatars paste handler may take over
    const vs = document.getElementById('view-share');
    const shareVisible = !!vs && getComputedStyle(vs).display !== 'none';
    if (!shareVisible) return;
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const it of items){
      if (it.kind === 'file'){
        const f = it.getAsFile();
        if (f && f.type && f.type.startsWith('image/')){
          const r = new FileReader();
          r.onload = ()=> stageDataUrl(r.result);
          r.readAsDataURL(f);
          e.preventDefault();
          break;
        }
      }
    }
  });

  // Optional: resize to 390x260 like YoWorld Paint Quick Uploader (cover crop)
  function resizeDataUrlCover(dataUrl, W=390, H=260){
    return new Promise((resolve)=>{
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth||img.width, ih = img.naturalHeight||img.height;
        if (!iw || !ih){ return resolve(dataUrl); }
        const scale = Math.max(W/iw, H/ih);
        const tw = Math.round(iw*scale), th = Math.round(ih*scale);
        const cx = Math.round((tw - W)/2), cy = Math.round((th - H)/2);
        const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, -cx, -cy, tw, th);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = ()=> resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // Upload via imgbb API
  async function uploadDataUrlImgBB(dataUrl){
    const key = ($('#imgbb-key').value||'').trim();
    if(!key) throw new Error('Missing imgbb API key');
    const base64 = dataUrl.split(',')[1];
    const form = new FormData();
    form.append('key', key);
    form.append('image', base64);
    // Optional: set name/expiration
    form.append('name', 'yowishlist50');
    const up = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body: form });
    const json = await up.json();
    if(!json || !json.success){
      const msg = (json && json.error && (json.error.message||json.error)) || 'Upload failed';
      throw new Error(msg);
    }
    // Prefer direct URL to image
    const url = (json.data && ((json.data.image && json.data.image.url) || json.data.url || json.data.display_url)) || '';
    if(!url) throw new Error('Upload succeeded but URL missing');
    return url;
  }
  // Upload via catbox (fallback)
  async function uploadDataUrlCatbox(dataUrl){
    const blob = await (async()=>{
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/data:(.*?);base64/)[1] || 'image/png';
      const bin = atob(arr[1]);
      const len = bin.length; const buf = new Uint8Array(len);
      for (let i=0;i<len;i++) buf[i] = bin.charCodeAt(i);
      return new Blob([buf], { type: mime });
    })();
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', blob, 'yowishlist50.png');
    const res = await fetch('https://catbox.moe/user/api.php', { method:'POST', body: form });
    const text = await res.text();
    if (!res.ok || !/^https?:\/\//i.test(text)) throw new Error('Catbox upload failed');
    return text.trim();
  }
  // Placeholder for postimages (best-effort)
  async function uploadDataUrlPostimages(_dataUrl){
    // Postimages has no stable public API without key; skip with clear message
    throw new Error('Postimages upload not available');
  }
  function makeForumLink(url, title){
    const includeTitle = !!document.getElementById('include-title')?.checked;
    const t = normalizeTitle(title) || 'Wishlist';
    if (!url) return includeTitle ? `[b]${t}[/b]\n(no image)` : `(no image)`;
    return includeTitle ? `[b]${t}[/b]\n[img]${url}[/img]` : `[img]${url}[/img]`;
  }
  // ============ Images tab logic (mirrors Wish Lists) ============
  function imagesNormalizeTitle(t){ return String(t||'').trim(); }
  function imagesTitleExists(entries, t){ const nt = imagesNormalizeTitle(t).toLowerCase(); return entries.some(e => imagesNormalizeTitle(e.title).toLowerCase() === nt); }
  function imagesNextUniqueTitle(entries, base){
    let t = imagesNormalizeTitle(base) || 'Untitled';
    if (!imagesTitleExists(entries, t)) return t;
    for (let i=2; i<1000; i++){ const cand = `${t}${i}`; if (!imagesTitleExists(entries, cand)) return cand; }
    return `${t}-${Date.now()}`;
  }
  function imagesLoadEntries(cb){ chrome.storage.sync.get({ [STORAGE_KEYS.imagesSavedEntries]: [] }, r => { const arr = Array.isArray(r[STORAGE_KEYS.imagesSavedEntries])? r[STORAGE_KEYS.imagesSavedEntries] : []; cb(arr.map(e=>({ title:String(e.title||'').trim(), url:String(e.url||''), updatedAt:Number(e.updatedAt||0), createdAt:Number(e.createdAt||Date.now()) }))); }); }
  function imagesSaveEntries(list, cb){ chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedEntries]: list }, ()=> cb && cb()); }
  function imagesFormatDate(ts){ try{ return new Date(ts||Date.now()).toISOString().slice(0,10); }catch{return '';} }
  function imagesRenderSelect(entries, selectTitle){
    const sel = document.getElementById('images-saved-select'); if(!sel) return;
    sel.innerHTML='';
    const list = [...(entries||[])].sort((a,b)=> a.title.localeCompare(b.title, undefined, { sensitivity:'base' }));
    for(const e of list){ const opt=document.createElement('option'); opt.value=e.title; opt.textContent = e.updatedAt? `${e.title} — ${imagesFormatDate(e.updatedAt)}` : e.title; opt.dataset.url=e.url||''; sel.appendChild(opt); }
    if (selectTitle && list.some(x=> x.title===selectTitle)) sel.value=selectTitle; else {
      chrome.storage.sync.get({ [STORAGE_KEYS.imagesSavedLast]: '' }, r=>{ const last=r[STORAGE_KEYS.imagesSavedLast]||''; if(last && list.some(x=>x.title===last)) sel.value=last; });
    }
  }
  function imagesSetNoImageHint(){
    const url = (document.getElementById('images-image-url')?.value||'').trim();
    const hint = document.getElementById('images-no-image-hint'); if(hint) hint.style.display = url ? 'none' : 'block';
    const btnUrl = document.getElementById('images-btn-copy-url'); if(btnUrl) btnUrl.disabled = !url;
    const btnForum = document.getElementById('images-btn-copy-forum'); if(btnForum) btnForum.disabled = !url;
  }
  function imagesUpdatePreview(entry){
    const url = (entry && entry.url) || '';
    const img = document.getElementById('images-image-preview'); if(img){ img.src=url||''; img.style.display = url ? 'block' : 'none'; }
    const iu = document.getElementById('images-image-url'); if(iu){ iu.value=url; delete iu.dataset?.dataUrl; }
    const fl = document.getElementById('images-forum-link'); if(fl){ const t=document.getElementById('images-saved-title')?.value||''; const inc=!!document.getElementById('images-include-title')?.checked; fl.value = inc ? makeForumLink(url, t) : `[img]${url}[/img]`; }
    imagesSetNoImageHint();
  }
  function imagesStageDataUrl(dataUrl){ if(!dataUrl) return; const iu=document.getElementById('images-image-url'); const img=document.getElementById('images-image-preview'); if(iu){ iu.value=''; iu.dataset.dataUrl=dataUrl; } if(img){ img.src=dataUrl; img.style.display='block'; } imagesSetNoImageHint(); }
  function initImages(initial, last){ imagesRenderSelect(initial||[], last||''); imagesSetNoImageHint(); }

  // Images: file load
  if (document.getElementById('images-btn-load-file')){
    document.getElementById('images-btn-load-file').addEventListener('click', ()=> document.getElementById('images-file-input')?.click());
    document.getElementById('images-file-input')?.addEventListener('change', (e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=> imagesStageDataUrl(r.result); r.readAsDataURL(f); });
  }
  // Images: clear
  if (document.getElementById('images-btn-clear-image')){
    document.getElementById('images-btn-clear-image').addEventListener('click', ()=>{ const img=document.getElementById('images-image-preview'); if(img){ img.src=''; img.style.display='none'; } const iu=document.getElementById('images-image-url'); if(iu){ iu.value=''; delete iu.dataset.dataUrl; } const fl=document.getElementById('images-forum-link'); if(fl){ fl.value=''; } imagesSetNoImageHint(); });
  }
  // Images: drag/drop
  const imagesDrop = document.getElementById('images-drop-zone');
  if (imagesDrop){ imagesDrop.addEventListener('click', ()=> document.getElementById('images-btn-load-file')?.click()); imagesDrop.addEventListener('dragover', (e)=>{ e.preventDefault(); imagesDrop.classList.add('dragover'); }); imagesDrop.addEventListener('dragleave', ()=> imagesDrop.classList.remove('dragover')); imagesDrop.addEventListener('drop', (e)=>{ e.preventDefault(); imagesDrop.classList.remove('dragover'); const dt=e.dataTransfer; if(!dt) return; const f=(dt.files&&dt.files[0])||null; if(f && f.type && f.type.startsWith('image/')){ const r=new FileReader(); r.onload=()=> imagesStageDataUrl(r.result); r.readAsDataURL(f); } }); }
  // Images: paste
  document.addEventListener('paste', (e)=>{
    const v = document.getElementById('view-images'); const visible = !!v && getComputedStyle(v).display !== 'none'; if(!visible) return;
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for(const it of items){ if(it.kind==='file'){ const f=it.getAsFile(); if(f && f.type && f.type.startsWith('image/')){ const r=new FileReader(); r.onload=()=> imagesStageDataUrl(r.result); r.readAsDataURL(f); e.preventDefault(); break; } } }
  });
  // Images: upload
  if (document.getElementById('images-btn-upload')){
    document.getElementById('images-btn-upload').addEventListener('click', async()=>{
      const status=document.getElementById('images-upload-status');
      try{
        const staged = document.getElementById('images-image-url')?.dataset?.dataUrl || '';
        if(!staged){ showNotice('error', 'No image loaded.'); return; }
        document.getElementById('images-btn-upload').disabled=true; document.getElementById('images-btn-upload').textContent='Uploading…';
        if(status) status.textContent='Trying imgbb…';
        let url='';
        try{ url = await uploadDataUrlImgBB(staged); }
        catch(e1){ if(status) status.textContent='imgbb failed, trying catbox…'; url = await uploadDataUrlCatbox(staged); }
        const iu=document.getElementById('images-image-url'); if(iu){ iu.value=url; delete iu.dataset.dataUrl; }
        // Save to entry based on typed or selected title
        const typed = imagesNormalizeTitle(document.getElementById('images-saved-title')?.value||'');
        imagesLoadEntries((entries)=>{
          let idx = typed ? entries.findIndex(e=> imagesNormalizeTitle(e.title)===typed) : -1;
          if (idx < 0){ const sel=document.getElementById('images-saved-select'); if(sel && sel.value){ idx = entries.findIndex(e=> e.title===sel.value); } }
          if (idx >= 0){ entries[idx].url=url; entries[idx].updatedAt=Date.now(); imagesSaveEntries(entries, ()=>{ imagesLoadEntries((fresh)=>{ imagesRenderSelect(fresh, entries[idx].title); chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedLast]: entries[idx].title }); }); }); if(!typed){ const input=document.getElementById('images-saved-title'); if(input) input.value=entries[idx].title; } if(status) status.textContent='Done.'; }
          else if (typed){ const title = imagesNextUniqueTitle(entries, typed); const now=Date.now(); const next=[...entries, { title, url, updatedAt:now, createdAt:now }]; imagesSaveEntries(next, ()=>{ imagesLoadEntries((fresh)=>{ imagesRenderSelect(fresh, title); chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedLast]: title }); }); }); if(status) status.textContent='Saved new entry.'; }
          else { if(status) status.textContent='Uploaded (not saved to a title).'; }
          const fl=document.getElementById('images-forum-link'); if(fl){ const inc=!!document.getElementById('images-include-title')?.checked; const t=document.getElementById('images-saved-title')?.value||''; fl.value = inc ? makeForumLink(url, t) : `[img]${url}[/img]`; }
          imagesSetNoImageHint();
        });
      } catch(e){ if(status) status.textContent='Upload failed.'; showNotice('error', 'Upload failed: ' + (e&&e.message||e)); }
      finally { const b=document.getElementById('images-btn-upload'); if(b){ b.disabled=false; b.textContent='Upload'; } }
    });
  }
  // Images: copy actions and include-title
  if (document.getElementById('images-btn-copy-url')) document.getElementById('images-btn-copy-url').addEventListener('click', ()=>{ const v=document.getElementById('images-image-url')?.value; if(v) navigator.clipboard.writeText(v); });
  if (document.getElementById('images-btn-copy-forum')) document.getElementById('images-btn-copy-forum').addEventListener('click', ()=>{ const v=document.getElementById('images-forum-link')?.value; if(v) navigator.clipboard.writeText(v); });
  if (document.getElementById('images-include-title')) document.getElementById('images-include-title').addEventListener('change', ()=>{
    const include = !!document.getElementById('images-include-title').checked; chrome.storage.sync.set({ [STORAGE_KEYS.imagesIncludeTitle]: include }); const url=document.getElementById('images-image-url')?.value||''; const t=document.getElementById('images-saved-title')?.value||''; const fl=document.getElementById('images-forum-link'); if(fl){ fl.value = include ? makeForumLink(url, t) : `[img]${url}[/img]`; }
  });
  // Images: save/rename/delete/load
  if (document.getElementById('images-btn-save')) document.getElementById('images-btn-save').addEventListener('click', ()=>{
    const base = imagesNormalizeTitle(document.getElementById('images-saved-title')?.value||''); if(!base){ showNotice('error', 'Enter a title to save.'); return; }
    imagesLoadEntries((entries)=>{ const title = imagesNextUniqueTitle(entries, base); const now=Date.now(); const next=[...entries, { title, url:'', updatedAt:0, createdAt:now }]; imagesSaveEntries(next, ()=> imagesLoadEntries(fresh=>{ imagesRenderSelect(fresh, title); chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedLast]: title }); })); });
  });
  if (document.getElementById('images-btn-rename')) document.getElementById('images-btn-rename').addEventListener('click', ()=>{
    const sel=document.getElementById('images-saved-select'); if(!sel||!sel.value){ showNotice('error', 'Select an entry to rename.'); return; }
    const base = imagesNormalizeTitle(document.getElementById('images-saved-title')?.value||''); if(!base){ showNotice('error', 'Enter a new title.'); return; }
    imagesLoadEntries((entries)=>{ const idx=entries.findIndex(e=> e.title===sel.value); if(idx<0) return; let newTitle=base; if(imagesNormalizeTitle(newTitle).toLowerCase() !== imagesNormalizeTitle(entries[idx].title).toLowerCase()){ newTitle = imagesNextUniqueTitle(entries.filter((_,i)=>i!==idx), base); } entries[idx].title=newTitle; imagesSaveEntries(entries, ()=> imagesLoadEntries(fresh=>{ imagesRenderSelect(fresh, newTitle); chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedLast]: newTitle }); })); });
  });
  if (document.getElementById('images-btn-delete')) document.getElementById('images-btn-delete').addEventListener('click', ()=>{
    const sel=document.getElementById('images-saved-select'); if(!sel||!sel.value) return;
    const title = sel.value;
    if (!confirm(`Delete "${title}"?`)) return;
    imagesLoadEntries((entries)=>{
      const next=entries.filter(e=> e.title!==title);
      imagesSaveEntries(next, ()=> imagesLoadEntries(fresh=>{
        imagesRenderSelect(fresh);
        imagesUpdatePreview(null);
        chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedLast]: '' });
        showNotice('success', `Deleted "${title}".`);
      }));
    });
  });
  if (document.getElementById('images-btn-load')) document.getElementById('images-btn-load').addEventListener('click', ()=>{
    const sel=document.getElementById('images-saved-select'); if(!sel||!sel.value) return; imagesLoadEntries((entries)=>{ const entry=entries.find(e=> e.title===sel.value); if(!entry) return; const input=document.getElementById('images-saved-title'); if(input) input.value=entry.title; imagesUpdatePreview(entry); chrome.storage.sync.set({ [STORAGE_KEYS.imagesSavedLast]: entry.title }); });
  });
  if (document.getElementById('btn-upload')){
    document.getElementById('btn-upload').addEventListener('click', async()=>{
      const status = document.getElementById('upload-status');
      try{
        let dataUrl = $('#image-url').dataset.dataUrl; if(!dataUrl) { showNotice('error', 'No image loaded. Load or paste an image first.'); return; }
        document.getElementById('btn-upload').disabled = true; document.getElementById('btn-upload').textContent = 'Uploading…';
        if (status) status.textContent = 'Trying imgbb…';
        let url = '';
        try {
          url = await uploadDataUrlImgBB(dataUrl);
        } catch(e1){
          if (status) status.textContent = 'imgbb failed, trying postimages…';
          try {
            url = await uploadDataUrlPostimages(dataUrl); // will likely throw
          } catch(e2){
            if (status) status.textContent = 'postimages failed, trying catbox…';
            url = await uploadDataUrlCatbox(dataUrl);
          }
        }
        $('#image-url').value = url; delete $('#image-url').dataset.dataUrl;
        // Update saved entry by matching title (if exists), else selected option
        const typedTitle = normalizeTitle(document.getElementById('saved-title')?.value||'');
        loadSavedEntries((entries)=>{
          let idx = typedTitle ? entries.findIndex(e=> normalizeTitle(e.title) === typedTitle) : -1;
          if (idx < 0){
            const sel = document.getElementById('saved-select');
            if (sel && sel.value){ idx = entries.findIndex(e=> e.title === sel.value); }
          }
          if (idx >= 0){
            entries[idx].url = url; entries[idx].updatedAt = Date.now();
            saveSavedEntries(entries, ()=>{
              loadSavedEntries((fresh)=>{
                renderSavedSelect(fresh, entries[idx].title);
                chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: entries[idx].title });
              });
            });
            if (!typedTitle) { const input = document.getElementById('saved-title'); if (input) input.value = entries[idx].title; }
            if (status) status.textContent = 'Done.';
            const fl = document.getElementById('forum-link'); if (fl) fl.value = makeForumLink(url, entries[idx].title);
          } else if (typedTitle) {
            // Create new entry with this title
            const title = nextUniqueTitle(entries, typedTitle);
            const now = Date.now();
            const next = enforceCap([...entries, { title, url, updatedAt: now, createdAt: now }], document.getElementById('saved-cap-select')?.value || '50');
            saveSavedEntries(next, ()=>{
              loadSavedEntries((fresh)=>{
                renderSavedSelect(fresh, title);
                chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: title });
              });
            });
            if (status) status.textContent = 'Saved new entry.';
            const fl2 = document.getElementById('forum-link'); if (fl2) fl2.value = makeForumLink(url, title);
          } else {
            if (status) status.textContent = 'Uploaded (not saved to a title).';
            const fl3 = document.getElementById('forum-link'); if (fl3) fl3.value = makeForumLink(url, '');
          }
        });
        setNoImageHint();
      } catch(e){
        if (status) status.textContent = 'Upload failed.';
        showNotice('error', 'Upload failed: ' + (e&&e.message||e));
      } finally {
        document.getElementById('btn-upload').disabled = false; document.getElementById('btn-upload').textContent = 'Upload';
      }
    });
  }
  // Explicitly save imgbb key
  if (document.getElementById('btn-save-imgbb')){
    document.getElementById('btn-save-imgbb').addEventListener('click', ()=>{
      const key = ($('#imgbb-key').value||'').trim();
      chrome.storage.sync.set({ [STORAGE_KEYS.imgbbKey]: key }, ()=>{
        // optional small feedback
        document.getElementById('btn-save-imgbb').textContent = 'Saved';
        setTimeout(()=> document.getElementById('btn-save-imgbb').textContent = 'Save', 1200);
      });
    });
  }
  if (document.getElementById('btn-copy-url')) document.getElementById('btn-copy-url').addEventListener('click', ()=>{ const v=$('#image-url').value; if(v) navigator.clipboard.writeText(v); });
  if (document.getElementById('btn-copy-forum')) document.getElementById('btn-copy-forum').addEventListener('click', ()=>{ const v=$('#forum-link').value; if(v) navigator.clipboard.writeText(v); });
  // Persist include-title toggle and refresh BBCode on change
  if (document.getElementById('include-title')){
    document.getElementById('include-title').addEventListener('change', ()=>{
      const includeTitle = !!document.getElementById('include-title').checked;
      chrome.storage.sync.set({ [STORAGE_KEYS.includeTitle]: includeTitle });
      const url = document.getElementById('image-url')?.value || '';
      const title = document.getElementById('saved-title')?.value || '';
      const fl = document.getElementById('forum-link'); if (fl) fl.value = makeForumLink(url, title);
    });
  }

  // Resources: open imgbb API key page
  if ($('#btn-get-imgbb-key')){
    $('#btn-get-imgbb-key').addEventListener('click', ()=>{
      const url = 'https://api.imgbb.com/';
      try{
        chrome.tabs.create({ url });
      } catch(e){
        window.open(url, '_blank');
      }
    });
  }
  // Resources: open help
  if (document.getElementById('btn-open-help')){
    document.getElementById('btn-open-help').addEventListener('click', ()=>{
      const url = 'https://github.com/Gothicka-YW/YoCatalog#readme';
      try { chrome.tabs.create({ url }); } catch { window.open(url, '_blank'); }
    });
  }

  // Resources: reset settings to defaults (lightweight)
  if (document.getElementById('btn-reset-settings')){
    document.getElementById('btn-reset-settings').addEventListener('click', ()=>{
      chrome.storage.sync.remove([
        STORAGE_KEYS.limit,
        STORAGE_KEYS.scopeName,
        STORAGE_KEYS.container,
        STORAGE_KEYS.card,
        STORAGE_KEYS.hint,
        STORAGE_KEYS.savedEntries,
        STORAGE_KEYS.imgbbKey,
        STORAGE_KEYS.theme,
        STORAGE_KEYS.autoSwitchShare,
        STORAGE_KEYS.lastTab,
        STORAGE_KEYS.savedCap,
        STORAGE_KEYS.migratedV2
      ], ()=>{
        $('#limit').value = 50;
        if ($('#scope-name')) $('#scope-name').value = '';
        if ($('#imgbb-key')) $('#imgbb-key').value = '';
        const img = document.getElementById('image-preview'); if (img){ img.src=''; img.style.display='none'; }
        const iu = document.getElementById('image-url'); if (iu){ iu.value=''; delete iu.dataset.dataUrl; }
        const fl = document.getElementById('forum-link'); if (fl){ fl.value=''; }
        applyTheme('default'); if ($('#theme-select')) $('#theme-select').value='default';
        if ($('#auto-switch-share')) $('#auto-switch-share').checked = true;
        if ($('#saved-cap-select')) $('#saved-cap-select').value = '50';
        renderSavedSelect([]);
        setNoImageHint();
        showNotice('success', 'Settings reset.');
      });
    });
  }

  // Theme selection
  function applyTheme(name){
    const cls = [
      'theme-midnight','theme-yo-pink','theme-emerald','theme-contrast',
      'theme-mist','theme-green-tea','theme-slate-midnight','theme-autumn-leaf','theme-espresso-cream','theme-dark-graphite'
    ];
    document.body.classList.remove(...cls);
    if (!name || name==='default') return;
    const map = {
      'midnight':'theme-midnight',
      'yo-pink':'theme-yo-pink',
      'emerald':'theme-emerald',
      'contrast':'theme-contrast',
      'mist':'theme-mist',
      'green-tea':'theme-green-tea',
      'slate-midnight':'theme-slate-midnight',
      'autumn-leaf':'theme-autumn-leaf',
      'espresso-cream':'theme-espresso-cream',
      'dark-graphite':'theme-dark-graphite'
    };
    const clsName = map[name];
    if (clsName) document.body.classList.add(clsName);
  }
  if ($('#theme-select')){
    $('#theme-select').addEventListener('change', ()=>{
      const val = $('#theme-select').value;
      applyTheme(val);
      chrome.storage.sync.set({ [STORAGE_KEYS.theme]: val });
    });
  }

  // Header font selection
  async function initLocalFonts(saved){
    try{
      const link = document.querySelector('link[href="fonts/fonts.css"]');
      if (!link){ populateFontSelect([]); return; }
      const cssUrl = link.href;
      const res = await fetch(cssUrl, { cache: 'no-cache' });
      const text = await res.text();
      const families = Array.from(text.matchAll(/@font-face\s*\{[^}]*font-family\s*:\s*(["'])?([^;"']+)\1?\s*;/gi)).map(m=>m[2]).filter(Boolean);
      const unique = Array.from(new Set(families));
      // Default to "Dancing Script" when no saved preference (or legacy 'sans')
      let initial = saved;
      if (!initial || initial === 'sans'){
        if (unique.includes('Dancing Script')) initial = 'Dancing Script';
        else initial = '';
      }
      populateFontSelect(unique, initial);
    } catch { populateFontSelect([], saved); }
  }
  function populateFontSelect(families, saved){
    const sel = document.getElementById('header-font-select'); if (!sel) return;
    sel.innerHTML = '';
    // Default option uses built-in sans stack
    const def = document.createElement('option'); def.value = ''; def.textContent = 'Default (Sans)'; sel.appendChild(def);
    families.forEach(f=>{ const o=document.createElement('option'); o.value=f; o.textContent=f; sel.appendChild(o); });
    // Apply saved
    sel.value = saved || '';
    applyCustomHeaderFont(sel.value);
    sel.addEventListener('change', ()=>{
      applyCustomHeaderFont(sel.value);
      chrome.storage.sync.set({ [STORAGE_KEYS.headerFont]: sel.value });
    });
  }
  function applyCustomHeaderFont(family){
    // Remove legacy classes and use a single custom class + CSS var
    document.body.classList.remove('header-font-sans','header-font-script-brush','header-font-script-segoe','header-font-handwritten','header-font-roundhand','header-font-cursive','header-font-local-1');
    if (!family){ document.body.classList.add('header-font-sans'); document.body.style.removeProperty('--yl-header-font'); return; }
    document.body.style.setProperty('--yl-header-font', `'${family}'`);
    document.body.classList.add('header-font-custom');
  }

  // Test imgbb key without uploading
  if (document.getElementById('btn-test-imgbb')){
    document.getElementById('btn-test-imgbb').addEventListener('click', async()=>{
      const key = ($('#imgbb-key').value||'').trim();
      if(!key){ showNotice('error', 'Enter your imgbb API key first.'); return; }
      try{
        const u = new URL('https://api.imgbb.com/1');
        u.searchParams.set('key', key);
        const res = await fetch(u.toString(), { method:'GET' });
        if (res.ok) showNotice('success', 'Key looks valid (request ok).');
        else showNotice('error', 'Key test failed: ' + res.status + ' ' + res.statusText);
      } catch(e){ showNotice('error', 'Key test error: ' + (e&&e.message||e)); }
    });
  }

  // Saved cap persistence
  if (document.getElementById('saved-cap-select')){
    document.getElementById('saved-cap-select').addEventListener('change', ()=>{
      const v = document.getElementById('saved-cap-select').value;
      chrome.storage.sync.set({ [STORAGE_KEYS.savedCap]: v });
      // enforce immediately
      loadSavedEntries((entries)=>{
        const trimmed = enforceCap(entries, v);
        saveSavedEntries(trimmed, ()=>{
          loadSavedEntries((fresh)=> renderSavedSelect(fresh));
        });
      });
    });
  }

  // Persist last selection when dropdown changes
  if (document.getElementById('saved-select')){
    document.getElementById('saved-select').addEventListener('change', ()=>{
      const v = document.getElementById('saved-select').value || '';
      chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: v });
      if (v){
        loadSavedEntries((entries)=>{
          const entry = entries.find(e=> e.title === v);
          if (entry){
            const input = document.getElementById('saved-title'); if (input) input.value = entry.title;
          }
        });
      }
    });
  }

  // Import/Export JSON
  if (document.getElementById('btn-import-json')){
    document.getElementById('btn-import-json').addEventListener('click', ()=> document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{
        try{
          const obj = JSON.parse(String(r.result||'{}'));
          // Pull values with sane defaults
          const wlEntries = Array.isArray(obj.yl50_saved_entries) ? obj.yl50_saved_entries : [];
          const wlCap = String(obj.yl50_saved_cap || '50');
          const wlLast = String(obj.yl50_saved_last || '');
          const wlIncludeTitle = !!obj.yl50_include_title;

          const imgEntries = Array.isArray(obj.yl50_images_saved_entries) ? obj.yl50_images_saved_entries : [];
          const imgLast = String(obj.yl50_images_saved_last || '');
          const imgIncludeTitle = !!obj.yl50_images_include_title;

          const avatars = Array.isArray(obj.yl50_avatars) ? sanitizeAvatars(obj.yl50_avatars) : [];
          const avCap = String(obj.yl50_avatar_cap || '100');
          const avLast = String(obj.yl50_avatar_last || '');
          const avLastGroup = String(obj.yl50_avatar_last_group || 'all');
          const avSearch = String(obj.yl50_avatar_search || '');

          const theme = obj.yl50_theme || 'default';
          const headerFont = obj.yl50_header_font || '';
          const auto = !!obj.yl50_auto_switch_share;
          const limit = Number(obj.yl50_limit||50);
          const columns = Number(obj.yl50_columns||5);
          const scopeName = String(obj.yl50_scope_name||'');
          const container = String(obj.yl50_container||'');
          const card = String(obj.yl50_card||'');
          const selectors = String(obj.yl50_selectors||'');
          const imgbbKey = String(obj.yl50_imgbb_key||'');

          // Prepare lists with caps applied
          const wlFinal = enforceCap(wlEntries, wlCap);
          const avFinal = enforceAvatarCap(avatars, avCap);

          chrome.storage.sync.set({
            // Wish Lists
            [STORAGE_KEYS.savedEntries]: wlFinal,
            [STORAGE_KEYS.savedCap]: wlCap,
            [STORAGE_KEYS.savedLast]: wlLast,
            [STORAGE_KEYS.includeTitle]: wlIncludeTitle,
            // Images
            [STORAGE_KEYS.imagesSavedEntries]: imgEntries,
            [STORAGE_KEYS.imagesSavedLast]: imgLast,
            [STORAGE_KEYS.imagesIncludeTitle]: imgIncludeTitle,
            // Avatars
            [STORAGE_KEYS.avatars]: avFinal,
            [STORAGE_KEYS.avatarCap]: avCap,
            [STORAGE_KEYS.avatarLast]: avLast,
            [STORAGE_KEYS.avatarLastGroup]: avLastGroup,
            [STORAGE_KEYS.avatarSearch]: avSearch,
            // Preferences & settings
            [STORAGE_KEYS.theme]: theme,
            [STORAGE_KEYS.headerFont]: headerFont,
            [STORAGE_KEYS.autoSwitchShare]: auto,
            [STORAGE_KEYS.limit]: limit,
            [STORAGE_KEYS.columns]: columns,
            [STORAGE_KEYS.scopeName]: scopeName,
            [STORAGE_KEYS.container]: container,
            [STORAGE_KEYS.card]: card,
            [STORAGE_KEYS.hint]: selectors,
            [STORAGE_KEYS.imgbbKey]: imgbbKey
          }, ()=>{
            // Apply UI updates
            applyTheme(theme); if ($('#theme-select')) $('#theme-select').value = theme;
            applyCustomHeaderFont(headerFont); if ($('#header-font-select')) $('#header-font-select').value = headerFont;
            if ($('#auto-switch-share')) $('#auto-switch-share').checked = auto;
            if ($('#limit')) $('#limit').value = limit;
            if (document.getElementById('columns')) document.getElementById('columns').value = columns;
            if ($('#scope-name')) $('#scope-name').value = scopeName;
            if ($('#imgbb-key')) $('#imgbb-key').value = imgbbKey;
            // Wish Lists
            if ($('#saved-cap-select')) $('#saved-cap-select').value = wlCap;
            if ($('#include-title')) $('#include-title').checked = wlIncludeTitle;
            loadSavedEntries((ents)=>{ renderSavedSelect(ents, wlLast || undefined); });
            // Images
            imagesLoadEntries((ents)=>{ imagesRenderSelect(ents, imgLast || undefined); });
            if (document.getElementById('images-include-title')) document.getElementById('images-include-title').checked = imgIncludeTitle;
            // Avatars
            initAvatars(avFinal, avLast, avLastGroup, avSearch);
            const wlCount = Array.isArray(wlFinal) ? wlFinal.length : 0;
            const imgCount = Array.isArray(imgEntries) ? imgEntries.length : 0;
            const avCount = Array.isArray(avFinal) ? avFinal.length : 0;
            showNotice('success', `Import complete — Wish Lists: ${wlCount}, Images: ${imgCount}, Avatars: ${avCount}`);
          });
        } catch(e){
          showNotice('error', 'Import failed: ' + (e&&e.message||e));
        }
      };
      r.readAsText(f);
    });
  }

  // Migration from legacy profiles/images to saved entries
  function maybeMigrateLegacy(done){
    chrome.storage.sync.get({ [STORAGE_KEYS.migratedV2]: false, [STORAGE_KEYS.savedEntries]: [], [STORAGE_KEYS.profileImages]: {}, [STORAGE_KEYS.profiles]: {} }, (r)=>{
      if (r[STORAGE_KEYS.migratedV2]){ done && done(); return; }
      let entries = Array.isArray(r[STORAGE_KEYS.savedEntries]) ? r[STORAGE_KEYS.savedEntries] : [];
      const byProfile = r[STORAGE_KEYS.profileImages] || {};
      const profiles = r[STORAGE_KEYS.profiles] || {};
      const add = [];
      // Migrate images per profile
      for (const pname of Object.keys(byProfile)){
        const list = Array.isArray(byProfile[pname]) ? byProfile[pname] : [];
        if (list.length === 0){
          add.push({ title: pname, url:'', updatedAt:0, createdAt: Date.now() });
        } else {
          for (const it of list){
            const t = normalizeTitle(it.title || pname) || pname;
            add.push({ title: t, url: it.url||'', updatedAt: Number(it.ts||0), createdAt: Number(it.ts||Date.now()) });
          }
        }
      }
      // Also add bare profiles without images as placeholders
      for (const pname of Object.keys(profiles)){
        if (!add.some(e=> normalizeTitle(e.title).toLowerCase() === normalizeTitle(pname).toLowerCase())){
          add.push({ title: pname, url:'', updatedAt:0, createdAt: Date.now() });
        }
      }
      if (add.length === 0){
        chrome.storage.sync.set({ [STORAGE_KEYS.migratedV2]: true }, ()=> done && done());
        return;
      }
      // Merge into entries ensuring unique titles
      const merged = [...entries];
      for (const e of add){
        const title = nextUniqueTitle(merged, e.title);
        merged.push({ title, url: e.url||'', updatedAt: e.updatedAt||0, createdAt: e.createdAt||Date.now() });
      }
      getSavedCap((cap)=>{
        const final = enforceCap(merged, cap);
        chrome.storage.sync.set({ [STORAGE_KEYS.savedEntries]: final, [STORAGE_KEYS.migratedV2]: true }, ()=> done && done());
      });
    });
  }
})();