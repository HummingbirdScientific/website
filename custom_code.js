function addSearchBackdropToBody (){
  // code to move the searchbackdrop to the page bosy so that fixed positioning works 
  window.addEventListener("load", () => {
    const backdrop = document.querySelector("#search-backdrop");
  
    if (backdrop) {
      const backdropCopy = backdrop.cloneNode(true);
  
      backdropCopy.id = "search-backdrop-fixed";
      backdropCopy.style.zIndex = "889";
  
      document.body.appendChild(backdropCopy);
  
      backdropCopy.addEventListener("click", () => {
        backdropCopy.style.display = "none";
        backdrop.style.display = "none"
  
        const resultsWrapper = document.querySelector("#results-wrapper");
  
        if (resultsWrapper) {
          resultsWrapper.style.display = "none";
        }
      });
    }
  });
}
