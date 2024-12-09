 
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
console.log("JSZip is available:", typeof JSZip !== 'undefined' ? "Yes" : "No");

(function() {

  window.selectedImages = new Set();
  window.observedItems = new Set();
  window.selectExportImages = new Set(); 
 
  function reinitializeScript() {
    console.log("Reinitializing script...");

      // Clear observedItems set
  window.observedItems.clear();
  
    // Re-inject the panel if it doesn't exist
    const existingPanel = document.getElementById("image-selection-panel");
    if (existingPanel) {
      existingPanel.style.display = "block";
      console.log("Restored visibility of image selection panel.");
    } else {
      injectPanel();
    }
  
    // Restore selected images to the panel
    if (window.selectedImages.size > 0) {
      restoreImagesToPanel();
    }
  
    // Restart all observers
    restartObservers();
  
    console.log("Script reinitialization complete.");
  }
  
  function cleanUp() {
    console.log("Cleaning up script...");
  
    const existingPanel = document.getElementById("image-selection-panel");
    if (existingPanel) {
      existingPanel.style.display = "none";
      existingPanel.remove();
      console.log("Removed image selection panel.");
    }
  
    if (window.scrollInterval) {
      clearInterval(window.scrollInterval);
      window.scrollInterval = null;
      console.log("Cleared scroll interval.");
    }
  
    if (window.imageObserver) {
      window.imageObserver.disconnect();
      window.imageObserver = null;
      console.log("Disconnected image observer.");
    }
  
    if (window.mainContainerObserver) {
      window.mainContainerObserver.disconnect();
      window.mainContainerObserver = null;
      console.log("Disconnected main container observer.");
    }
  
    if (window.mainContainerObserver2) {
      window.mainContainerObserver2.disconnect();
      window.mainContainerObserver2 = null;
      console.log("Disconnected additional container observer.");
    }
  
    window.selectedImages.clear();
    window.selectExportImages.clear();
  
    document.body.style.overflow = "auto";
    console.log("Cleanup complete. Script functions and observers disabled.");
  }
  
  
  

 
 chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.action === "RemoveScript") {
    console.log("RemoveScript message received. Cleaning up UI and observers...");
    cleanUp();
    sendResponse({ status: "Script cleaned up, UI hidden" });
  }

  if (message.action === "AddScript") {
    console.log("AddScript message received. Reinitializing UI...");
    reinitializeScript()

    sendResponse({ status: "Script reinitialized" });
  }

  if (message.action === "pageUpdated") {
    console.log("pageUpdated UI...");
    toggleUI()
 

    sendResponse({ status: "Script pageUpdated" });
  }
});

