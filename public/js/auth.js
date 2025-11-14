// Client-side authentication utilities
// Note: These functions are currently unused but kept for potential future use

// Get user info from localStorage
export function getUserInfo() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

