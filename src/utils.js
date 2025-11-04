export function createPageUrl(name) {
  // Map logical page names used throughout the project to route paths.
  const map = {
    Home: '/home',
    RoutePlanner: '/route',
    BuddyMatch: '/buddy',
    Community: '/community',
    Profile: '/profile',
  };
  return map[name] || `/${name.toLowerCase()}`;
}

export default { createPageUrl };