function reinitializeScript() {
  console.log("Reinitializing script...");

  // Re-inject the panel if it doesn't exist
  const existingPanel = document.getElementById("image-selection-panel");
  if (existingPanel) {
    existingPanel.style.display = "block";
    console.log("Restored visibility of image selection panel.");
  } else {
    injectPanel();
  }

  // Restore selected images set
  if (!window.selectedImages) {
    window.selectedImages = new Set();
    console.log("Reinitialized selected images set.");
  }

  // Restart IntersectionObserver
  if (!window.imageObserver) {
    observeListItems();
    console.log("Reinitialized image observer.");
  }

  // Restart MutationObservers
  observeMainContainer();

  console.log("Script reinitialization complete.");
}



    function observeListItems() {
      const listDiv = document.querySelector('div[role="list"]');

      if (!listDiv) {
        console.warn("No div with role='list' found.");
        return;
      }

        // Disconnect any existing observer before creating a new one
        if (window.imageObserver) {
          window.imageObserver.disconnect();
          console.log("Disconnected existing IntersectionObserver.");
        }
        
        window.observedItems.clear()
      console.log("Setting up IntersectionObserver for list items...",  window.imageObserver );

      // IntersectionObserver for visibility tracking of list items
      window.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const listItem = entry.target;
            console.log("listItem", listItem, window.observedItems)
            if (listItem.getAttribute("role") === "listitem" && !window.observedItems.has(listItem)) {
              console.log("List item became visible:", listItem);
              window.observedItems.add(listItem); // Mark as observed
              fetchImagesFromListItem(listItem); // Process images in the visible list item
            }
          }
        });
      },  { root: listDiv, threshold: 0.1 }
    );

      // Observe all existing children with role="listitem"
      listDiv.querySelectorAll('[role="listitem"]').forEach((listItem) => {
        window.imageObserver.observe(listItem);
      });
      console.log("Setting up IntersectionObserver for list items...",  window.imageObserver );
      // Set up a MutationObserver to detect new children added dynamically
      window.mainContainerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              node.getAttribute("role") === "listitem"
            ) {
              console.log("New list item detected:", node);
              window.imageObserver.observe(node); // Observe the new list item
            }
          });
        });
      });

      // Observe the parent list for changes in its child nodes
      mainContainerObserver.observe(listDiv, {
        childList: true,
        subtree: true,
      });

      console.log("Observers are now active for list items.");
    }


    function updateImageCount() {
      const imageCount = document.getElementById("image-count");
      imageCount.textContent = `Selected Images Count: ${window.selectedImages.size}`;
    }

    function fetchImagesFromListItem(listItem) {
      console.log("fetchImagesFromListItemfetchImagesFromListItem", listItem)
      const images = listItem.querySelectorAll("img");
      const imageList = document.getElementById("selected-images-list");
    
      images.forEach((img) => {
        let imageUrl = img.src;
    
        // Use srcset to retrieve the highest quality image (4x if available)
        if (img.srcset) {
          const srcset = img.srcset.split(",");
          const highQualitySrc = srcset
            .map((src) => src.trim())
            .reverse() // Start from the highest quality
            .find((src) => src.includes("4x")) || srcset[srcset.length - 1];
          
          if (highQualitySrc) {
            imageUrl = highQualitySrc.split(" ")[0]; // Extract the URL part
          }
        }
    
        if (!window.selectedImages.has(imageUrl)) {
          console.log("High-quality image found:", imageUrl);
          window.selectedImages.add(imageUrl); // Add to selected images
    
          // Create and append the image element to the image list in the panel
          const imgElement = document.createElement("img");
          imgElement.src = imageUrl;
          imgElement.style.width = "100px";
          imgElement.style.height = "150px";
          imgElement.style.marginRight = "10px";
          imgElement.style.borderRadius = "8px";
          imgElement.style.objectFit = "cover";
    
          imageList.appendChild(imgElement);
          updateImageCount(); // Update the image count in the panel
        }
      });
    }

    // Start observing
    observeListItems();

 
    function autoScroll() {
      if (window.scrollInterval) return; // Prevent multiple intervals
    
      document.body.style.overflow = "hidden"; // Temporarily disable manual scrolling
      window.scrollInterval = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollPosition = window.scrollY + clientHeight;
    
        if (scrollPosition < scrollHeight - 1) {
          // Scroll down by 1000 pixels
          window.scrollBy({ top: 1000, behavior: "smooth" });
        } else {
          // Stop auto-scroll when at the bottom
          stopAutoScrollAndObserver();
        }
      }, 1500); // Scroll every 1.5 seconds
    }
    
    function stopAutoScrollAndObserver() {
      if (window.scrollInterval) {
        clearInterval(window.scrollInterval);
        window.scrollInterval = null;
      }
      if (window.imageObserver) {
        window.imageObserver.disconnect();
        window.imageObserver = null;
        console.log("Stopped auto-scroll and observer.");
      }
      document.body.style.overflow = "auto"; // Re-enable manual scrolling
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
  // observeImageList();
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

  const panel = document.createElement('div');
  panel.id = 'image-selection-panel';
  panel.style.position = 'fixed';
  panel.style.top = '50px';
  panel.style.right = '0';
  panel.style.width = '650px';
  panel.style.background = 'white';
  panel.style.border = 'none';
  panel.style.borderRadius = '20px';
  panel.style.padding = '15px';
  panel.style.zIndex = '10000';

  // Create content container inside the panel
  const panelContent = document.createElement('div');
  panelContent.id = 'panel-content';
  panelContent.style.display = 'flex';
  panelContent.style.flexDirection = 'column';
  panelContent.style.gap = '10px';

  const header = document.createElement('h3');
  header.textContent = 'PinSaver';
  header.style.paddingBottom = '5px';
  panelContent.appendChild(header);

  // Description text under header
  const description = document.createElement('span');
  description.textContent = 'Select, export all images from your Pinterest moodboard.';
  description.style.fontSize = '12px';
  description.style.color = '#8d8d8d';
  description.style.display = 'block';
  description.style.marginBottom = '10px';
  panelContent.appendChild(description);

  const selectedImageList = document.createElement('div');
  selectedImageList.id = 'selected-images-list';
  selectedImageList.style.display = 'grid';  // Display images in a row
  selectedImageList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
  selectedImageList.style.flexDirection = 'row';
  selectedImageList.style.flexWrap = 'wrap';
  selectedImageList.style.gap = '1rem';
  selectedImageList.style.width = '100%';
  selectedImageList.style.whiteSpace = 'nowrap';  // Prevent line breaks
  selectedImageList.style.position = 'relative';  // Display images in a row
  selectedImageList.style.height = '300px';  // Enable horizontal scrolling
  selectedImageList.style.overflowX = 'hidden';  // Enable horizontal scrolling
  selectedImageList.style.overflowY = 'auto';  // Enable horizontal scrolling
  selectedImageList.style.border = '1px solid #dbdbdb';  // Prevent line breaks
  selectedImageList.style.borderRadius = '8px';  // Prevent line breaks
  selectedImageList.style.padding = '1rem';  // Prevent line breaks
  selectedImageList.style.background = '#f5f5f5';  // Prevent line breaks
  selectedImageList.style.marginBottom = '10px';  // Prevent line breaks

  panelContent.appendChild(selectedImageList);

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
  panelContent.appendChild(imageCount);

  // Create a container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '10px';  // Add spacing between the buttons
  buttonContainer.style.marginTop = '10px';
  panelContent.appendChild(buttonContainer);
  

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
  // actionButtonsContainer.appendChild(clearButton);

  // Download Button with Icon
  const downloadButton = document.createElement('button');
  downloadButton.style.border = '0'; 
  downloadButton.style.borderRadius = '20px'; 
  downloadButton.style.padding = '10px 15px'; 
  downloadButton.style.width = 'fit-content'; 
  downloadButton.onclick = downloadSelectedImages;

  const exportIcon = document.createElement('span');
  exportIcon.innerHTML = `<svg style="height: 16px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`;

  // Add Select All and Deselect All Buttons
  const selectAllButton = document.createElement('button');
  selectAllButton.textContent = 'Select All';
  selectAllButton.style.border = '0';
  selectAllButton.style.borderRadius = '20px';
  selectAllButton.style.padding = '10px 15px';
  selectAllButton.style.width = '100%';
  selectAllButton.style.backgroundColor = '#3498db';
  selectAllButton.style.color = 'white';
  selectAllButton.onclick = () => {
    console.log("Selecting all images...");
 
    const imgElements = document.querySelectorAll(`#selected-images-list img`);
    console.log("imgElements", imgElements)
    if (imgElements) {
      imgElements.forEach((imgElement) => {
        const imageUrl = imgElement.src;
        if (!window.selectExportImages.has(imageUrl)) {
          // Add to the export set and mark as selected
          window.selectExportImages.add(imageUrl);
          imgElement.classList.add("active");
        }
      });
    }
    console.log("All selected images added to export.", imgElements);

  };
  

  const deselectAllButton = document.createElement('button');
  deselectAllButton.textContent = 'Deselect All';
  deselectAllButton.style.border = '0';
  deselectAllButton.style.borderRadius = '20px';
  deselectAllButton.style.padding = '10px 15px';
  deselectAllButton.style.width = '100%';
  deselectAllButton.style.backgroundColor = '#e74c3c';
  deselectAllButton.style.color = 'white';
  deselectAllButton.onclick = () => {
    const images = document.querySelectorAll('#selected-images-list img');
 
    if(images.length > 0) {

      images.forEach(img => {
        img.classList.remove("active")
      });
      window.selectExportImages.clear();
    }
    // updateImageCount();
  };

  buttonContainer.appendChild(selectAllButton);
  buttonContainer.appendChild(deselectAllButton);
  
  panel.appendChild(panelContent);
  // Error message
  const errorMessage = document.createElement('div');
  errorMessage.id = 'error-message';
  errorMessage.textContent = 'Sorry, you need to be within a board.';
  errorMessage.style.top = '20px';
  errorMessage.style.right = '20px';
  errorMessage.style.padding = '10px';
  errorMessage.style.backgroundColor = 'red';
  errorMessage.style.color = 'white';
  errorMessage.style.zIndex = '10000';
  errorMessage.style.borderRadius = '5px';
  panel.appendChild(errorMessage);
  
  // Append the icon and text to the download button
  downloadButton.appendChild(exportIcon);
  actionButtonsContainer.appendChild(downloadButton);
  
  // Append the nested div to the main button container
  buttonContainer.appendChild(actionButtonsContainer);
  
  document.body.appendChild(panel);

  observeMainContainer();
  toggleUI();
}

