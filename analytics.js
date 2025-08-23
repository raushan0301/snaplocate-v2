// analytics.js
import { app } from "./firebase-config.js";
import {
  getAnalytics,
  isSupported,
  logEvent
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

(async () => {
  try {
    if (await isSupported()) {
      const analytics = getAnalytics(app);

      // Log a page view (extra safety for single-page apps)
      logEvent(analytics, "page_view", {
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname
      });

      // Expose for custom events (optional)
      window.snapAnalytics = analytics;
    }
  } catch (err) {
    console.warn("Analytics not supported:", err);
  }
})();
