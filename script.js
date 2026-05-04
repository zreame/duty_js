function randInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getPrayerTimes() {
    const container = document.getElementById('prayer_list');
    // Official JAKIM API for Bukit Jelutong

    // const url = 'https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=SGR01';

    try {
        // const response = await fetch(url);
        // const result = await response.json();
        const response = await fetch('/.netlify/functions/get-prayers');
        const result = await response.json();
        
        // JAKIM returns an array called 'prayerTime'
        const todayData = result.prayerTime[0];

        const formatTime = (timeStr) => timeStr.substring(0, 5);

        const prayers = [
            { label: 'Subuh', time: formatTime(todayData.fajr) },
            { label: 'Zohor', time: formatTime(todayData.dhuhr) },
            { label: 'Asar', time: formatTime(todayData.asr) },
            { label: 'Maghrib', time: formatTime(todayData.maghrib) },
            { label: 'Isyak', time: formatTime(todayData.isha) }
        ];

        container.innerHTML = prayers.map(p => `
            <div class="prayer-row">
                <span>${p.label}</span>
                <span>${p.time}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error("JAKIM API blocked or down:", err);
        // Fallback to the AlAdhan logic we built earlier if this fails
    }
}

async function updateVibe() {
    const imgEl = document.getElementById('daily_image');
    const quoteEl = document.getElementById('daily_quote');

    try {
        // 1. Fetch quote
        const response = await fetch('https://api.adviceslip.com/advice');
        const data = await response.json();
        
        // 2. Setup the image
        const seed = randInteger(100, 1000);
        const imgUrl = `https://picsum.photos/seed/${seed}/500/300`;

        // 3. Pre-load the image bytes
        const tempImg = new Image();
        tempImg.src = imgUrl;

        // This promise ensures the "broken" icon never appears
        await new Promise((resolve) => {
            tempImg.onload = resolve;
            tempImg.onerror = resolve; 
        });

        // 4. Everything is in the browser cache now. Swap and Reveal.
        imgEl.src = imgUrl;
        quoteEl.textContent = `"${data.slip.advice}"`;
        imgEl.style.opacity = 1; // Fades in smoothly

    } catch (err) {
        // Step 3: Know when to let go (Fallback)
        imgEl.src = "https://picsum.photos/500/300?grayscale&blur=2";
        imgEl.style.opacity = 1;
    }
}



function updateDashboard() {
    const now = new Date();

// 1. Calculate Day of Year
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayNum = Math.floor(diff / oneDay);

    // 2. Calculate ISO Week Number
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

    // 3. Logic for Duties
    const nekoStatus = (dayNum % 2 !== 0) ? "Ayy" : "Ism";
    const wipeyStatus = (weekNum % 2 === 0) ? "Ayy" : "Ism";

    // 4. Format Date String (Manual build for May 04, 2026 | 5:42pm style)
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    
    const monthName = months[now.getMonth()];
    const dayPadded = String(now.getDate()).padStart(2, '0');
    const yearNum = now.getFullYear();
    
    // let hours = now.getHours();
    // const minsPadded = String(now.getMinutes()).padStart(2, '0');
    // const ampm = hours >= 12 ? 'pm' : 'am';
    
    // hours = hours % 12;
    // hours = hours ? hours : 12; // Handle midnight (0) as 12

    const hours = String(now.getHours()).padStart(2, '0');
    const minsPadded = String(now.getMinutes()).padStart(2, '0');
    
    // Final string: "19:38"
    const time24 = `${hours}:${minsPadded}`;
    
    const dateString = `${monthName} ${dayPadded}, ${yearNum} | ${time24}`;

    // 5. Inject into HTML
    document.getElementById('full_date_time').textContent = dateString;
    document.getElementById('day_of_year').textContent = dayNum;
    document.getElementById('week_number').textContent = weekNum;
    document.getElementById('neko_status').textContent = nekoStatus;
    document.getElementById('wipey_status').textContent = wipeyStatus;
}

// Run immediately on load
window.addEventListener('DOMContentLoaded', updateVibe);
getPrayerTimes();
updateDashboard();