import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const serverConfig = {
  email: {
    user: process.env.VITE_EMAIL_USER || '',
    password: process.env.VITE_EMAIL_PASSWORD || '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  },
}; 