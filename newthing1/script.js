// --- script.js ---
const WEATHER_API_KEY = '4cdd5c2a5c38a5622c008f9ade3acb41';
const PEXELS_API_KEY  = 'xrkNNEpfw9sR3xHThDH4fn0GqPVxDpgRmBLm0oNgvgv12V2KgXr2wbqV';

function toggleLoading(show) {
  document.getElementById('loadingOverlay')
          .classList.toggle('hidden', !show);
}

async function main() {
  // Show spinner immediately
  toggleLoading(true);

  try {
    // 1) Read the country from URL
    const params = new URLSearchParams(window.location.search);
    const country = params.get('country');
    if (!country) {
      throw new Error('No country specified in URL');
    }
    document.getElementById('countryName').textContent = country;

    // 2) Fetch country info
    const countryRes = await fetch(`https://restcountries.com/v3.1/name/${country}`);
    if (!countryRes.ok) throw new Error('Country API error');
    const [info] = await countryRes.json();

    // 3) Populate "Country Facts"
    const currencies = Object.values(info.currencies || {})
                             .map(c=>`${c.name} (${c.symbol})`).join(', ');
    const languages  = Object.values(info.languages || {}).join(', ');
    const borders    = info.borders?.join(', ') || 'None';
    document.getElementById('countryDetails').innerHTML = `
      <h3>Country Facts</h3>
      <p><strong>Capital:</strong> ${info.capital?.[0]||'N/A'}</p>
      <p><strong>Population:</strong> ${info.population.toLocaleString()}</p>
      <p><strong>Area:</strong> ${info.area.toLocaleString()} km²</p>
      <p><strong>Languages:</strong> ${languages}</p>
      <p><strong>Currencies:</strong> ${currencies}</p>
      <p><strong>Borders:</strong> ${borders}</p>
    `;
    document.getElementById('countryDetails').classList.remove('hidden');

    // 4) Best Time to Visit
    const lat = info.capitalInfo?.latlng?.[0] ?? info.latlng[0];
    const best = lat >= 0
      ? 'April–June or September–November'
      : 'September–November or March–May';
    document.getElementById('bestTime').innerHTML = `
      <h3>Best Time to Visit</h3><p>${best}</p>
    `;
    document.getElementById('bestTime').classList.remove('hidden');

    // 5) Weather
    if (info.capital?.[0]) {
      const wRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${info.capital[0]}` +
        `&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!wRes.ok) throw new Error('Weather API error');
      const w = await wRes.json();
      document.getElementById('weatherDetails').innerHTML = `
        <h3>Weather in ${info.capital[0]}</h3>
        <p><strong>Temp:</strong> ${w.main.temp}°C</p>
        <p><strong>Condition:</strong> ${w.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${w.main.humidity}%</p>
        <p><strong>Wind:</strong> ${w.wind.speed} m/s</p>
      `;
      document.getElementById('weatherDetails').classList.remove('hidden');
    }

    // 6) Images via Pexels
    const iRes = await fetch(
      `https://api.pexels.com/v1/search?query=${country}&per_page=6`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!iRes.ok) throw new Error('Pexels API error');
    const photos = (await iRes.json()).photos;
    document.getElementById('imageGallery').innerHTML = photos
      .map(p => `<img src="${p.src.medium}" alt="${country}">`)
      .join('');
    document.getElementById('imageGallery').classList.remove('hidden');

    // 7) Map via Leaflet
    const [lat0, lng0] = info.capitalInfo?.latlng || info.latlng;
    document.getElementById('map').classList.remove('hidden');
    const map = L.map('map').setView([lat0, lng0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([lat0, lng0]).addTo(map)
      .bindPopup(`<b>${info.capital[0]}</b><br>${info.name.common}`)
      .openPopup();

  } catch (err) {
    console.error(err);
    alert(err.message);
    // If you want to redirect back on error:
    // window.location.href = 'index.html';
  } finally {
    // Always hide the spinner
    toggleLoading(false);
  }
}

// Start everything once the DOM is ready
window.addEventListener('DOMContentLoaded', main);
