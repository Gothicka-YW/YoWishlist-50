chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  if (msg.type === 'yl50-capture') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) sendResponse({ ok:false, error: chrome.runtime.lastError.message });
      else sendResponse({ ok:true, dataUrl });
    });
    return true;
  }
  if (msg.type === 'yl50-download') {
    chrome.downloads.download({ url: msg.dataUrl, filename: msg.filename || 'yowishlist50.png' }, (id) => {
      if (chrome.runtime.lastError) sendResponse({ ok:false, error: chrome.runtime.lastError.message });
      else sendResponse({ ok:true, id });
    });
    return true;
  }
});