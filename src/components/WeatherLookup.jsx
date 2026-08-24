import React, { useState } from "react";
import { X, Search, Loader2, CloudSun, MapPin, Droplets, Wind, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WMO = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Fog", emoji: "🌫️" },
  48: { label: "Rime fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌦️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  66: { label: "Freezing rain", emoji: "🌧️" },
  67: { label: "Freezing rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  77: { label: "Snow grains", emoji: "🌨️" },
  80: { label: "Light showers", emoji: "🌦️" },
  81: { label: "Showers", emoji: "🌧️" },
  82: { label: "Violent showers", emoji: "⛈️" },
  85: { label: "Snow showers", emoji: "🌨️" },
  86: { label: "Snow showers", emoji: "❄️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm, hail", emoji: "⛈️" },
  99: { label: "Thunderstorm, hail", emoji: "⛈️" },
};

function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}

export default function WeatherLookup({ onClose }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [place, setPlace] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setPlace(null);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
      const geo = await geoRes.json();
      if (!geo.results || geo.results.length === 0) {
        setError("Location not found. Try another name.");
        return;
      }
      const loc = geo.results[0];
      setPlace(loc);
      const fcRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,windspeed_10m_max&timezone=auto`);
      const fc = await fcRes.json();
      const idx = fc.daily.time.indexOf(date);
      if (idx === -1) {
        setError(`No forecast available for ${date}. Forecasts cover the next ~16 days only.`);
        return;
      }
      setResult({
        date,
        tMax: fc.daily.temperature_2m_max[idx],
        tMin: fc.daily.temperature_2m_min[idx],
        precip: fc.daily.precipitation_sum[idx],
        wind: fc.daily.windspeed_10m_max[idx],
        code: fc.daily.weather_code[idx],
      });
    } catch (err) {
      setError(err.message || "Could not fetch weather.");
    } finally {
      setLoading(false);
    }
  };

  const w = result ? WMO[result.code] || { label: "—", emoji: "🌡️" } : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Weather Lookup</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <form onSubmit={search} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any city worldwide…" className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100" />
            </div>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:w-40" />
            <Button type="submit" disabled={loading || !query.trim()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>

          {error && <div className="text-sm text-rose-400">{error}</div>}

          {result && w && (
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-800/60 to-zinc-950 p-5">
              {place && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-400 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {place.name}{place.country ? `, ${place.country}` : ""}
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="text-5xl">{w.emoji}</div>
                <div>
                  <div className="text-3xl font-semibold text-zinc-100">{Math.round(result.tMax)}°<span className="text-zinc-500 text-xl"> / {Math.round(result.tMin)}°</span></div>
                  <div className="text-sm text-zinc-300">{w.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{new Date(result.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1"><Thermometer className="w-3.5 h-3.5" /> High / Low</div>
                  <div className="text-sm text-zinc-200">{Math.round(result.tMax)}° / {Math.round(result.tMin)}°</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1"><Droplets className="w-3.5 h-3.5" /> Rain</div>
                  <div className="text-sm text-zinc-200">{result.precip ?? 0} mm</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1"><Wind className="w-3.5 h-3.5" /> Wind</div>
                  <div className="text-sm text-zinc-200">{Math.round(result.wind)} km/h</div>
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <p className="text-xs text-zinc-500 text-center">Search any city and pick a date — forecasts cover the next ~16 days.</p>
          )}
        </div>
      </div>
    </div>
  );
}