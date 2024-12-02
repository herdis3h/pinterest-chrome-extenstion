(function() {
  if (window.imageSelectionScriptActive) {
    // Cleanup if the script is active
    const existingPanel = document.getElementById('image-selection-panel');
    if (existingPanel) existingPanel.remove();
  
    // Clear intervals and observers
    if (window.scrollInterval) clearInterval(window.scrollInterval);
    if (window.imageObserver) window.imageObserver.disconnect();
  
    // Reset any style changes
    document.body.style.backgroundColor = '';
    document.body.style.overflow = '';
  
    // Reset global variables
    delete window.selectedImages;
    delete window.scrollInterval;
    delete window.imageObserver;
    delete window.imageSelectionScriptActive;
  
    console.log("Content script removed.");
  } else {
window.imageSelectionScriptActive = true;
let selectedImages = [];
let scrollInterval;
let observer;

console.log('content.js loaded');
// Inject a floating panel into the webpage for selected images and download button
// Automatically scroll the page smoothly to load more content
function autoScroll() {
  document.body.style.overflow = 'hidden';
  scrollInterval = setInterval(() => {
    window.scrollBy({ top: 1000, behavior: 'smooth' }); // Smooth scroll down by 1000 pixels

    // Check if the page has scrolled to the bottom using scrollHeight
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight) {
      // Stop auto-scroll and observer when reaching the bottom
      stopAutoScrollAndObserver();
    }
  }, 1500); // Scroll every 1.5 seconds to allow new content to load
}


// Set up a MutationObserver to detect new images
function observeImageList() {
  const listDiv = document.querySelector('div[role="list"]');
  if (!listDiv) {
      console.warn('No div with role="list" found.');
      return;
  }

  console.log("Setting up observers for dynamic list items...");

  // IntersectionObserver for visibility tracking
  const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              console.log("List item became visible:", entry.target);
              fetchImagesFromListItem(entry.target); // Fetch images from the visible list item
          }
      });
  }, {
      root: listDiv,   // Observe only within the listDiv
      rootMargin: '0px', // Adjust if needed to trigger earlier
      threshold: 0.1,  // Trigger when at least 10% of the list item is visible
  });

  // MutationObserver for dynamically added list items
  const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('role') === 'listitem') {
                  console.log("New list item detected:", node);
                  visibilityObserver.observe(node); // Start observing the new list item
              }
          });
      });
  });

  // Start observing the listDiv for new list items
  mutationObserver.observe(listDiv, {
      childList: true,
      subtree: true,
  });

  console.log("MutationObserver and IntersectionObserver are active.");
}

// Stop auto-scroll and observer
function stopAutoScrollAndObserver() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('Stopped auto-scroll and observer.');
  }
  document.body.style.overflow = '';
}

// Fetch images from a div with role="list" and update selectedImages
function fetchImages() {
  console.log("fetchImages")
  const listDiv = document.querySelector('div[role="list"]');
  console.log("listDiv", listDiv)
  if (listDiv) {
    const images = listDiv.querySelectorAll('img');
    console.log("images", images)
    images.forEach(img => {
      let imgSrc = img.getAttribute('src');
      
      // If srcset exists, pick the highest quality image (4x)
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',').map(url => url.trim());
        // Select the last (4x) image
        const highestQualityUrl = srcsetUrls[srcsetUrls.length - 1].split(' ')[0]; 
        imgSrc = highestQualityUrl;
      }

      if (imgSrc && !selectedImages.includes(imgSrc)) {
        selectedImages.push(imgSrc);
      }
 
    
    });
    updatePanel();
  }
}

function clearSelectedImages() {
  selectedImages = [];  // Clear the selected images array
  updatePanel();  // Update the panel to reflect the cleared selection

  // Stop any active auto-scroll and observer
  stopAutoScrollAndObserver();

}



// Start observing and scrolling
async function startFetchingImages() {
  console.log("startFetchingImages")
  const listDiv = document.querySelector('div[role="list"]');

  if (listDiv) {
    const rect = listDiv.getBoundingClientRect();

    // Check if listDiv is out of view, adjust scroll position if needed
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
     await window.scrollBy({ top: rect.top, behavior: 'smooth' });
    }
  }

  // Now start observing and auto-scrolling
  observeImageList();
  autoScroll();  // Start smooth auto-scroll
}


// Handle the Fetch Images button click
async function fetchImagesButtonClick() {
  const loader = document.getElementById('loader');

  // Check if loader exists
  if (loader) {
    // Show the loader
    loader.style.display = 'block';
  } else {
    console.warn("Loader element not found");
  }

  await startFetchingImages();  // Start fetching and scrolling

  // Hide the loader once the fetching process is done
  setTimeout(() => {
    if (loader) {
      loader.style.display = 'none';
    }
  }, 500);
}




