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
console.log("(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight", (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight)
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
    console.log('No div with role="list" found.');
    return;
  }

  observer = new MutationObserver((mutations) => {
    let newImagesLoaded = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        fetchImages();  // Fetch new images when new nodes are added
        newImagesLoaded = true;
      }
    });
console.log("(window.innerHeight + window.scrollY) >= document.body.offsetHeight", (window.innerHeight + window.scrollY) >= document.body.offsetHeight)
    // Check if scrolled to the bottom
    // if (!newImagesLoaded && (window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    //   stopAutoScrollAndObserver(); // Stop auto-scroll and observer if no more images are loaded
    // }
  });

  observer.observe(listDiv, { childList: true, subtree: true });
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
  const listDiv = document.querySelector('div[role="list"]');
  if (listDiv) {
    const images = listDiv.querySelectorAll('img');
    images.forEach(img => {
      let imgSrc = img.getAttribute('src');
      
      // If srcset exists, pick the highest quality image (4x)
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',').map(url => url.trim());
        const highestQualityUrl = srcsetUrls[srcsetUrls.length - 1].split(' ')[0]; // Select the last (4x) image
        imgSrc = highestQualityUrl;
      }

      if (imgSrc && !selectedImages.includes(imgSrc)) {
        selectedImages.push(imgSrc);
      }
    });
    updatePanel();
  }
}



// Start observing and scrolling
function startFetchingImages() {
  observeImageList();
  autoScroll();  // Start smooth auto-scroll
}

// Handle the Fetch Images button click
function fetchImagesButtonClick() {
  startFetchingImages();  // Start fetching and scrolling
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
  panel.style.border = '1px solid #ccc';
  panel.style.padding = '10px';
  panel.style.zIndex = '10000';

  const header = document.createElement('h3');
  header.textContent = 'Selected Images';
  panel.appendChild(header);

  const selectedImageList = document.createElement('div');
  selectedImageList.id = 'selected-images-list';
  selectedImageList.style.display = 'flex';  // Display images in a row
  selectedImageList.style.overflowX = 'auto';  // Enable horizontal scrolling
  selectedImageList.style.maxWidth = '230px';  // Set max width to allow scrolling
  selectedImageList.style.whiteSpace = 'nowrap';  // Prevent line breaks
  panel.appendChild(selectedImageList);

    // Add an element to show the image count
    const imageCount = document.createElement('div');
    imageCount.id = 'image-count';
    imageCount.style.marginBottom = '10px';
    panel.appendChild(imageCount);

  // Download Button
  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download Selected Images';
  downloadButton.onclick = downloadSelectedImages;
  panel.appendChild(downloadButton);

  // Fetch Images Button
  const fetchImagesButton = document.createElement('button');
  fetchImagesButton.textContent = 'Fetch Images';
  fetchImagesButton.onclick = fetchImagesButtonClick;
  panel.appendChild(fetchImagesButton);

  document.body.appendChild(panel);
}

 

// Update the panel with the currently selected images
function updatePanel() {
  const imageList = document.getElementById('selected-images-list');
  const imageCount = document.getElementById('image-count');
  imageList.innerHTML = '';
  
  selectedImages.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100px';
    img.style.height = '200px';
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

    // Store selected images
    // chrome.storage.local.set({ selectedImages });
  }
});

// Load and display existing selected images when the page loads
// chrome.storage.local.get('selectedImages', function(data) {
//   if (data.selectedImages) {
//     selectedImages = data.selectedImages;
//     selectedImages.forEach((src) => {
//       const img = document.querySelector(`img[src="${src}"]`);
//       if (img) img.style.border = '5px solid red';
//     });

//     // Inject the panel and update with selected images
//     injectPanel();
//     updatePanel();
//   } else {
//   }
// });
injectPanel();
