export function login(email, password) {
  let userRole = null;

  if (email === "admin@example.com" && password === "xy123456") {
    userRole = "admin";
  } else if (email === "user@example.com" && password === "password") {
    userRole = "user";
  }

  if (userRole) {
    if (typeof window !== "undefined") {
      try {
        const sessionData = JSON.stringify({ loggedIn: true, role: userRole });
        localStorage.setItem("appSession", sessionData);
        return true;
      } catch (error) {
        console.error("Error saving session to localStorage:", error);
        return false; // Indicate failure if localStorage operation fails
      }
    }
    // If window is not defined (e.g., SSR) but credentials are valid,
    // we might still consider it a "successful" login attempt for non-browser contexts,
    // though session won't be persisted. For this app, client-side persistence is key.
    return typeof window !== "undefined"; // True if window defined, false otherwise (or handle as error)
  }
  return false;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("appSession");
  }
}

export function checkAuth() {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, role: null };
  }

  try {
    const sessionData = localStorage.getItem("appSession");
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      if (parsedData && parsedData.loggedIn === true && parsedData.role) {
        return { isAuthenticated: true, role: parsedData.role };
      }
    }
  } catch (error) {
    console.error("Error reading or parsing session from localStorage:", error);
    // Optionally, remove the corrupted item
    // localStorage.removeItem("appSession");
  }
  return { isAuthenticated: false, role: null };
}
