import { fetchPrayerDataByLocation } from "./prayer-times.js";

function toTitleCase(str) {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function randInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDayOfMonthGMT8(date = new Date()) {
  const dayString = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
  }).format(date);

  return Number(dayString);
}

function updatePrayerLabel(location, angle, isGlobal = false, method = "") {
  const labelEl = document.getElementById("prayer_location");
  const noteEl = document.getElementById("kiblat_note");
  if (!labelEl) {
    console.error("Location element not found in DOM");
    return;
  }

  labelEl.innerHTML = `<strong>${toTitleCase(location)}| Qiblah: ${angle}</strong>`;

  if (noteEl) {
    if (isGlobal) {
      noteEl.textContent = `~ computed with Aladhan (Shafi'i| ${method})`;
      noteEl.hidden = false;
    } else {
      noteEl.textContent = "";
      noteEl.hidden = true;
    }
  }
}

function renderPrayerTimes(times) {
  const container = document.getElementById("prayer_list");
  const prayers = [
    { label: "Subuh", time: times.fajr },
    { label: "Syuruk", time: times.syuruk },
    { label: "Zohor", time: times.zuhr },
    { label: "Asar", time: times.asar },
    { label: "Maghrib", time: times.maghrib },
    { label: "Isyak", time: times.isyak },
  ];

  container.innerHTML = prayers
    .map(
      (p) => `
        <div class="prayer-row">
            <span>${p.label}</span>
            <span>${p.time}</span>
        </div>
      `
    )
    .join("");
}

// Default home base (Shah Alam - SGR01)
async function getPrayerTimes() {
  updatePrayerLabel("Shah Alam, Malaysia", "292.6°");
  const day = getDayOfMonthGMT8();
  const url = `https://api.waktusolat.app/solat/SGR01/${day}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const result = await response.json();

    const todayData = Array.isArray(result.prayerTime)
      ? result.prayerTime[0]
      : result.prayerTime;

    const formatTime = (timeStr) => timeStr.substring(0, 5);

    renderPrayerTimes({
      fajr: formatTime(todayData.fajr),
      syuruk: formatTime(todayData.syuruk),
      zuhr: formatTime(todayData.dhuhr),
      asar: formatTime(todayData.asr),
      maghrib: formatTime(todayData.maghrib),
      isyak: formatTime(todayData.isha),
    });
  } catch (err) {
    console.error("Home base API error:", err);
    document.getElementById("prayer_list").innerHTML =
      `<span class="loading">Unable to load prayer times.</span>`;
  }
}

// Triggered on #updatelocation button click
async function updateLocationPrayerTimes() {
  const btn = document.getElementById("updatelocation");
  const locationPromise = fetchPrayerDataByLocation();

  btn.disabled = true;
  btn.textContent = "locating...";

  try {
    const { locationName, qibla, isGlobal, method, times } = await locationPromise;

    updatePrayerLabel(locationName, qibla, isGlobal, method);
    renderPrayerTimes(times);
    btn.textContent = "current location";
    btn.classList.add("is-updated");
  } catch (err) {
    console.error("Geo update failed:", err);
    alert(`Geo failed: ${err.message}\nReverting to Shah Alam.`);
    btn.textContent = "update location";
    btn.classList.remove("is-updated");
    await getPrayerTimes();
  } finally {
    btn.disabled = false;
  }
}

async function updateVibe() {
  const imgEl = document.getElementById("daily_image");
  const quoteEl = document.getElementById("daily_quote");

  try {
    const response = await fetch("https://api.adviceslip.com/advice");
    const data = await response.json();

    const seed = randInteger(100, 1000);
    const imgUrl = `https://picsum.photos/seed/${seed}/500/300`;

    const tempImg = new Image();
    tempImg.src = imgUrl;

    await new Promise((resolve) => {
      tempImg.onload = resolve;
      tempImg.onerror = resolve;
    });

    imgEl.src = imgUrl;
    quoteEl.textContent = `"${data.slip.advice}"`;
    imgEl.style.opacity = 1;
  } catch (err) {
    imgEl.src = "https://picsum.photos/500/300?grayscale&blur=2";
    imgEl.style.opacity = 1;
  }
}

function updateDashboard() {
  const now = new Date();

  // 1. Day of Year
  const start = new Date(now.getFullYear(), 0, 0);
  const dayNum = Math.floor((now - start) / (1000 * 60 * 60 * 24));

  // 2. ISO Week Number
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

  // 3. Duties
  const nekoStatus = dayNum % 2 !== 0 ? "Ayy" : "Ism";
  const wipeyStatus = weekNum % 2 === 0 ? "Ayy" : "Ism";

  // 4. Date & 24h Time
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthName = months[now.getMonth()];
  const dayPadded = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minsPadded = String(now.getMinutes()).padStart(2, "0");

  document.getElementById("full_date_time").textContent =
    `${monthName} ${dayPadded}, ${now.getFullYear()}| ${hours}:${minsPadded}`;
  document.getElementById("day_of_year").textContent = dayNum;
  document.getElementById("week_number").textContent = weekNum;
  document.getElementById("neko_status").textContent = nekoStatus;
  document.getElementById("wipey_status").textContent = wipeyStatus;
}

// Initial load
updateVibe();
getPrayerTimes();
updateDashboard();

// Bind button click
document
  .getElementById("updatelocation")
  ?.addEventListener("click", updateLocationPrayerTimes);