
console.log("chrome", chrome)
chrome.action.onClicked.addListener(async(tab) => {
  console.log('click')
  // Send a message to the active tab
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("test")
  if (request.action === 'downloadImages') {
    request.images.forEach((url, index) => {
      chrome.downloads.download({
        url: url,
        filename: `image-${index}.jpg`
      });
    });
    sendResponse({ status: 'Downloading' });
  }
  return true;
});