function injectPanel() {

  document.body.style.backgroundColor = 'green';
  const panel = document.createElement('div');
  panel.id = 'image-selection-panel';
  panel.style.position = 'fixed';
  panel.style.top = '50px';
  panel.style.right = '0';
  panel.style.width = '250px';
  panel.style.background = 'white';
  panel.style.border = 'none';
  panel.style.borderRadius = '20px';
  panel.style.padding = '15px';
  panel.style.zIndex = '10000';

  const header = document.createElement('h3');
  header.textContent = 'PinSaver';
  header.style.paddingBottom = '5px';
  panel.appendChild(header);

  // Description text under header
  const description = document.createElement('span');
  description.textContent = 'Select, export all images from your Pinterest moodboard.';
  description.style.fontSize = '12px';
  description.style.color = '#8d8d8d';
  description.style.display = 'block';
  description.style.marginBottom = '10px';
  panel.appendChild(description);

  const selectedImageList = document.createElement('div');
  selectedImageList.id = 'selected-images-list';
  selectedImageList.style.display = 'flex';  // Display images in a row
  selectedImageList.style.position = 'relative';  // Display images in a row
  selectedImageList.style.height = '150px';  // Enable horizontal scrolling
  selectedImageList.style.overflowX = 'auto';  // Enable horizontal scrolling
  selectedImageList.style.overflowY = 'hidden';  // Enable horizontal scrolling
  selectedImageList.style.whiteSpace = 'nowrap';  // Prevent line breaks
  selectedImageList.style.border = '1px solid #dbdbdb';  // Prevent line breaks
  selectedImageList.style.borderRadius = '8px';  // Prevent line breaks
  selectedImageList.style.padding = '5px';  // Prevent line breaks
  selectedImageList.style.background = '#f5f5f5';  // Prevent line breaks
  selectedImageList.style.marginBottom = '10px';  // Prevent line breaks

  panel.appendChild(selectedImageList);

  // Loader element
  const loader = document.createElement('div');
  loader.id = 'loader';
  loader.style.position = 'absolute';
  loader.style.left = '40%';
  loader.style.top = '35%';
  loader.style.border = '5px solid #f3f3f3';  // Outer circle
  loader.style.borderRadius = '50%';
  loader.style.borderTop = '5px solid #3498db';  // Blue colored rotating part
  loader.style.width = '30px';
  loader.style.height = '30px';
  loader.style.display = 'none';
  loader.style.animation = 'spin 1s linear infinite';  // Animation for spinning
  selectedImageList.appendChild(loader);

  // Add an element to show the image count
  const imageCount = document.createElement('div');
  imageCount.id = 'image-count';
  imageCount.textContent = `Selected Images Count: 0`;
  imageCount.style.marginBottom = '10px';
  panel.appendChild(imageCount);

  // Create a container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '10px';  // Add spacing between the buttons
  buttonContainer.style.marginTop = '10px';
  panel.appendChild(buttonContainer);
  

  // Fetch Images Button
  const fetchImagesButton = document.createElement('button');
  fetchImagesButton.textContent = 'Select all images in board';
  fetchImagesButton.style.border = '0'; 
  fetchImagesButton.style.borderRadius = '20px'; 
  fetchImagesButton.style.padding = '10px 15px'; 
  fetchImagesButton.style.width = '100%'; 
  fetchImagesButton.onclick = fetchImagesButtonClick;
  buttonContainer.appendChild(fetchImagesButton);

  // Create a nested div for "Remove all images" and "Download" buttons
  const actionButtonsContainer = document.createElement('div');
  actionButtonsContainer.style.display = 'flex';
  actionButtonsContainer.style.flexDirection = 'row-reverse';
  actionButtonsContainer.style.gap = '10px';
  actionButtonsContainer.style.justifyContent = 'flex-end';

  // Clear Images Button
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Reset';
  clearButton.style.border = '0'; 
  clearButton.style.borderRadius = '20px'; 
  clearButton.style.padding = '10px 15px'; 
  clearButton.style.width = 'fit-content'; 
  clearButton.onclick = clearSelectedImages;
  actionButtonsContainer.appendChild(clearButton);

  // Download Button with Icon
  const downloadButton = document.createElement('button');
  downloadButton.style.border = '0'; 
  downloadButton.style.borderRadius = '20px'; 
  downloadButton.style.padding = '10px 15px'; 
  downloadButton.style.width = 'fit-content'; 
  downloadButton.onclick = downloadSelectedImages;

  const exportIcon = document.createElement('span');
  exportIcon.innerHTML = `<svg style="height: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`;

  // Append the icon and text to the download button
  downloadButton.appendChild(exportIcon);
  actionButtonsContainer.appendChild(downloadButton);

  // Append the nested div to the main button container
  buttonContainer.appendChild(actionButtonsContainer);

  document.body.appendChild(panel);
}

// Add a keyframe animation for the loader's spin effect
const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.getElementsByTagName('head')[0].appendChild(style);

 

// Update the panel with the currently selected images
function updatePanel() {
  const imageList = document.getElementById('selected-images-list');
  const imageCount = document.getElementById('image-count');
  imageList.innerHTML = '';
  
  selectedImages.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100px';
    img.style.height = '150px';
    img.style.marginRight = '10px';
    imageList.appendChild(img);
  });

  // Update the count of selected images
  imageCount.textContent = `Selected Images Count: ${selectedImages.length}`;
}

// Handle downloading selected images
function downloadSelectedImages() {
  console.log("selectedImages", selectedImages)
  chrome.runtime.sendMessage({ action: 'downloadImages', images: selectedImages }, (response) => {
    console.log('Download started', response);
  });
}


// Handle image selection
document.addEventListener('click', function(event) {
  if (event.target.tagName.toLowerCase() === 'img') {
    const img = event.target.closest('img');

    if (selectedImages.includes(img.src)) {
      // Deselect image
      img.style.border = '';
      selectedImages = selectedImages.filter(url => url !== img.src);
    } else {
      // Select image
      img.style.border = '5px solid red';
      selectedImages.push(img.src);
    }

    // Update selected images panel
    updatePanel();
  }
});
injectPanel();
}
})();