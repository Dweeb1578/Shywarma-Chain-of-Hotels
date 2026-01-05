export async function getCoordinates(city: string) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                name: data.results[0].name,
                country: data.results[0].country
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}

interface CurrentWeather {
    temperature_2m: number;
    weather_code: number;
}

interface DailyWeather {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
}

interface WeatherResponse {
    current: CurrentWeather;
    daily: DailyWeather;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherResponse | null> {
    try {
        // Fetch current weather and 5-day forecast (default is 7, we strip to 5 later if needed)
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&current=temperature_2m,weather_code&timezone=auto`
        );
        const data = await response.json();
        return data as WeatherResponse;
    } catch (error) {
        console.error("Weather fetch error:", error);
        return null;
    }
}

export function getWeatherDescription(code: number): string {
    // WMO Weather interpretation codes (WW)
    const codes: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };
    return codes[code] || 'Unknown';
}
