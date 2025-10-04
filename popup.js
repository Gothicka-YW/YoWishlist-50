(function(){
  const $ = (sel) => document.querySelector(sel);
  chrome.storage.sync.get({ yl50_limit:50, yl50_scope:'wish' }, (res) => {
    $('#limit').value = res.yl50_limit || 50;
    $('#scope').value = res.yl50_scope || 'wish';
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
    const which = $('#scope').value || 'wish';
    chrome.storage.sync.set({ yl50_limit: limit, yl50_scope: which });
    chrome.tabs.sendMessage(tabId, { type: 'yl50-update-settings', limit, which }, () => done && done());
  }
  function run(tabId, type){ sendUpdate(tabId, () => chrome.tabs.sendMessage(tabId, { type }, () => {})); }
  $('#btn-preview').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-preview')); });
  $('#btn-export').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-export')); });
  $('#btn-export-crop').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-export-crop')); });
  $('#btn-restore').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-restore')); });
  $('#btn-pick').addEventListener('click', () => { withReady((tabId) => run(tabId, 'yl50-pick')); });
})();