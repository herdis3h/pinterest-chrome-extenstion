

chrome.action.onClicked.addListener((tab) => {
  console.log("chrome", chrome)
  if (!tab.url.includes('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }
});



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("chrome", chrome)
  console.log("request", request)
  console.log("sender", sender)
  if (request.action === 'downloadImages') {
    // request.images.forEach((url, index) => {
    //   chrome.downloads.download({
    //     url: url,
    //     filename: `image-${index}.jpg`
    //   });
    // });
    sendResponse({ status: 'Downloading' });
  }
  return true;
});

