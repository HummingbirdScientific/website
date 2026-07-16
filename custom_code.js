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
