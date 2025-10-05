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
    profiles: 'yl50_profiles',
    imgbbKey: 'yl50_imgbb_key',
    lastTab: 'yl50_lastTab',
    theme: 'yl50_theme'
  };
  chrome.storage.sync.get({ yl50_limit:50, yl50_scope_name:'', yl50_profiles:{}, yl50_imgbb_key:'', yl50_theme:'default' }, (res) => {
    $('#limit').value = res.yl50_limit || 50;
    renderProfiles(res.yl50_profiles || {});
    $('#imgbb-key').value = res.yl50_imgbb_key || '';
    if ($('#scope-name')) $('#scope-name').value = res.yl50_scope_name || '';
    applyTheme(res.yl50_theme || 'default');
    if ($('#theme-select')) $('#theme-select').value = res.yl50_theme || 'default';
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
  $('#btn-export').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-export')); });
  $('#btn-export-crop').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-export-crop')); });
  $('#btn-restore').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-restore')); });
  $('#btn-pick').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-pick')); });

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
    $('#view-resources').style.display = (id==='resources')? '' : 'none';
    // Active tab classes
    ['tab-main','tab-share','tab-resources'].forEach(tid=>{ const el = document.getElementById(tid); if(!el) return; el.classList.remove('active'); });
    const active = document.getElementById('tab-'+id); if(active) active.classList.add('active');
    chrome.storage.sync.set({ [STORAGE_KEYS.lastTab]: id });
  }
  $('#tab-main').addEventListener('click', () => showTab('main'));
  $('#tab-share').addEventListener('click', () => showTab('share'));
  if ($('#tab-resources')) $('#tab-resources').addEventListener('click', () => showTab('resources'));
  chrome.storage.sync.get({ [STORAGE_KEYS.lastTab]:'main' }, (r)=> showTab(r[STORAGE_KEYS.lastTab] || 'main'));

  // Persist imgbb key on change
  $('#imgbb-key').addEventListener('change', ()=>{
    const key = $('#imgbb-key').value.trim();
    chrome.storage.sync.set({ [STORAGE_KEYS.imgbbKey]: key });
  });

  // Profiles (saved wishlists/settings)
  function getCurrentSettings(cb){
    chrome.storage.sync.get({
      [STORAGE_KEYS.limit]:50,
      [STORAGE_KEYS.scopeName]:'',
      [STORAGE_KEYS.container]:'',
      [STORAGE_KEYS.card]:'',
      [STORAGE_KEYS.hint]:''
    }, (s)=> cb({
      limit: Number($('#limit').value)||s[STORAGE_KEYS.limit]||50,
      scopeName: ($('#scope-name') && $('#scope-name').value || s[STORAGE_KEYS.scopeName] || '').trim(),
      container: s[STORAGE_KEYS.container]||'',
      card: s[STORAGE_KEYS.card]||'',
      hint: s[STORAGE_KEYS.hint]||''
    }));
  }
  function renderProfiles(map){
    const sel = $('#profile-select'); sel.innerHTML = '';
    const names = Object.keys(map||{}).sort();
    names.forEach(n=>{
      const opt = document.createElement('option'); opt.value = n; opt.textContent = n; sel.appendChild(opt);
    });
  }
  function saveProfile(){
    const name = ($('#profile-name').value||'').trim(); if(!name) return;
    getCurrentSettings((cfg)=>{
      chrome.storage.sync.get({ [STORAGE_KEYS.profiles]:{} }, (res)=>{
        const profiles = res[STORAGE_KEYS.profiles] || {};
        profiles[name] = cfg;
        chrome.storage.sync.set({ [STORAGE_KEYS.profiles]: profiles }, ()=> renderProfiles(profiles));
      });
    });
  }
  function loadProfile(){
    const name = $('#profile-select').value; if(!name) return;
    chrome.storage.sync.get({ [STORAGE_KEYS.profiles]:{} }, (res)=>{
      const p = (res[STORAGE_KEYS.profiles]||{})[name]; if(!p) return;
      $('#limit').value = p.limit || 50;
      if ($('#scope-name')) $('#scope-name').value = p.scopeName || '';
      // Persist and notify content
      chrome.storage.sync.set({
        [STORAGE_KEYS.limit]: p.limit||50,
        [STORAGE_KEYS.scopeName]: p.scopeName||'',
        [STORAGE_KEYS.container]: p.container||'',
        [STORAGE_KEYS.card]: p.card||'',
        [STORAGE_KEYS.hint]: p.hint||''
      });
    });
  }
  function deleteProfile(){
    const name = $('#profile-select').value; if(!name) return;
    chrome.storage.sync.get({ [STORAGE_KEYS.profiles]:{} }, (res)=>{
      const profiles = res[STORAGE_KEYS.profiles] || {}; delete profiles[name];
      chrome.storage.sync.set({ [STORAGE_KEYS.profiles]: profiles }, ()=> renderProfiles(profiles));
    });
  }
  $('#profile-save').addEventListener('click', saveProfile);
  $('#profile-load').addEventListener('click', loadProfile);
  $('#profile-delete').addEventListener('click', deleteProfile);

  // Capture to dataUrl
  $('#btn-crop-data').addEventListener('click', ()=>{
    withReady((tabId)=>{
      sendUpdate(tabId, ()=>{
        chrome.tabs.sendMessage(tabId, { type:'yl50-export-crop-data' }, (res)=>{
          if(res && res.ok && res.dataUrl){
            $('#image-url').value = '';
            $('#forum-link').value = '';
            $('#image-url').dataset.dataUrl = res.dataUrl; // temp store
          }
        });
      });
    });
  });

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
    const url = (json.data && (json.data.url || json.data.display_url || (json.data.image && json.data.image.url))) || '';
    if(!url) throw new Error('Upload succeeded but URL missing');
    return url;
  }
  function makeForumLink(url){
    const title = 'YoWishlist 50';
    return `[url=${url}][img]${url}[/img][/url]\n[b]${title}[/b] Exported with YoWishlist-50`;
  }
  $('#btn-upload').addEventListener('click', async()=>{
    try{
      const dataUrl = $('#image-url').dataset.dataUrl; if(!dataUrl) return;
      $('#btn-upload').disabled = true; $('#btn-upload').textContent = 'Uploading…';
      const url = await uploadDataUrlImgBB(dataUrl);
      $('#image-url').value = url; delete $('#image-url').dataset.dataUrl;
      $('#forum-link').value = makeForumLink(url);
    } catch(e){
      alert('Upload failed: ' + (e&&e.message||e));
    } finally {
      $('#btn-upload').disabled = false; $('#btn-upload').textContent = 'Upload';
    }
  });
  $('#btn-copy-url').addEventListener('click', ()=>{ const v=$('#image-url').value; if(v) navigator.clipboard.writeText(v); });
  $('#btn-copy-forum').addEventListener('click', ()=>{ const v=$('#forum-link').value; if(v) navigator.clipboard.writeText(v); });

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
})();