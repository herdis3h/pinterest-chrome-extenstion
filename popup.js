let selectedImages = [];

// When the popup opens, request the list of selected images
chrome.runtime.sendMessage({ action: 'getSelectedImages' }, function(response) {
  if (chrome.runtime.lastError) {
    // If there is an error (e.g., background script not responding), handle it
    console.error('Error:', chrome.runtime.lastError.message);
    document.getElementById('status').textContent = 'Error retrieving selected images.';
    return;
  }

  // Handle the response and update the UI
  if (response && response.selectedImages) {
    selectedImages = response.selectedImages;
    document.getElementById('status').textContent = `Selected ${selectedImages.length} images.`;
  }
});

// Add click event listener for the download button
document.getElementById('downloadButton').addEventListener('click', function() {
  if (selectedImages.length > 0) {
    chrome.runtime.sendMessage({ action: 'downloadImages', images: selectedImages });
    document.getElementById('status').textContent = 'Downloading images...';
  } else {
    document.getElementById('status').textContent = 'No images selected!';
  }
});
