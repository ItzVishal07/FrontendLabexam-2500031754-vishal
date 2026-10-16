const form = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const message = document.getElementById('message');
const content = document.getElementById('weatherContent');

const weatherCodes = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'], 45: ['Foggy', '🌫️'], 48: ['Depositing rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'], 61: ['Light rain', '🌦️'],
  63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'], 66: ['Freezing rain', '🌧️'],
  67: ['Heavy freezing rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'],
  75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'], 80: ['Rain showers', '🌦️'],
  81: ['Rain showers', '🌧️'], 82: ['Heavy rain showers', '⛈️'], 85: ['Snow showers', '🌨️'],
  86: ['Heavy snow showers', '❄️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'],
  99: ['Thunderstorm with hail', '⛈️']
};

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather service request failed. Please try again.');
  return response.json();
}

async function loadWeather(city) {
  content.hidden = true;
  setMessage('Finding city and loading weather…');
  try {
    // Geocoding API converts the city name to latitude/longitude.
    const geo = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!geo.results || !geo.results.length) throw new Error('City not found. Check the spelling and try again.');
    const place = geo.results[0];

    // Forecast API returns current conditions and daily forecast. No API key required.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
    const data = await getJSON(url);
    renderWeather(place, data);
    setMessage('');
    content.hidden = false;
  } catch (error) {
    setMessage(error.message || 'Could not load weather. Please check your internet connection.', true);
  }
}

function renderWeather(place, data) {
  const current = data.current;
  const daily = data.daily;
  const [description, icon] = weatherCodes[current.weather_code] || ['Weather conditions', '🌡️'];
  const date = new Date(`${current.time}`).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  document.getElementById('location').textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
  document.getElementById('todayDate').textContent = date;
  document.getElementById('weatherIcon').textContent = icon;
  document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°`;
  document.getElementById('description').textContent = description;
  document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
  document.getElementById('metricFeels').textContent = `${Math.round(current.apparent_temperature)}°C`;
  document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
  document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById('rain').textContent = `${daily.precipitation_probability_max?.[0] ?? 0}%`;

  const forecast = document.getElementById('forecast');
  forecast.innerHTML = '';
  daily.time.forEach((day, index) => {
    const [dayDescription, dayIcon] = weatherCodes[daily.weather_code[index]] || ['Weather', '🌡️'];
    const dateObj = new Date(`${day}T12:00:00`);
    const dayName = index === 0 ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const card = document.createElement('article');
    card.className = 'card day';
    card.innerHTML = `<p class="day-name">${dayName}</p><div class="day-icon" title="${dayDescription}">${dayIcon}</div><p class="range">${Math.round(daily.temperature_2m_max[index])}°</p><p class="low">${Math.round(daily.temperature_2m_min[index])}° low</p>`;
    forecast.appendChild(card);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setMessage('Please enter a city name.', true);
    return;
  }
  loadWeather(city);
});

loadWeather(cityInput.value.trim());
