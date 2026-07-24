function addSearchBackdropToBody (){
  // code to move the searchbackdrop to the page body so that fixed positioning works 
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
    const mobileMenuWrapper = document.querySelector("#mobile-nav-menu");
    
    if (resultsWrapper) {
      resultsWrapper.style.display = "none";
    }
    if (mobileMenuWrapper) {
      mobileMenuWrapper.style.display = "none";
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

/**
 * UI Dynamic Placeholder: Injects helper text to reduce crawl pollution
 */
function initSearchTextPlaceholder() {
  const container = document.getElementById('initial-search-result');
  if (container) {
    container.textContent = 'Start typing to see results..';
  }
}

/**
 * Form Submit Interceptor: Handles targeted catalog redirect logic
 */
function initNavSearchFormRedirect() {
  const navSearchForm = document.querySelector('#wf-form-nav-search-products');
  
  // Safeguard: Stop execution if this specific form doesn't exist on the page
  if (!navSearchForm) return;

  navSearchForm.addEventListener('submit', function handleSubmit(e) {
    e.preventDefault();

    const searchInput = document.querySelector('#nav-search-input');
    const selectEl = document.querySelector('#nav-search-select');

    // Structural safeguard to avoid null errors
    if (!searchInput || !selectEl) return;

    const searchQuery = searchInput.value;
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    if (!selectedOption) return;

    // Extract the group identifier
    const groupValue = selectedOption.dataset.group || 'environment+stimulus';

    const searchSelect =
      'products-filter_' +
      groupValue +
      '_equal=' +
      encodeURIComponent(JSON.stringify([selectEl.value]));

    const url =
      '/product-catalog?' + "&" + searchSelect +
      '&products-filter_*_equal=' +
      encodeURIComponent(searchQuery);

    console.log('Redirect URL:', url);

    // Redirect the browser to the generated dynamic filter URL
    window.location.href = url;
  });
}

/**
 * Form Utility: Populates country collection options 
 */
function initCountrySelectionDropdown() {
  const countrySelect = document.getElementById('country-select');
  
  // Performance & Fail-Safe Guard: Stop completely if element isn't on this page
  if (!countrySelect) return;

  const countries = [
    "United States", "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", 
    "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", 
    "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", 
    "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", 
    "Bouvet Island", "Brazil", "British Indian Ocean Territory", "Brunei Darussalam", "Bulgaria", 
    "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", 
    "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands", 
    "Colombia", "Comoros", "Congo", "Congo, The Democratic Republic of the", "Cook Islands", 
    "Costa Rica", "Cote D'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", 
    "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", 
    "Eritrea", "Estonia", "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands", "Fiji", 
    "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", 
    "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", 
    "Guadeloupe", "Guam", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", 
    "Heard Island and Mcdonald Islands", "Holy See (Vatican City State)", "Honduras", "Hong Kong", 
    "Hungary", "Iceland", "India", "Indonesia", "Iran, Islamic Republic of", "Iraq", "Ireland", 
    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
    "Korea, Democratic People's Republic of", "Korea, Republic of", "Kuwait", "Kyrgyzstan", 
    "Lao People's Democratic Republic", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libyan Arab Jamahiriya", 
    "Liechtenstein", "Lithuania", "Luxembourg", "Macao", "Macedonia, The Former Yugoslav Republic of", 
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", 
    "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States of", "Moldova, Republic of", 
    "Monaco", "Mongolia", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", 
    "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", 
    "Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", 
    "Palestinian Territory, Occupied", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", 
    "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russian Federation", 
    "Rwanda", "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia", "Saint Pierre and Miquelon", 
    "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", 
    "Senegal", "Serbia and Montenegro", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", 
    "Solomon Islands", "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "Spain", 
    "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland", 
    "Syrian Arab Republic", "Taiwan, Province of China", "Tajikistan", "Tanzania, United Republic of", 
    "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Barbuda", "Tunisia", "Turkey", 
    "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
    "United Kingdom", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", 
    "Venezuela", "Viet Nam", "Virgin Islands, British", "Virgin Islands, U.S.", "Wallis and Futuna", 
    "Western Sahara", "Yemen", "Zambia", "Zimbabwe"
  ];

  countries.forEach(function(country) {
    const opt = document.createElement('option');
    opt.value = country;
    opt.textContent = country;
    countrySelect.appendChild(opt);
  });
}

/**
 * Layout Optimizer: Prefetches and clones product tabs into the DOM on hover
 */
function initProductTabPrefetchOnHover() {
  const btn = document.querySelector('#navigation-menu');
  
  // Guard clause: Exit if the button isn't present on the current page
  if (!btn) return;

  // Scoped private state variable
  let loaded = false;

  btn.addEventListener('mouseenter', async () => {
    if (loaded) return;
    loaded = true;

    try {
      const response = await fetch('/product-search-helper');
      const htmlText = await response.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      ['tem', 'sem', 'xray'].forEach(type => {
        const targetWrap = document.querySelector(`#nav-${type}-tab-wrap`);
        const sourceContent = doc.querySelector(`#nav-${type}-tab-content`);
        
        if (targetWrap && sourceContent) {
          targetWrap.appendChild(sourceContent.cloneNode(true));
        }
      });
    } catch (err) {
      console.error("Tab Prefetch Error:", err);
      // Reset state if fetch fails so it can retry on next mouseenter
      loaded = false; 
    }
  });
}

/**
 * UI Form Optimizer: Safely populates empty success/error message nodes
 * for an explicit array list of targeted form wrapper IDs without applying inline style resets.
 */
/**
 * UI Form Optimizer: Populates empty success/error blocks adjacent to listed forms
 */
function initDynamicFormSubmissionMessages() {
  const targetFormIDs = [
    '#wf-form-Custom-Solutions', '#wf-form-Quote', '#wf-form-Custom-Chips',
    '#wf-form-Product-Quote', '#wf-form-Service-Request-Form',
    '#wf-form-Training-Form', '#wf-form-Distributor-Application', '#wf-form-Contact-Form', 
    '#wf-form-Submit-Publication-Form','#wf-form-Workshops-Form', '#wf-form-Workshops-Form',
  ];

  targetFormIDs.forEach(selector => {
    const form = document.querySelector(selector);
    if (!form) return;

    // Step up to the parent block to target adjacent sibling message containers
    const parent = form.parentNode;
    const success = parent.querySelector('[aria-label*="success"]') || parent.querySelector('.w-form-done');
    const error = parent.querySelector('[aria-label*="error"]') || parent.querySelector('.w-form-fail');

    if (success && success.textContent.trim() === "") {
      success.innerHTML = `<div>Thank you! Your submission has been received!</div>`;
    }
    if (error && error.textContent.trim() === "") {
      error.innerHTML = `<div>Oops! Something went wrong while submitting the form.</div>`;
    }
  });
}

// Code to select weeks for the training form
function initWeekPicker() {
  const weekPicker = document.getElementById("ignore-date-selection");
  if (!weekPicker || typeof flatpickr === "undefined") return;

  // Store selected weeks
  const selectedWeeks = [];

  // Get today's date and current year
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // Initialize Flatpickr
  flatpickr(weekPicker, {
    dateFormat: "Y-m-d",
    closeOnSelect: false,
    clickOpens: true,
    allowInput: false,

    minDate: today,
    maxDate: `${currentYear}-12-31`,

    disable: [
      date => date.getDay() === 0 || date.getDay() === 6
    ],

    onReady: (_, __, instance) => setup(instance),
    onMonthChange: (_, __, instance) => setup(instance)
  });

  function setup(instance) {
    const container = instance.calendarContainer;
    if (!container) return;

    // Prevent duplicate listeners
    if (container.dataset.bound) return;
    container.dataset.bound = "true";

    // Hover
    container.addEventListener("mouseover", e => {
      const dayEl = e.target.closest(".flatpickr-day");
      if (!dayEl || !dayEl.dateObj) return;

      const range = getWeekRange(dayEl.dateObj);
      if (!range) return;

      clearHover(container);

      const { monday, friday } = range;

      container.querySelectorAll(".flatpickr-day").forEach(el => {
        if (!el.dateObj) return;

        const d = el.dateObj;

        if (d >= monday && d <= friday) {
          el.classList.add("week-hover");
        }

        if (sameDay(d, monday)) el.classList.add("week-hover-start");
        if (sameDay(d, friday)) el.classList.add("week-hover-end");
      });
    });

    container.addEventListener("mouseleave", () => {
      clearHover(container);
    });

    // Click
    container.addEventListener("mousedown", e => {
      const dayEl = e.target.closest(".flatpickr-day");
      if (!dayEl || !dayEl.dateObj) return;

      e.preventDefault();

      const range = getWeekRange(dayEl.dateObj);
      if (!range) return;

      const { monday, friday } = range;
      const value = formatRange(monday, friday);

      if (!selectedWeeks.includes(value)) {
        selectedWeeks.push(value);
        renderWeeks();
      }
    });
  }

  function getWeekRange(date) {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    if (friday < today) return null;

    return { monday, friday };
  }

  function formatRange(monday, friday) {
    const sameMonth = monday.getMonth() === friday.getMonth();

    const start = monday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    const end = friday.toLocaleDateString("en-US", {
      ...(sameMonth ? {} : { month: "short" }),
      day: "numeric"
    });

    return `${start} – ${end}`;
  }

  function sameDay(a, b) {
    return a.toDateString() === b.toDateString();
  }

  function clearHover(container) {
    container.querySelectorAll(".flatpickr-day").forEach(el => {
      el.classList.remove(
        "week-hover",
        "week-hover-start",
        "week-hover-end"
      );
    });
  }

  function renderWeeks() {
    const container = document.getElementById("selected-weeks");
    if (!container) return;

    container.innerHTML = "";

    selectedWeeks.forEach((week, index) => {
      const chip = document.createElement("div");
      chip.className = "week-chip";

      const text = document.createElement("span");
      text.textContent = week;

      const remove = document.createElement("span");
      remove.className = "chip-remove";
      remove.textContent = "×";

      remove.onclick = () => {
        selectedWeeks.splice(index, 1);
        renderWeeks();
      };

      chip.append(text, remove);
      container.appendChild(chip);
    });

    const hidden = document.getElementById("selected-weeks-input");
    if (hidden) {
      hidden.value = selectedWeeks.join(", ");
    }
  }
}


function initSalesPartnersCountrySearch() {

  const searchInput = document.getElementById("country-search");
  const results = document.getElementById("country-results");

  // Exit if this page doesn't contain the Sales Partners search
  if (!searchInput || !results) return;

  const countries = [

/* AMERICAS */
{name:"Antigua and Barbuda",continent:"Americas"},
{name:"Argentina",continent:"Americas"},
{name:"Bahamas",continent:"Americas"},
{name:"Barbados",continent:"Americas"},
{name:"Belize",continent:"Americas"},
{name:"Bolivia",continent:"Americas"},
{name:"Brasil",continent:"Americas"},
{name:"Canada",continent:"Americas"},
{name:"Chile",continent:"Americas"},
{name:"Colombia",continent:"Americas"},
{name:"Costa Rica",continent:"Americas"},
{name:"Cuba",continent:"Americas"},
{name:"Dominica",continent:"Americas"},
{name:"Dominican Republic",continent:"Americas"},
{name:"Ecuador",continent:"Americas"},
{name:"El Salvador",continent:"Americas"},
{name:"Grenada",continent:"Americas"},
{name:"Guatemala",continent:"Americas"},
{name:"Guyana",continent:"Americas"},
{name:"Haiti",continent:"Americas"},
{name:"Honduras",continent:"Americas"},
{name:"Jamaica",continent:"Americas"},
{name:"Mexico",continent:"Americas"},
{name:"Nicaragua",continent:"Americas"},
{name:"Panama",continent:"Americas"},
{name:"Paraguay",continent:"Americas"},
{name:"Peru",continent:"Americas"},
{name:"Saint Kitts and Nevis",continent:"Americas"},
{name:"Saint Lucia",continent:"Americas"},
{name:"Saint Vincent and the Grenadines",continent:"Americas"},
{name:"Suriname",continent:"Americas"},
{name:"Trinidad and Tobago",continent:"Americas"},
{name:"United States",continent:"Americas"},
{name:"USA",continent:"Americas"},
{name:"Uruguay",continent:"Americas"},
{name:"Venezuela",continent:"Americas"},

/* EUROPE */
{name:"Albania",continent:"Europe"},
{name:"Andorra",continent:"Europe"},
{name:"Austria",continent:"Europe"},
{name:"Belarus",continent:"Europe"},
{name:"Belgium",continent:"Europe"},
{name:"Bosnia and Herzegovina",continent:"Europe"},
{name:"Bulgaria",continent:"Europe"},
{name:"Croatia",continent:"Europe"},
{name:"Cyprus",continent:"Europe"},
{name:"Czech Republic",continent:"Europe"},
{name:"Denmark",continent:"Europe"},
{name:"Estonia",continent:"Europe"},
{name:"Finland",continent:"Europe"},
{name:"France",continent:"Europe"},
{name:"Germany",continent:"Europe"},
{name:"Greece",continent:"Europe"},
{name:"Hungary",continent:"Europe"},
{name:"Iceland",continent:"Europe"},
{name:"Ireland",continent:"Europe"},
{name:"Italy",continent:"Europe"},
{name:"Latvia",continent:"Europe"},
{name:"Liechtenstein",continent:"Europe"},
{name:"Lithuania",continent:"Europe"},
{name:"Luxembourg",continent:"Europe"},
{name:"Malta",continent:"Europe"},
{name:"Moldova",continent:"Europe"},
{name:"Monaco",continent:"Europe"},
{name:"Montenegro",continent:"Europe"},
{name:"The Netherlands",continent:"Europe"},
{name:"North Macedonia",continent:"Europe"},
{name:"Norway",continent:"Europe"},
{name:"Poland",continent:"Europe"},
{name:"Portugal",continent:"Europe"},
{name:"Romania",continent:"Europe"},
{name:"San Marino",continent:"Europe"},
{name:"Serbia",continent:"Europe"},
{name:"Slovakia",continent:"Europe"},
{name:"Slovenia",continent:"Europe"},
{name:"Spain",continent:"Europe"},
{name:"Sweden",continent:"Europe"},
{name:"Switzerland",continent:"Europe"},
{name:"Ukraine",continent:"Europe"},
{name:"United Kingdom",continent:"Europe"},
{name:"Vatican City",continent:"Europe"},

/* ASIA */
{name:"China",continent:"Asia"},
{name:"Japan",continent:"Asia"},
{name:"South Korea",continent:"Asia"},



/* SOUTHEAST ASIA/AUSTRALIA */
{name:"Kazakhstan",continent:"Southeast Asia/Australia"},
{name:"Kyrgyzstan",continent:"Southeast Asia/Australia"},
{name:"Mongolia",continent:"Southeast Asia/Australia"},
{name:"North Korea",continent:"Southeast Asia/Australia"},
{name:"Taiwan",continent:"Southeast Asia/Australia"},
{name:"Tajikistan",continent:"Southeast Asia/Australia"},
{name:"Turkmenistan",continent:"Southeast Asia/Australia"},
{name:"Uzbekistan",continent:"Southeast Asia/Australia"},
  
{name:"Afghanistan",continent:"Southeast Asia/Australia"},
{name:"Australia",continent:"Southeast Asia/Australia"},
{name:"Bangladesh",continent:"Southeast Asia/Australia"},
{name:"Bhutan",continent:"Southeast Asia/Australia"},
{name:"Brunei",continent:"Southeast Asia/Australia"},
{name:"Cambodia",continent:"Southeast Asia/Australia"},
{name:"Fiji",continent:"Southeast Asia/Australia"},
{name:"India",continent:"Southeast Asia/Australia"},
{name:"Indonesia",continent:"Southeast Asia/Australia"},
{name:"Kiribati",continent:"Southeast Asia/Australia"},
{name:"Laos",continent:"Southeast Asia/Australia"},
{name:"Malaysia",continent:"Southeast Asia/Australia"},
{name:"Maldives",continent:"Southeast Asia/Australia"},
{name:"Marshall Islands",continent:"Southeast Asia/Australia"},
{name:"Micronesia",continent:"Southeast Asia/Australia"},
{name:"Myanmar",continent:"Southeast Asia/Australia"},
{name:"Nauru",continent:"Southeast Asia/Australia"},
{name:"Nepal",continent:"Southeast Asia/Australia"},
{name:"New Zealand",continent:"Southeast Asia/Australia"},
{name:"Pakistan",continent:"Southeast Asia/Australia"},
{name:"Palau",continent:"Southeast Asia/Australia"},
{name:"Papua New Guinea",continent:"Southeast Asia/Australia"},
{name:"Philippines",continent:"Southeast Asia/Australia"},
{name:"Samoa",continent:"Southeast Asia/Australia"},
{name:"Singapore",continent:"Southeast Asia/Australia"},
{name:"Solomon Islands",continent:"Southeast Asia/Australia"},
{name:"Sri Lanka",continent:"Southeast Asia/Australia"},
{name:"Thailand",continent:"Southeast Asia/Australia"},
{name:"Timor-Leste",continent:"Southeast Asia/Australia"},
{name:"Tonga",continent:"Southeast Asia/Australia"},
{name:"Tuvalu",continent:"Southeast Asia/Australia"},
{name:"Vanuatu",continent:"Southeast Asia/Australia"},
{name:"Vietnam",continent:"Southeast Asia/Australia"},

/* AFRICA/MIDDLE EAST */
{name:"Algeria",continent:"Africa/Middle East"},
{name:"Angola",continent:"Africa/Middle East"},
{name:"Armenia",continent:"Africa/Middle East"},
{name:"Azerbaijan",continent:"Africa/Middle East"},
{name:"Benin",continent:"Africa/Middle East"},
{name:"Botswana",continent:"Africa/Middle East"},
{name:"Burkina Faso",continent:"Africa/Middle East"},
{name:"Burundi",continent:"Africa/Middle East"},
{name:"Cabo Verde",continent:"Africa/Middle East"},
{name:"Cameroon",continent:"Africa/Middle East"},
{name:"Central African Republic",continent:"Africa/Middle East"},
{name:"Chad",continent:"Africa/Middle East"},
{name:"Comoros",continent:"Africa/Middle East"},
{name:"Democratic Republic of the Congo",continent:"Africa/Middle East"},
{name:"Djibouti",continent:"Africa/Middle East"},
{name:"Egypt",continent:"Africa/Middle East"},
{name:"Equatorial Guinea",continent:"Africa/Middle East"},
{name:"Eritrea",continent:"Africa/Middle East"},
{name:"Eswatini",continent:"Africa/Middle East"},
{name:"Ethiopia",continent:"Africa/Middle East"},
{name:"Gabon",continent:"Africa/Middle East"},
{name:"Gambia",continent:"Africa/Middle East"},
{name:"Georgia",continent:"Africa/Middle East"},
{name:"Ghana",continent:"Africa/Middle East"},
{name:"Guinea",continent:"Africa/Middle East"},
{name:"Guinea-Bissau",continent:"Africa/Middle East"},
{name:"Ivory Coast",continent:"Africa/Middle East"},
{name:"Kenya",continent:"Africa/Middle East"},
{name:"Lesotho",continent:"Africa/Middle East"},
{name:"Liberia",continent:"Africa/Middle East"},
{name:"Libya",continent:"Africa/Middle East"},
{name:"Madagascar",continent:"Africa/Middle East"},
{name:"Malawi",continent:"Africa/Middle East"},
{name:"Mali",continent:"Africa/Middle East"},
{name:"Mauritania",continent:"Africa/Middle East"},
{name:"Mauritius",continent:"Africa/Middle East"},
{name:"Morocco",continent:"Africa/Middle East"},
{name:"Mozambique",continent:"Africa/Middle East"},
{name:"Namibia",continent:"Africa/Middle East"},
{name:"Niger",continent:"Africa/Middle East"},
{name:"Nigeria",continent:"Africa/Middle East"},
{name:"Palestine",continent:"Africa/Middle East"},
{name:"Republic of the Congo",continent:"Africa/Middle East"},
{name:"Rwanda",continent:"Africa/Middle East"},
{name:"Sao Tome and Principe",continent:"Africa/Middle East"},
{name:"Senegal",continent:"Africa/Middle East"},
{name:"Seychelles",continent:"Africa/Middle East"},
{name:"Sierra Leone",continent:"Africa/Middle East"},
{name:"Somalia",continent:"Africa/Middle East"},
{name:"South Africa",continent:"Africa/Middle East"},
{name:"South Sudan",continent:"Africa/Middle East"},
{name:"Sudan",continent:"Africa/Middle East"},
{name:"Tanzania",continent:"Africa/Middle East"},
{name:"Togo",continent:"Africa/Middle East"},
{name:"Tunisia",continent:"Africa/Middle East"},
{name:"Turkey",continent:"Africa/Middle East"},
{name:"Uganda",continent:"Africa/Middle East"},
{name:"Zambia",continent:"Africa/Middle East"},
{name:"Zimbabwe",continent:"Africa/Middle East"},
{name:"Bahrain",continent:"Africa/Middle East"},
{name:"Iran",continent:"Africa/Middle East"},
{name:"Iraq",continent:"Africa/Middle East"},
{name:"Israel",continent:"Africa/Middle East"},
{name:"Jordan",continent:"Africa/Middle East"},
{name:"Kuwait",continent:"Africa/Middle East"},
{name:"Lebanon",continent:"Africa/Middle East"},
{name:"Oman",continent:"Africa/Middle East"},
{name:"Palestine",continent:"Africa/Middle East"},
{name:"Qatar",continent:"Africa/Middle East"},
{name:"Saudi Arabia",continent:"Africa/Middle East"},
{name:"Syria",continent:"Africa/Middle East"},
{name:"Turkey",continent:"Africa/Middle East"},
{name:"United Arab Emirates",continent:"Africa/Middle East"},
{name:"Yemen",continent:"Africa/Middle East"},


  ];

  const countriesWithHQ = {
    "Americas": ["USA"],
    "Europe": ["Netherlands"],
    "Asia": ["JAPAN"],
    "Southeast Asia/Australia": ["INDIA"],
    "Africa/Middle East": ["INDIA"]
  };

  const continentSections = document.querySelectorAll(
    "#sales-partners-table .sales_partners_table_content[data-continent]"
  );

  const dividers = document.querySelectorAll(
    "#sales-partners-table .sales_partners_table_content.continent[data-continent]"
  );

  const cmsWraps = document.querySelectorAll(
    "#sales-partners-table .sales-partners-cms-wrap[data-continent]"
  );

  const defaultShowAll = document.getElementById("default-show-all");

  function filterContinent(selectedContinent) {

    continentSections.forEach(section => {
      section.style.display =
        section.dataset.continent === selectedContinent ? "" : "none";
    });

    dividers.forEach(divider => {
      divider.style.display =
        divider.dataset.continent === selectedContinent ? "" : "none";
    });

    cmsWraps.forEach(cms => {

      const show = cms.dataset.continent === selectedContinent;

      cms.style.display = show ? "" : "none";

      const dealer = cms.querySelector(".default-dealer");

      if (dealer) {
        dealer.style.display = show ? "grid" : "none";
      }

    });

    if (defaultShowAll) {
      defaultShowAll.style.display =
        selectedContinent === "Americas" ? "none" : "";
    }
  }

  function resetContinents() {

    continentSections.forEach(section => {
      section.style.display = "";
    });

    dividers.forEach(divider => {
      divider.style.display = "";
    });

    cmsWraps.forEach(cms => {

      cms.style.display = "";

      const dealer = cms.querySelector(".default-dealer");

      if (dealer) {
        dealer.style.display = "none";
      }

    });

  }

  searchInput.addEventListener("input", () => {

    const value = searchInput.value.trim().toLowerCase();

    results.innerHTML = "";

    if (!value) {

      results.style.display = "none";

      resetContinents();

      if (searchInput.form) {
        searchInput.form.requestSubmit();
      }

      return;
    }

    const matches = countries.filter(country =>
      country.name.toLowerCase().includes(value)
    );

    matches.forEach(country => {

      const item = document.createElement("div");

      item.className = "country-option";
      item.textContent = country.name;

      item.addEventListener("click", () => {

        searchInput.value = country.name;

        results.style.display = "none";

        filterContinent(country.continent);

        const cms = [...cmsWraps].find(
          wrap => wrap.dataset.continent === country.continent
        );

        if (cms) {

          const defaultDealer = cms.querySelector(".default-dealer");

          if (defaultDealer) {

            const hqCountries = countriesWithHQ[country.continent] || [];

            const hasHQ = hqCountries.some(
              hq => hq.toLowerCase() === country.name.toLowerCase()
            );

            defaultDealer.style.display = hasHQ ? "none" : "grid";
          }

        }

        if (searchInput.form) {
          searchInput.form.requestSubmit();
        }

      });

      results.appendChild(item);

    });

    results.style.display = matches.length ? "block" : "none";

  });

}
