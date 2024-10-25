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
  console.log("observeImageList", listDiv)
  if (!listDiv) {
    console.log('No div with role="list" found.');
    return;
  }

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // console.log("Mutation detected: ", mutation);
      if (mutation.addedNodes.length || mutation.type === 'attributes') {
        fetchImages();  // Fetch new images when new nodes are added
      }
    });
  });

  observer.observe(listDiv, {
    childList: true, // Watch for child node additions/removals
    attributes: true, // Watch for attribute changes
    subtree: true // Watch all descendants
  });
}

// Stop auto-scroll and observer
function stopAutoScrollAndObserver() {
  console.log("scrollInterval", scrollInterval)
  if (scrollInterval) {
    clearInterval(scrollInterval);  // Stop auto-scroll
  }
  if (observer) {
    observer.disconnect();  // Stop observing
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


// Clear selected images
function clearSelectedImages() {
  selectedImages = [];  // Empty the selected images array
  updatePanel();  // Update the panel to reflect the change
}


// Start observing and scrolling
function startFetchingImages() {
  observeImageList();
  autoScroll();  // Start smooth auto-scroll
}

// Handle the Fetch Images button click
async function fetchImagesButtonClick() {
  const loader = document.getElementById('loader');
  
  // Show the loader
  loader.style.display = 'block';

  await startFetchingImages();  // Start fetching and scrolling

   // Hide the loader once the fetching process is done
   setTimeout(() => {
    loader.style.display = 'none';
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
  header.textContent = 'Selected Images';
  header.style.paddingBottom = '10px';
  panel.appendChild(header);

  // Loader element
  const loader = document.createElement('div');
  loader.id = 'loader';
  loader.style.display = 'none';  // Initially hidden
  loader.style.border = '5px solid #f3f3f3';  // Outer circle
  loader.style.borderRadius = '50%';
  loader.style.borderTop = '5px solid #3498db';  // Blue colored rotating part
  loader.style.width = '30px';
  loader.style.height = '30px';
  loader.style.animation = 'spin 1s linear infinite';  // Animation for spinning
  loader.style.margin = '10px auto';  // Center the loader
  panel.appendChild(loader);

  const selectedImageList = document.createElement('div');
  selectedImageList.id = 'selected-images-list';
  selectedImageList.style.display = 'flex';  // Display images in a row
  selectedImageList.style.height = '150px';  // Enable horizontal scrolling
  selectedImageList.style.overflowX = 'auto';  // Enable horizontal scrolling
  selectedImageList.style.whiteSpace = 'nowrap';  // Prevent line breaks
  panel.appendChild(selectedImageList);

  // Add an element to show the image count
  const imageCount = document.createElement('div');
  imageCount.id = 'image-count';
  imageCount.style.marginBottom = '10px';
  panel.appendChild(imageCount);

  // Create a container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '10px';  // Add spacing between the buttons
  buttonContainer.style.marginTop = '10px';
  panel.appendChild(buttonContainer);
  

  // Download Button
  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download Selected Images';
  downloadButton.style.border = '0'; 
  downloadButton.style.borderRadius = '20px'; 
  downloadButton.style.padding = '15px'; 
  downloadButton.style.width = '100%'; 
  downloadButton.onclick = downloadSelectedImages;
  buttonContainer.appendChild(downloadButton);

  // Fetch Images Button
  const fetchImagesButton = document.createElement('button');
  fetchImagesButton.textContent = 'Fetch Images';
  fetchImagesButton.style.border = '0'; 
  fetchImagesButton.style.borderRadius = '20px'; 
  fetchImagesButton.style.padding = '15px'; 
  fetchImagesButton.style.width = '100%'; 
  fetchImagesButton.onclick = fetchImagesButtonClick;
  buttonContainer.appendChild(fetchImagesButton);

  // Clear Images Button
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear Selected Images';
  clearButton.style.border = '0'; 
  clearButton.style.borderRadius = '20px'; 
  clearButton.style.padding = '15px'; 
  clearButton.style.width = '100%'; 
  clearButton.onclick = clearSelectedImages;
  buttonContainer.appendChild(clearButton);


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
