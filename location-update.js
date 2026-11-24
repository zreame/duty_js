function getUserCoordinates(options = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: false, // Faster, uses Wi-Fi/cell towers (plenty accurate for JAKIM zones)
      timeout: 8000,             // Fail gracefully after 8 seconds
      maximumAge: 600000,        // Reuse cached position if less than 10 minutes old
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
      },
      (error) => {
        const messages = {
          1: "Location permission denied by user.",
          2: "Location information is unavailable.",
          3: "Location request timed out.",
        };
        reject(new Error(messages[error.code] || "Unknown geolocation error."));
      },
      defaultOptions
    );
  });
}