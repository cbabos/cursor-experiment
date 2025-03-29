export const config = {
  weatherApiKey: import.meta.env.VITE_WEATHER_API_KEY || 'YOUR_API_KEY',
  email: {
    user: import.meta.env.VITE_EMAIL_USER || '',
    password: import.meta.env.VITE_EMAIL_PASSWORD || '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  },
}; 