function toggleUI() {
  // profile-pins-grid
  const profilePinsGrid = document.querySelector('[data-test-id="board-feed"], [data-test-id="profile-pins-grid"]');
  const panelContent = document.getElementById("panel-content")
  console.log("panelContent", panelContent)
  const errorMessage = document.getElementById("error-message")
  console.log("errorMessage", errorMessage)
  console.log("profilePinsGrid", profilePinsGrid)
  if (profilePinsGrid) {
    panelContent.style.display = 'block'; // Show the panel
    errorMessage.style.display = 'none'; // Hide the error message
  } else {
    panelContent.style.display = 'none'; // Hide the panel
    errorMessage.style.display = 'block'; // Show the error message
  }
}

function restartObservers() {
  console.log("Restarting observers...");
  observeListItems(); // Reactivate IntersectionObserver
  observeMainContainer(); // Reactivate MutationObserver for main container
  console.log("Observers restarted.");
}


function observeMainContainer() {
  const mainContainer = document.querySelector('.mainContainer');

  if (!mainContainer) {
    console.warn("Main container not found. Retrying...");
    setTimeout(observeMainContainer, 1000);
    return;
  }

  window.mainContainerObserver2 = new MutationObserver(() => {
    toggleUI();
  });

  window.mainContainerObserver2.observe(mainContainer, {
    childList: true,
    subtree: true,
  });

  console.log("Started observing mainContainer for changes.");
}

