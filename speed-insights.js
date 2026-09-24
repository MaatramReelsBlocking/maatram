/**
 * Vercel Speed Insights initialization for Maatram
 * This script provides a simple way to inject Speed Insights into static HTML pages
 * Based on @vercel/speed-insights package
 */
(function() {
  'use strict';
  
  // Initialize the queue for Speed Insights events
  if (!window.si) {
    window.si = function() {
      (window.siq = window.siq || []).push(arguments);
    };
  }
  
  // Inject the Speed Insights script
  function injectScript() {
    // Check if script is already added
    var scriptSrc = '/_vercel/speed-insights/script.js';
    if (document.head.querySelector('script[src*="' + scriptSrc + '"]')) {
      return;
    }
    
    // Create and configure the script element
    var script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    script.dataset.sdkn = '@vercel/speed-insights';
    script.dataset.sdkv = '2.0.0';
    
    script.onerror = function() {
      console.log('[Vercel Speed Insights] Failed to load script. Please check if any content blockers are enabled.');
    };
    
    document.head.appendChild(script);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectScript);
  } else {
    injectScript();
  }
})();

/* Microsoft Clarity (heatmaps + session replays) — production domain only.
   Clarity masks typed text by default; see privacy.html. */
(function (c, l, a, r, i) {
  if (!i || location.hostname !== 'maatram.co.in') return;
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  var t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
  var y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', 'yn3xme467x');
