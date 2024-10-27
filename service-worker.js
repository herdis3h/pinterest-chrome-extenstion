

function injectPanel() {
  console.log("injectPanel")
  const existingPanel = document.getElementById('image-selection-panel');
  if (existingPanel) {
    // Destroy the script and remove the panel
    existingPanel.remove();
    document.body.style.backgroundColor = ''; // Reset background color
    console.log("Panel removed");
  } else {
    // Inject the panel
    document.body.style.backgroundColor = 'blue';
    console.log("injectPanel");
    const panel = document.createElement('div');
    panel.id = 'image-selection-panel';
    panel.style.position = 'fixed';
    panel.style.top = '50px';
    panel.style.right = '0';
    panel.style.width = '250px';
    panel.style.background = 'white';
    panel.style.border = '1px solid #ccc';
    panel.style.padding = '10px';
    panel.style.zIndex = '10000';

    const header = document.createElement('h3');
    header.textContent = 'Selected Images';
    panel.appendChild(header);

    const selectedImageList = document.createElement('div');
    selectedImageList.id = 'selected-images-list';
    panel.appendChild(selectedImageList);

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Selected Images';
    panel.appendChild(downloadButton);

    document.body.appendChild(panel);
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.includes('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }
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

