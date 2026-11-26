import { http, HttpResponse } from 'msw';

export const openMeteoHandlers = [
  http.get('https://air-quality-api.open-meteo.com/v1/air-quality', () =>
    HttpResponse.json({
      current: { time: '2026-11-22T13:00', pm2_5: 72, us_aqi: 175 },
      hourly: {
        time: ['2026-11-22T13:00', '2026-11-22T14:00'],
        pm2_5: [72, 68],
        us_aqi: [175, 168],
      },
    })
  ),
  http.get('https://geocoding-api.open-meteo.com/v1/search', () =>
    HttpResponse.json({
      results: [
        {
          id: 2950159,
          name: 'Berlin',
          latitude: 52.52437,
          longitude: 13.41053,
          country: 'Germany',
          admin1: 'State of Berlin',
        },
      ],
    })
  ),
];
