function getDeviceCoordinates() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported by browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
      (err) => {
        const reasons = {
          1: "Permission denied (check iOS Settings > Safari Websites & site Location setting).",
          2: "Position unavailable (CoreLocation could not get a fix).",
          3: "Location request timed out.",
        };
        reject(new Error(reasons[err.code] || err.message || "Unknown GPS error"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function formatLocationSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "_");
}

async function getLocationInfo(lat, long) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Reverse geocode failed: ${response.status}`);
  const data = await response.json();

  const rawCity =
    data.city ||
    data.locality ||
    data.principalSubdivision ||
    "unknown";
  const rawCountry = data.countryName || data.countryCode || "";

  const city = formatLocationSlug(rawCity);
  const country = formatLocationSlug(rawCountry);
  const locationName =
    city && country && city !== country
      ? `${city}, ${country}`
      : city || country;

  return {
    countryCode: data.countryCode,
    locationName,
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
}

function unixToHHMM_GMT8(unixSeconds) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(unixSeconds * 1000));
}

function parseMalaysiaPrayerTimes(data) {
  const todayDay = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
    }).format(new Date())
  );

  const today = data.prayers?.find((p) => p.day === todayDay);
  if (!today) throw new Error("Today's prayer entry not found in MY payload.");

  return {
    fajr: unixToHHMM_GMT8(today.fajr),
    syuruk: unixToHHMM_GMT8(today.syuruk),
    zuhr: unixToHHMM_GMT8(today.dhuhr),
    asar: unixToHHMM_GMT8(today.asr),
    maghrib: unixToHHMM_GMT8(today.maghrib),
    isyak: unixToHHMM_GMT8(today.isha),
  };
}

function parseSingaporePrayerTimes(data) {
  const times = data.times;
  if (!times) throw new Error("Times object missing in SG payload.");

  return {
    fajr: times.subuh.slice(0, 5),
    syuruk: times.syuruk.slice(0, 5),
    zuhr: times.zohor.slice(0, 5),
    asar: times.asar.slice(0, 5),
    maghrib: times.maghrib.slice(0, 5),
    isyak: times.isyak.slice(0, 5),
  };
}

function parseGlobalPrayerTimes(data) {
  const timings = data.data?.timings;
  if (!timings) throw new Error("Timings object missing in Global payload.");

  return {
    fajr: timings.Fajr.slice(0, 5),
    syuruk: timings.Sunrise.slice(0, 5),
    zuhr: timings.Dhuhr.slice(0, 5),
    asar: timings.Asr.slice(0, 5),
    maghrib: timings.Maghrib.slice(0, 5),
    isyak: timings.Isha.slice(0, 5),
  };
}

function getQiblaBearing(lat, long) {
  const KAABA_LAT = 21.4225;
  const KAABA_LONG = 39.8262;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const dLambda = toRad(KAABA_LONG - long);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return `${Math.round(bearing * 10) / 10}°`;
}

export async function fetchPrayerDataByLocation() {
  const { lat, long } = await getDeviceCoordinates();
  const qibla = getQiblaBearing(lat, long);
  let locationName = "current_location";

  try {
    const info = await getLocationInfo(lat, long);
    locationName = info.locationName;

    if (info.countryCode === "MY") {
      const data = await fetchJson(`https://api.waktusolat.app/v2/solat/gps/${lat}/${long}`);
      return { locationName, qibla, times: parseMalaysiaPrayerTimes(data) };
    }

    if (info.countryCode === "SG") {
      const data = await fetchJson("https://api.prayertimes.sg/api/v1/prayer-times/today");
      return { locationName, qibla, times: parseSingaporePrayerTimes(data) };
    }
  } catch (err) {
    console.warn("Regional endpoint failed; falling back to AlAdhan:", err);
  }

  const globalData = await fetchJson(
    `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${long}&school=0`
  );
  return { locationName, qibla, times: parseGlobalPrayerTimes(globalData) };
}


