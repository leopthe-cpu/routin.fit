// Current weather from Open-Meteo (https://open-meteo.com): no API key, and the
// request carries nothing but rounded coordinates. Results are cached on the
// device for 15 minutes so opening the app repeatedly doesn't refetch.

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const CACHE_KEY = 'routin-weather';
export const CACHE_MS = 15 * 60 * 1000;

// WMO weather interpretation codes, as listed in the Open-Meteo docs.
const CODES = [
  [[0], 'Clear', 'sun'],
  [[1], 'Mostly clear', 'sun'],
  [[2], 'Partly cloudy', 'cloudsun'],
  [[3], 'Cloudy', 'cloud'],
  [[45, 48], 'Fog', 'fog'],
  [[51, 53, 55, 56, 57], 'Drizzle', 'rain'],
  [[61, 63, 66, 80, 81], 'Rain', 'rain'],
  [[65, 67, 82], 'Heavy rain', 'rain'],
  [[71, 73, 75, 77, 85, 86], 'Snow', 'snow'],
  [[95, 96, 99], 'Thunderstorm', 'storm'],
];

export function describeCode(code, isDay = true) {
  const hit = CODES.find(([codes]) => codes.includes(code));
  if (!hit) return { label: '—', icon: 'cloud' };
  const [, label, icon] = hit;
  // A clear night shows a moon rather than a sun.
  if (!isDay && icon === 'sun') return { label, icon: 'moon' };
  if (!isDay && icon === 'cloudsun') return { label, icon: 'cloud' };
  return { label, icon };
}

/** About 1 km of precision: plenty for weather, and less revealing than an exact position. */
export const roundCoord = (n) => Math.round(n * 100) / 100;

export function weatherUrl(lat, lon, unit = 'celsius') {
  const params = new URLSearchParams({
    latitude: String(roundCoord(lat)),
    longitude: String(roundCoord(lon)),
    current: 'temperature_2m,weather_code,is_day',
    timezone: 'auto',
  });
  if (unit === 'fahrenheit') params.set('temperature_unit', 'fahrenheit');
  return `${ENDPOINT}?${params}`;
}

/** Pull the few fields we show out of an Open-Meteo response; null if it doesn't look right. */
export function parseWeather(json) {
  const c = json?.current;
  if (!c || typeof c.temperature_2m !== 'number') return null;
  const { label, icon } = describeCode(c.weather_code, c.is_day !== 0);
  return { temp: Math.round(c.temperature_2m), label, icon };
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // storage unavailable: just don't cache
  }
}

export function cachedWeather(unit, now = Date.now()) {
  const c = readCache();
  return c && c.unit === unit && now - c.at < CACHE_MS ? c.data : null;
}

export function clearWeatherCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // nothing to clear
  }
}

function position() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not available on this device.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      (e) => reject(new Error(e.code === 1 ? 'Location permission was denied.' : 'Could not get your location.')),
      // A cached position up to 30 minutes old is fine for weather and saves battery.
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 15_000 },
    );
  });
}

/** Current weather for the device's location. Asks for location permission the first time. */
export async function loadWeather(unit = 'celsius') {
  const cached = cachedWeather(unit);
  if (cached) return cached;
  const { latitude, longitude } = await position();
  const res = await fetch(weatherUrl(latitude, longitude, unit));
  if (!res.ok) throw new Error(`Weather service error (${res.status}).`);
  const data = parseWeather(await res.json());
  if (!data) throw new Error('Unexpected weather response.');
  writeCache({ at: Date.now(), unit, data });
  return data;
}

/** True when the browser already has location permission, so we can fetch without prompting. */
export async function locationGranted() {
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' });
    return status?.state === 'granted';
  } catch {
    return false;
  }
}
