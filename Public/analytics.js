// analytics.js
import { analytics } from "./firebase-config.js";
import {
  logEvent,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

let analyticsReady = false;

// Initialize analytics
(async () => {
  try {
    if (await isSupported()) {
      analyticsReady = true;

      // Track page view
      logEvent(analytics, "page_view", {
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname
      });

      // Track daily visitor
      trackDailyVisitor();

      console.log("✅ Analytics initialized");
    }
  } catch (err) {
    console.warn("Analytics not supported:", err);
  }
})();

// Track daily visitors
function trackDailyVisitor() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem('snaplocate_last_visit');
  
  if (lastVisit !== today) {
    localStorage.setItem('snaplocate_last_visit', today);
    
    if (analyticsReady) {
      logEvent(analytics, 'daily_visitor', {
        date: today,
        page: location.pathname,
        is_returning: lastVisit ? true : false
      });
    }
  }
}

// Export functions for use in other scripts
window.trackEvent = function(eventName, parameters = {}) {
  if (analyticsReady) {
    logEvent(analytics, eventName, parameters);
    console.log(`📊 Event tracked: ${eventName}`, parameters);
  }
};

window.trackNavigation = function(destination) {
  if (analyticsReady) {
    logEvent(analytics, 'navigation_click', {
      destination: destination,
      from_page: location.pathname
    });
  }
};

window.trackSearch = function(searchType, query) {
  if (analyticsReady) {
    logEvent(analytics, 'search', {
      search_term: query,
      search_type: searchType, 
      page: location.pathname
    });
  }
};

window.trackCardInteraction = function(cardType, action) {
  if (analyticsReady) {
    logEvent(analytics, 'card_interaction', {
      card_type: cardType,
      action: action, 
      page: location.pathname
    });
  }
};
