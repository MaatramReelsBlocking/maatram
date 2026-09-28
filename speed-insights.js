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
    // Vercel Web Analytics, same first-party path theme.js uses
    // (pages without theme.js, e.g. 404.html and auth-bridge.html, rely on this)
    window.va = window.va || function() { (window.vaq = window.vaq || []).push(arguments); };
    var vaSrc = '/_vercel/insights/script.js';
    if (!document.head.querySelector('script[src*="' + vaSrc + '"]')) {
      var va = document.createElement('script');
      va.src = vaSrc;
      va.defer = true;
      document.head.appendChild(va);
    }

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
