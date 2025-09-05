// sidebar.js - Enhanced with Analytics
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Analytics state
let userAnalyticsData = {
  userId: null,
  userType: 'guest',
  loginTime: null,
  sessionStartTime: Date.now()
};

// Utility to capitalize first letter
function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Enhanced user name update with analytics
function updateUserName(name, role = "SnapLocate User") {
  const nameElem = document.getElementById('userName');
  const roleElem = document.querySelector('.user-role');

  if (nameElem && roleElem) {
    nameElem.textContent = capitalizeName(name);
    roleElem.textContent = role;
  }

  // Track user profile update
  window.trackEvent && window.trackEvent('user_profile_updated', {
    user_name: capitalizeName(name),
    user_role: role,
    user_type: userAnalyticsData.userType
  });
}

// Enhanced auth state tracking
onAuthStateChanged(auth, (user) => {
  const previousUserType = userAnalyticsData.userType;
  
  if (user) {
    // Authenticated user
    userAnalyticsData.userId = user.uid;
    userAnalyticsData.userType = 'authenticated';
    userAnalyticsData.loginTime = Date.now();

    // Track authentication
    window.trackEvent && window.trackEvent('user_authentication', {
      user_id: user.uid,
      auth_method: user.providerData[0]?.providerId || 'unknown',
      has_display_name: !!user.displayName,
      has_email: !!user.email,
      is_new_session: previousUserType !== 'authenticated'
    });

    if (user.displayName) {
      updateUserName(user.displayName, "Authenticated User");
    } else if (user.email) {
      const username = user.email.split('@')[0];
      updateUserName(username, "Authenticated User");
    }
    
  } else {
    // Guest user
    userAnalyticsData.userType = 'guest';
    userAnalyticsData.userId = null;
    
    const guestId = localStorage.getItem('guestId') || generateGuestId();
    localStorage.setItem('guestId', guestId);
    
    updateUserName(guestId, "Guest User");
    
    // Track guest session
    window.trackEvent && window.trackEvent('guest_session_start', {
      guest_id: guestId,
      session_start: userAnalyticsData.sessionStartTime,
      previous_user_type: previousUserType
    });
  }
});

// Generate unique guest ID
function generateGuestId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `guest_${timestamp}_${randomStr}`;
}

// Enhanced sidebar toggle with analytics
window.toggleSidebar = function () {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.overlay');
  const isOpening = !sidebar.classList.contains('open');
  
  sidebar.classList.toggle('open');
  overlay?.classList.toggle('active');
  
  // Track sidebar interaction
  window.trackEvent && window.trackEvent('sidebar_interaction', {
    action: isOpening ? 'open' : 'close',
    user_type: userAnalyticsData.userType,
    page: window.location.pathname,
    timestamp: Date.now()
  });
};

// Enhanced navigation tracking
function trackNavigation(destination, linkElement) {
  const linkText = linkElement.textContent.trim();
  const linkHref = linkElement.getAttribute('href');
  
  window.trackEvent && window.trackEvent('navigation_click', {
    destination: destination,
    link_text: linkText,
    link_href: linkHref,
    from_page: window.location.pathname,
    user_type: userAnalyticsData.userType,
    click_time: Date.now()
  });
}

// Enhanced page highlighting with analytics
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Enhanced sidebar script loaded");

  const allLinks = document.querySelectorAll(".nav-links a, .sidebar a");
  let currentPath = window.location.pathname.split("/").pop() || "index.html";
  
  if (!currentPath.endsWith(".html")) {
    currentPath += ".html";
  }
  
  console.log("👉 Normalized currentPath =", currentPath);

  let activeLinksCount = 0;
  
  allLinks.forEach(link => {
    let href = link.getAttribute("href") || "";

    // Skip logo link
    if (link.querySelector("h2")) return;

    href = href.replace(/^\//, "");
    let normalizedHref = href.endsWith(".html") ? href : href + ".html";

    console.log(`Checking ${normalizedHref} vs ${currentPath}`);

    if (normalizedHref === currentPath) {
      link.classList.add("active");
      activeLinksCount++;
    }

    // Add click tracking to all navigation links
    link.addEventListener('click', function(e) {
      const destination = this.getAttribute('href') || 'unknown';
      trackNavigation(destination, this);
    });
  });

  // Track page load analytics
  window.trackEvent && window.trackEvent('page_navigation_setup', {
    current_page: currentPath,
    active_links_found: activeLinksCount,
    total_nav_links: allLinks.length,
    user_type: userAnalyticsData.userType
  });
});

// Track session duration on page unload
window.addEventListener('beforeunload', function() {
  const sessionDuration = Date.now() - userAnalyticsData.sessionStartTime;
  
  window.trackEvent && window.trackEvent('session_end', {
    session_duration_ms: sessionDuration,
    session_duration_minutes: Math.round(sessionDuration / 60000),
    user_type: userAnalyticsData.userType,
    page_at_exit: window.location.pathname,
    user_id: userAnalyticsData.userId
  });
});

// Track user engagement (scroll, clicks, time spent)
let engagementData = {
  scrollDepth: 0,
  clickCount: 0,
  timeOnPage: Date.now()
};

// Track scroll depth
window.addEventListener('scroll', throttle(() => {
  const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
  
  if (scrollPercent > engagementData.scrollDepth) {
    engagementData.scrollDepth = scrollPercent;
    
    // Track significant scroll milestones
    if (scrollPercent >= 25 && scrollPercent < 50) {
      window.trackEvent && window.trackEvent('scroll_milestone', { depth: '25%' });
    } else if (scrollPercent >= 50 && scrollPercent < 75) {
      window.trackEvent && window.trackEvent('scroll_milestone', { depth: '50%' });
    } else if (scrollPercent >= 75) {
      window.trackEvent && window.trackEvent('scroll_milestone', { depth: '75%' });
    }
  }
}, 1000));

// Track clicks
document.addEventListener('click', function() {
  engagementData.clickCount++;
});

// Throttle function for performance
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Track engagement every 30 seconds
setInterval(() => {
  window.trackEvent && window.trackEvent('user_engagement', {
    time_on_page_seconds: Math.round((Date.now() - engagementData.timeOnPage) / 1000),
    scroll_depth_percent: engagementData.scrollDepth,
    click_count: engagementData.clickCount,
    user_type: userAnalyticsData.userType,
    page: window.location.pathname
  });
}, 30000);

// Export user analytics data for other modules
window.getUserAnalyticsData = function() {
  return { ...userAnalyticsData };
};

console.log("🔥 Enhanced analytics sidebar loaded!");