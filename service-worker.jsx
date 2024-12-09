const injectedTabs = new Set();

let init = false

chrome.action.onClicked.addListener((tab) => {
  console.log("Action clicked on tab:",tab, tab.id, Array.from(injectedTabs));
if(!init) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ['content.js'],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(`Error injecting script into tab ${tab.id}:`, chrome.runtime.lastError.message);
      } else {
        console.log(`Content script injected into tab ${tab.id}`);
        injectedTabs.add(tab.id); // Track the tab as having an injected script
        console.log("Updated injectedTabs:", Array.from(injectedTabs));
      }
    }
  );
  init = true
}
  if (!tab.url.includes('chrome://')) {
    console.log("start:", Array.from(injectedTabs));
    if (injectedTabs.has(tab.id)) {
      console.log("injectedTabs", injectedTabs)
      // Send a message to content script to perform cleanup
      chrome.tabs.sendMessage(tab.id, { action: 'RemoveScript' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`Error communicating with tab ${tab.id}: ${chrome.runtime.lastError.message}`);
          injectedTabs.delete(tab.id); // Force removal from tracking
        } else {
          console.log('Cleanup response:', response);
          injectedTabs.delete(tab.id); // Remove tab from tracking
        }
        // if( Array.from(injectedTabs).length === 0) {

        // }
        console.log("Updated injectedTabs:", Array.from(injectedTabs));
      });
    } else {
      // Inject the content script
      chrome.tabs.sendMessage(tab.id, { action: 'AddScript' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`Error communicating with tab ${tab.id}: ${chrome.runtime.lastError.message}`);
          injectedTabs.add(tab.id); // Force removal from tracking
        } else {
          console.log('Cleanup response:', response);
          injectedTabs.add(tab.id); // Remove tab from tracking
        }
 
        console.log("123Updated injectedTabs:", Array.from(injectedTabs));
      });
    }
  }
});

// Handle tab updates to send a message to the content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && injectedTabs.has(tabId)) {
    console.log(`Tab ${tabId} updated: ${tab.url}`);
    chrome.tabs.sendMessage(tabId, { action: 'pageUpdated' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(`Error communicating with tab ${tabId}: ${chrome.runtime.lastError.message}`);
      } else {
        console.log('Page update response:', response);
      }
    });
  }
});

 
// Handle tab closures to clean up the tracking state
chrome.tabs.onRemoved.addListener((tabId) => {
  if (injectedTabs.has(tabId)) {
    injectedTabs.delete(tabId);
    console.log(`Tab ${tabId} removed from tracking.`);
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

