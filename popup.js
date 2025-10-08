(function(){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const STORAGE_KEYS = {
    limit: 'yl50_limit',
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
  };
  chrome.storage.sync.get({ yl50_limit:50, yl50_scope_name:'', yl50_imgbb_key:'', yl50_theme:'default', yl50_auto_switch_share:true, yl50_header_font:'', yl50_saved_cap:'50', yl50_saved_entries:[], yl50_lastTab:'main', yl50_include_title:true }, (res) => {
    $('#limit').value = res.yl50_limit || 50;
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
    // Migration from legacy data if needed, then render
    maybeMigrateLegacy(() => {
      loadSavedEntries((entries)=> renderSavedSelect(entries));
    });
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
      const go = () => cb(tab.id);
      try {
        const url = new URL(tab.url || '');
        const ok = (url.hostname && url.hostname.endsWith('yoworld.info')) && (url.pathname || '').includes('template');
        if (ok) return go();
      } catch(e){}
      chrome.tabs.update(tab.id, { url: 'https://yoworld.info/template' }, () => setTimeout(go, 900));
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
    const scopeName = ($('#scope-name') && $('#scope-name').value || '').trim();
    chrome.storage.sync.set({ yl50_limit: limit, yl50_scope_name: scopeName });
    chrome.tabs.sendMessage(tabId, { type: 'yl50-update-settings', limit, scopeName }, () => done && done());
  }
  function run(tabId, type){ sendUpdate(tabId, () => chrome.tabs.sendMessage(tabId, { type }, () => {})); }
  $('#btn-preview').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-preview')); });
  $('#btn-export-crop').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-export-crop')); });
  $('#btn-restore').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-restore')); });
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

  // Reflect scope-name changes saved elsewhere (optional)
  chrome.storage.onChanged.addListener((changes, area)=>{
    if(area==='sync' && changes && changes[STORAGE_KEYS.scopeName] && $('#scope-name')){
      const nv = changes[STORAGE_KEYS.scopeName].newValue;
      if(typeof nv === 'string') $('#scope-name').value = nv;
    }
  });

  // Tabs
  function showTab(id){
    $('#view-main').style.display = (id==='main')? '' : 'none';
    $('#view-share').style.display = (id==='share')? '' : 'none';
    $('#view-settings').style.display = (id==='settings')? '' : 'none';
    // Active tab classes
    ['tab-main','tab-share','tab-settings'].forEach(tid=>{ const el = document.getElementById(tid); if(!el) return; el.classList.remove('active'); });
    const active = document.getElementById('tab-'+id); if(active) active.classList.add('active');
    chrome.storage.sync.set({ [STORAGE_KEYS.lastTab]: id });
  }
  $('#tab-main').addEventListener('click', () => showTab('main'));
  $('#tab-share').addEventListener('click', () => showTab('share'));
  if ($('#tab-settings')) $('#tab-settings').addEventListener('click', () => showTab('settings'));
  chrome.storage.sync.get({ [STORAGE_KEYS.lastTab]:'main' }, (r)=> {
    showTab(r[STORAGE_KEYS.lastTab] || 'main');
    // After initial tab selection, size popup to the bottom of the Main tab
    // so Main shows without inner scrolling; other tabs will scroll inside .app if needed.
    const sizePopupToMain = () => {
      const app = document.querySelector('.app');
      const vm = document.getElementById('view-main');
      const vs = document.getElementById('view-share');
      const vset = document.getElementById('view-settings');
      if (!app || !vm) return;
      // Preserve current visibility and sizing
      const prev = {
        vm: vm.style.display,
        vs: vs ? vs.style.display : undefined,
        vset: vset ? vset.style.display : undefined,
        height: app.style.height,
        maxHeight: app.style.maxHeight
      };
      // Show Main only for measurement
      vm.style.display = '';
      if (vs) vs.style.display = 'none';
      if (vset) vset.style.display = 'none';
      // Temporarily remove max-height clamp so popup can expand while measuring
      app.style.maxHeight = 'none';
      app.style.height = 'auto';
      // Force reflow then measure natural content height
      void app.offsetHeight; // reflow
      const desired = app.scrollHeight;
      // Restore tab visibility
      vm.style.display = prev.vm || '';
      if (vs) vs.style.display = prev.vs ?? 'none';
      if (vset) vset.style.display = prev.vset ?? 'none';
      // Apply measured height so popup lengthens to fit Main; then re-apply max-height rule
      app.style.height = desired + 'px';
      app.style.maxHeight = prev.maxHeight || '';
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
        alert('Selectors reset. Use Pick card selector again if needed.');
      });
    });
  }

  // ===== Saved entries (single dropdown model) =====
  // Stored as array of { title:string, url:string, updatedAt:number, createdAt:number }
  function loadSavedEntries(cb){
    chrome.storage.sync.get({ [STORAGE_KEYS.savedEntries]: [] }, (r)=>{
      let list = Array.isArray(r[STORAGE_KEYS.savedEntries]) ? r[STORAGE_KEYS.savedEntries] : [];
      // sanitize
      list = list.map(e=>({ title: String(e.title||'').trim(), url: String(e.url||''), updatedAt: Number(e.updatedAt||0), createdAt: Number(e.createdAt||Date.now()) }));
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
  function renderSavedSelect(entries, selectTitle){
    const sel = document.getElementById('saved-select'); if(!sel) return;
    sel.innerHTML = '';
    const list = [...(entries||[])].sort((a,b)=> a.title.localeCompare(b.title, undefined, { sensitivity:'base' }));
    for (const e of list){
      const opt = document.createElement('option');
      opt.value = e.title;
      const date = e.updatedAt ? formatDateYMD(e.updatedAt) : '';
      opt.textContent = date ? `${e.title} — ${date}` : e.title;
      opt.dataset.url = e.url||'';
      sel.appendChild(opt);
    }
    if (selectTitle && list.some(x=> x.title === selectTitle)) sel.value = selectTitle;
    else {
      // Try to restore last selection
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
      if (!base){ alert('Enter a title to save.'); return; }
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
            } catch(e){ if (status) status.textContent = 'Upload failed.'; alert('Upload failed: ' + (e&&e.message||e)); return; }
            if (!urlToUse){ alert('No image loaded. Load/paste an image and Upload, then try again.'); return; }
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
        const title = nextUniqueTitle(entries, base);
        const now = Date.now();
        const next = enforceCap([...entries, { title, url:'', updatedAt:0, createdAt: now }], document.getElementById('saved-cap-select')?.value || '50');
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
      const sel = document.getElementById('saved-select'); if(!sel || !sel.value){ alert('Select an entry to rename.'); return; }
      const input = document.getElementById('saved-title'); const base = normalizeTitle(input?.value||''); if(!base){ alert('Enter a new title.'); return; }
      loadSavedEntries((entries)=>{
        const idx = entries.findIndex(e=> e.title === sel.value);
        if (idx < 0) return;
        let newTitle = base;
        if (normalizeTitle(newTitle).toLowerCase() !== normalizeTitle(entries[idx].title).toLowerCase()){
          newTitle = nextUniqueTitle(entries.filter((_,i)=> i!==idx), base);
        }
        entries[idx].title = newTitle;
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
      loadSavedEntries((entries)=>{
        const next = entries.filter(e=> e.title !== sel.value);
        saveSavedEntries(next, ()=>{
          loadSavedEntries((fresh)=>{
            renderSavedSelect(fresh);
            updatePreviewAndFieldsFromEntry(null);
            chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: '' });
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
        updatePreviewAndFieldsFromEntry(entry);
        chrome.storage.sync.set({ [STORAGE_KEYS.savedLast]: entry.title });
      });
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
  if (document.getElementById('btn-upload')){
    document.getElementById('btn-upload').addEventListener('click', async()=>{
      const status = document.getElementById('upload-status');
      try{
        let dataUrl = $('#image-url').dataset.dataUrl; if(!dataUrl) { alert('No image loaded. Load or paste an image first.'); return; }
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
        alert('Upload failed: ' + (e&&e.message||e));
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
      const url = 'https://github.com/Gothicka-YW/YoWishlist-50#readme';
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
        alert('Settings reset.');
      });
    });
  }

  // Theme selection
  function applyTheme(name){
    const cls = ['theme-midnight','theme-yo-pink','theme-emerald','theme-contrast'];
    document.body.classList.remove(...cls);
    if(name==='midnight') document.body.classList.add('theme-midnight');
    else if(name==='yo-pink') document.body.classList.add('theme-yo-pink');
    else if(name==='emerald') document.body.classList.add('theme-emerald');
    else if(name==='contrast') document.body.classList.add('theme-contrast');
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
      if(!key){ alert('Enter your imgbb API key first.'); return; }
      try{
        const u = new URL('https://api.imgbb.com/1');
        u.searchParams.set('key', key);
        const res = await fetch(u.toString(), { method:'GET' });
        if (res.ok) alert('Key looks valid (request ok).');
        else alert('Key test failed: ' + res.status + ' ' + res.statusText);
      } catch(e){ alert('Key test error: ' + (e&&e.message||e)); }
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
  if (document.getElementById('btn-export-json')){
    document.getElementById('btn-export-json').addEventListener('click', ()=>{
      chrome.storage.sync.get(null, (all)=>{
        const data = {
          yl50_saved_entries: all[STORAGE_KEYS.savedEntries] || [],
          yl50_saved_cap: all[STORAGE_KEYS.savedCap] || '50',
          yl50_theme: all[STORAGE_KEYS.theme] || 'default',
          yl50_header_font: all[STORAGE_KEYS.headerFont] || 'sans',
          yl50_auto_switch_share: all[STORAGE_KEYS.autoSwitchShare] !== false,
          yl50_limit: all[STORAGE_KEYS.limit] || 50,
          yl50_scope_name: all[STORAGE_KEYS.scopeName] || ''
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'yowishlist50-export.json'; a.click();
        setTimeout(()=> URL.revokeObjectURL(url), 1500);
      });
    });
  }
  if (document.getElementById('btn-import-json')){
    document.getElementById('btn-import-json').addEventListener('click', ()=> document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{
        try{
          const obj = JSON.parse(String(r.result||'{}'));
          const entries = Array.isArray(obj.yl50_saved_entries) ? obj.yl50_saved_entries : [];
          const cap = String(obj.yl50_saved_cap || '50');
          const theme = obj.yl50_theme || 'default';
          const headerFont = obj.yl50_header_font || 'sans';
          const auto = !!obj.yl50_auto_switch_share;
          const limit = Number(obj.yl50_limit||50);
          const scopeName = String(obj.yl50_scope_name||'');
          chrome.storage.sync.set({
            [STORAGE_KEYS.savedEntries]: enforceCap(entries, cap),
            [STORAGE_KEYS.savedCap]: cap,
            [STORAGE_KEYS.theme]: theme,
            [STORAGE_KEYS.headerFont]: headerFont,
            [STORAGE_KEYS.autoSwitchShare]: auto,
            [STORAGE_KEYS.limit]: limit,
            [STORAGE_KEYS.scopeName]: scopeName
          }, ()=>{
            applyTheme(theme); if ($('#theme-select')) $('#theme-select').value = theme;
            applyCustomHeaderFont(headerFont); if ($('#header-font-select')) $('#header-font-select').value = headerFont;
            if ($('#auto-switch-share')) $('#auto-switch-share').checked = auto;
            if ($('#limit')) $('#limit').value = limit;
            if ($('#scope-name')) $('#scope-name').value = scopeName;
            if ($('#saved-cap-select')) $('#saved-cap-select').value = cap;
            loadSavedEntries((ents)=> renderSavedSelect(ents));
            alert('Import complete.');
          });
        } catch(e){
          alert('Import failed: ' + (e&&e.message||e));
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