document.addEventListener('DOMContentLoaded', () => {
  injectPanel();
});

// Add a keyframe animation for the loader's spin effect
const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
 .active {
    outline: 2px solid red; /* Define the active outline */
  }  
`;
document.getElementsByTagName('head')[0].appendChild(style);

 

// Update the panel with the currently selected images
function updatePanel() {
  const imageList = document.getElementById('selected-images-list');
  const imageCount = document.getElementById('image-count');
  // imageList.innerHTML = '';
  
  window.selectedImages.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100px';
    img.style.height = '150px';
    img.style.marginRight = '10px';
    img.classList.add("pin-image");
    img.setAttribute("class", "pin-image");
    imageList.appendChild(img);
  });

  // Update the count of selected images
  imageCount.textContent = `Selected Images Count: ${window.selectedImages.length}`;
}

function downloadSelectedImages() {
  const zip = new JSZip();
  const folder = zip.folder("selected_images");
  const imagePromises = [];

  if (window.selectExportImages.size === 0) {
    console.log("No images selected for export.");
    alert("Please select images to export before downloading.");
    return;
  }

  // Loop through the selected images in selectExportImages and add them to the zip
  window.selectExportImages.forEach((imageUrl) => {
    const fileName = imageUrl.split("/").pop().split("?")[0]; // Extract the filename
    const pngFileName = fileName.replace(/\.[a-zA-Z]+$/, "") + ".png"; // Ensure .png extension

    imagePromises.push(
      fetch(imageUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${imageUrl}`);
          }
          return response.blob();
        })
        .then((blob) => {
          folder.file(pngFileName, blob); // Save the image as .png in the zip folder
        })
        .catch((error) => {
          console.error("Error fetching image:", error);
        })
    );
  });

  // Once all images are fetched, generate the zip and trigger download
  Promise.all(imagePromises)
    .then(() => {
      zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, "selected_images.zip");
        console.log("Download complete.");
      });
    })
    .catch((error) => {
      console.error("Error creating zip file:", error);
    });
}



document.addEventListener('click', function(event) {

  if (event.target.tagName.toLowerCase() === 'img') {
    const img = event.target.closest('img');
    const imageUrl = img.src;

    // Toggle selection in selectExportImages
    if (img.classList.contains("active")) {
      // Deselect for export
      // img.style.border = ''; // Remove the red border
      img.classList.remove("active")
      window.selectExportImages.delete(imageUrl);
      console.log(`Removed from export: ${imageUrl}`);
    } else {
      // Select for export
      img.classList.add("active")
      // img.style.outline = '2px solid red'; // Add a red border
      window.selectExportImages.add(imageUrl);
      console.log(`Added to export: ${imageUrl}`);
    }

  }
});


injectPanel();
 
})();