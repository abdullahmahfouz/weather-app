import React, { useState } from 'react';
import './index.css';

const api = {
  key: '6b3b27e4e94b25edf5e550e16274c142',
  base: 'https://api.openweathermap.org/data/2.5/',
  geo: 'https://api.openweathermap.org/geo/1.0/',
};

const dateBuilder = (d) => {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const day = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${date} ${month}, ${year}`;
};

function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [place, setPlace] = useState({ state: '', countryCode: '', countryName: '' });
  const [locError, setLocError] = useState(null); // <-- add this

  const search = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      fetch(`${api.base}weather?q=${encodeURIComponent(query)}&appid=${api.key}&units=metric`)
        .then((res) => res.json())
        .then((result) => {
          if (result.cod === 200) {
            setWeather(result);

            const code = result?.sys?.country || '';
            const countryName = code
              ? new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' }).of(code)
              : '';

            const { lat, lon } = result?.coord || {};
            if (lat != null && lon != null) {
              fetch(`${api.geo}reverse?lat=${lat}&lon=${lon}&limit=1&appid=${api.key}`)
                .then((r) => r.json())
                .then((geo) => {
                  const g = geo?.[0];
                  setPlace({
                    state: g?.state || '',
                    countryCode: code,
                    countryName,
                  });
                })
                .catch(() => setPlace({ state: '', countryCode: code, countryName }));
            } else {
              setPlace({ state: '', countryCode: code, countryName });
            }
          } else {
            setWeather(null);
            setPlace({ state: '', countryCode: '', countryName: '' });
          }
          setQuery('');
        });
    }
  };

  const fetchByCoords = async (lat, lon) => {
    try {
      const res = await fetch(`${api.base}weather?lat=${lat}&lon=${lon}&appid=${api.key}&units=metric`);
      const data = await res.json();
      if (data.cod === 200) {
        setWeather(data);
        setLocError(null);
      } else {
        setLocError(data.message || 'Could not get weather for your location');
      }
    } catch {
      setLocError('Location error');
    }
  };

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchByCoords(latitude, longitude);
      },
      (err) => setLocError(err.message || 'Permission denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const isWarm = weather?.main && weather.main.temp > 16;

  const countryCode = weather?.sys?.country; // e.g. "US"
  const countryName = countryCode
    ? new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' }).of(countryCode)
    : ''; // e.g. "United States"

  return (
    <div className={`app ${weather?.main && weather.main.temp > 16 ? 'warm' : ''}`}>
      <main>
        <div className="search-box">
          <input
            type="text"
            className="search-bar"
            placeholder="Search..."
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            onKeyDown={search}
          />
          <div className="my-location">
          <button type="button" onClick={useCurrentLocation}>Use my location</button>
          </div>
        </div>

        {locError ? <div className="error">{locError}</div> : null}

        {weather?.main ? (
          <>
            <div className="location-box">
              <div className="location">
                {weather.name}
                {place.state ? `, ${place.state}` : ''}
                {place.countryName ? `, ${place.countryName}` : ''}
              </div>
              <div className="date">{dateBuilder(new Date())}</div>
            </div>
            <div className="weather-box">
              <div className="temp">{Math.round(weather.main.temp)}°C</div>
              <div className="weather">{weather.weather?.[0]?.description}</div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;