function addSearchBackdropToBody (){
  // code to move the searchbackdrop to the page bosy so that fixed positioning works 
  const backdrop = document.querySelector("#search-backdrop");

  if (!backdrop) return;

  // Prevent duplicate copies
  if (document.querySelector("#search-backdrop-fixed")) return;

  const backdropCopy = backdrop.cloneNode(true);

  backdropCopy.id = "search-backdrop-fixed";
  backdropCopy.style.zIndex = "889";

  document.body.appendChild(backdropCopy);

  backdropCopy.addEventListener("click", () => {
    backdropCopy.style.display = "none";
    backdrop.style.display = "none";

    const resultsWrapper = document.querySelector("#results-wrapper");

    if (resultsWrapper) {
      resultsWrapper.style.display = "none";
    }
  });
}

function initMegaMenuNavigation() {
// Select all elements using the attributes, completely ignoring classes
const triggers = document.querySelectorAll('[data-menu]');
const dropdowns = document.querySelectorAll('[data-dropdown]');

// Inject initial animation states and rapid 0.15s transitions
dropdowns.forEach(dropdown => {
  dropdown.style.display = 'none';
  dropdown.style.opacity = '0';
  dropdown.style.transform = 'translateY(-15px)'; // Shifted up 15px natively
  dropdown.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
  dropdown.style.position = 'absolute'; 
  dropdown.style.zIndex = '1';
  dropdown.addEventListener('click', (e) => e.stopPropagation());

});

triggers.forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();

    // Find the specific identifier (e.g., "products")
    const menuValue = trigger.getAttribute('data-menu');
    const targetDropdown = document.querySelector(`[data-dropdown="${menuValue}"]`);

    // Check if the clicked dropdown is already visible
    const isOpen = targetDropdown && targetDropdown.style.display === 'flex' && targetDropdown.style.opacity === '1';

    // 1. Close ALL dropdowns to reset the UI state
    dropdowns.forEach(dropdown => {
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(-15px)';
      dropdown.style.display = 'none';
    });

    // 2. Open the clicked dropdown only if it wasn't already open
    if (targetDropdown && !isOpen) {
      targetDropdown.style.display = 'flex'; 
      
      // A brief frame delay allows the browser to process display: flex before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targetDropdown.style.opacity = '1';
          targetDropdown.style.transform = 'translateY(0)'; // Slides smoothly to position
        });
      });
    }
  });
});

// 3. Close active dropdowns if the user clicks anywhere else
window.addEventListener('click', () => {
  dropdowns.forEach(dropdown => {
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-15px)';
    // Hide from layout after the 150ms animation finishes
    setTimeout(() => {
      if (dropdown.style.opacity === '0') {
        dropdown.style.display = 'none';
      }
    }, 150);
  });
});
}

/**
 * Navigation Search Engine Wrapper
 * Fetches CMS search content dynamically on focus and syncs with Finsweet Attributes.
 */
function navSearchNavigationAnimation() {
  // Scoped global state to track if the fetch has already occurred
  let isProductsFetched = false;

  console.log("Nav Search Debug: Embed listening for user focus.");

  const searchInput = document.getElementById('nav-search-input'); 
  const resultsContainer = document.getElementById('product-results-wrap');

  if (!searchInput) console.error("Nav Search Error: Missing element '#nav-search-input'");
  if (!resultsContainer) console.error("Nav Search Error: Missing element '#product-results-wrap'");

  // Core execution engine
  if (searchInput && resultsContainer) {
    searchInput.addEventListener('focus', () => {
      if (isProductsFetched) return;

      console.log("Nav Search Debug: Fetching content from '/product-search-helper'...");
      
      const loader = document.createElement('div');
      loader.id = 'nav-search-temporary-loader';
      loader.innerText = 'Loading products...';
      resultsContainer.appendChild(loader);

      fetch('/product-search-helper')
        .then(response => response.text())
        .then(htmlString => {
          console.log("Nav Search Debug: HTML components downloaded successfully.");
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');
          const sourceContent = doc.getElementById('search-products-content');

          const targetLoader = document.getElementById('nav-search-temporary-loader');
          if (targetLoader) targetLoader.remove();
          
          if (sourceContent) {
            isProductsFetched = true;
          
            console.log("Nav Search Debug: Moving #search-products-content");
          
            resultsContainer.style.visibility = "hidden";
          
            // Move the entire wrapper div, not just its children
            resultsContainer.appendChild(sourceContent);
          
            console.log("Nav Search Debug: Layout successfully moved into #product-results-wrap!");
          
            // Re-sync with Finsweet's active indexing global registry
            forceGlobalFinsweetSync(searchInput);
          
          } else {
            console.warn("Nav Search Warning: #search-products-content not found.");
          }
        })
        .catch(err => {
          console.error('Fetch Error:', err);
          const targetLoader = document.getElementById('nav-search-temporary-loader');
          if (targetLoader) targetLoader.remove();
        });
    }, { once: true });
  }
}

/**
 * Commands Finsweet Components to map out the newly inserted DOM nodes.
 */
async function forceGlobalFinsweetSync(inputElement) {
  try {
    console.log("Nav Search Debug: Re-indexing Finsweet elements...");

    // V2 restart
    await window.FinsweetAttributes.modules.list.restart();
    const resultsContainer = document.getElementById('product-results-wrap');
    resultsContainer.style.visibility = "visible";

    setTimeout(() => {
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("SUCCESS: Global Finsweet components match your embedded markup layout!");
    }, 150);

  } catch (err) {
    console.warn("Standard fallback loop executed for sync event.", err);
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}




