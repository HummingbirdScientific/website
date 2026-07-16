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


/**
 * Programmable Google CSE Search Controller
 */
function initProgrammableSearchEngine() {
  const searchInput = document.getElementById("nav-search-input");
  const resultsWrapper = document.querySelector(".gcse-searchresults-only");
  let searchTimer;

  if (searchInput) {
    // Hide results initially
    if (resultsWrapper) {
      resultsWrapper.style.display = "none";
    }

    searchInput.addEventListener("input", function(e) {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        const query = e.target.value.trim();

        if (window.google && window.google.search && window.google.search.cse) {
          const googleElement = google.search.cse.element.getElement("live-engine");
          if (!googleElement) return;

          // Empty search
          if (query === "") {
            if (resultsWrapper) {
              resultsWrapper.style.display = "none";
            }
            history.replaceState({}, "", window.location.pathname + window.location.search);
            try {
              googleElement.clearAllResults();
            } catch (err) {
              console.warn("Google clearAllResults failed:", err);
            }
            return;
          }

          // Non-empty search
          if (resultsWrapper) {
            resultsWrapper.style.display = "block";
          }
          googleElement.execute(query);
        }
      }, 150); // debounce delay
    });
  }

  // Inject Custom Stylesheets Dynamically to Prevent Layout Flashing
  injectProgrammableSearchStyles();
  initBorderRadiusModifiers();
}

/**
 * Injects the CSE Skin Custom Stylesheets dynamically onto the page DOM
 */
function injectProgrammableSearchStyles() {
  if (document.getElementById("cse-custom-injected-styles")) return;

  const styleSheet = document.createElement("style");
  styleSheet.id = "cse-custom-injected-styles";
  styleSheet.textContent = `
    .select-3:focus {
      border-bottom-left-radius: 0px !important;
      border-bottom-right-radius: 0px !important;
    }
    .gsc-control-cse, .gsc-results-wrapper-nooverlay, .gsc-wrapper, .gsc-resultsbox-visible, .gsc-results {
      width: 100% !important; max-width: 100% !important; box-sizing: border-box !important;
      padding: 0px !important; margin: 0px !important; background-color: transparent !important; border: none !important;
    }
    .gsc-webResult-string, .gsc-inline-block-text, .gsc-footer-pageable, .gs-spelling, .gcse-searchresults-only + div {
      display: none !important;
    }
    .gsc-cursor-box, .gsc-cursor, .gsc-cursor-page, .gsc-orderby-container, .order-by, .gsc-orderby-label,
    .gs-bkmk, .gs-snippet, .gsc-url-top, .gsc-table-result, .gs-fileFormatType, .gsc-result-info, .gcsc-branding, .gsc-adBlock {
      display: none !important;
    }
    .gsc-webResult.gsc-result {
      width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; border: none !important;
      background-color: transparent !important; margin: 4px 0px !important; padding: 10px 12px !important;
      border-radius: 6px !important; transition: background-color 0.2s ease !important; overflow: hidden !important;
    }
    .gsc-webResult.gsc-result:hover {
      background-color: #c21827b0 !important; 
    }
    .gsc-thumbnail-inside a.gs-title, .gsc-url-top a.gs-title, .gsc-thumbnail-inside a.gs-title b, .gsc-url-top a.gs-title b {
      color: hsla(0, 0.00%, 19.78%, 0.80) !important; font-size: 15px !important; font-weight: 500 !important;
      text-decoration: none !important; line-height: 1.4 !important; display: inline-block !important;
      white-space: normal !important; word-break: break-word !important;
    }
    .gsc-webResult.gsc-result:hover a.gs-title, .gsc-webResult.gsc-result:hover a.gs-title b {
      text-decoration: none !important;
    }
  `;
  document.head.appendChild(styleSheet);
}

/**
 * UI Modifier: Updates field border-radius properties on navigation action focus state
 */
function initBorderRadiusModifiers() {
  const textField = document.querySelector(".text-field-3"); 
  const selectDropdown = document.querySelector(".select-3");
  const searchButton = document.querySelector("#main-menu-search-btn");
  
  if (textField && selectDropdown && searchButton) {
    const originalRadius = window.getComputedStyle(searchButton).borderBottomRightRadius;		

    textField.addEventListener("focus", function() {
      searchButton.style.borderBottomRightRadius = "0px";
      selectDropdown.style.borderBottomLeftRadius = "0px";
    });

    textField.addEventListener("blur", function() {
      searchButton.style.borderBottomRightRadius = originalRadius;
      selectDropdown.style.borderBottomLeftRadius = originalRadius;
    });
  }
}




