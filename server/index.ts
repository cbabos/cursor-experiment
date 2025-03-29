import express from 'express';
import cors from 'cors';
import { serverConfig } from './src/config';
import emailRoutes from './src/routes/emails';

const app = express();
app.use(cors());
app.use(express.json());

// Validate email credentials
if (!serverConfig.email.user || !serverConfig.email.password) {
  console.error('Email credentials are missing! Please set VITE_EMAIL_USER and VITE_EMAIL_PASSWORD environment variables.');
  process.exit(1);
}

console.log('Server starting with config:', {
  ...serverConfig,
  email: {
    ...serverConfig.email,
    password: '***' // Hide password in logs
  }
});

// Mount routes
app.use('/api/emails', emailRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 