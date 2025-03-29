# AI Assistant with Email Integration

An AI-powered assistant that can help you manage your emails and check weather information through a chat interface.

## Features

- 📧 Email Management
  - Check unread emails with pagination
  - View email summaries including subject, sender, date, and snippets
  - Attachment detection
  - Size information
- 🌤 Weather Information
  - Get current weather conditions
  - Weather forecasts
- 🤖 AI-Powered Assistant
  - Natural language processing
  - Context-aware responses
  - Tool integration

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Gmail account with App Password enabled
- OpenWeatherMap API key
- Ollama (latest version)

## Installation

1. Install Ollama:
   - macOS or Linux:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
   - Windows: Download from https://ollama.com/download
   
2. Pull the required model:
```bash
ollama pull claude
```

3. Clone the repository:
```bash
git clone <repository-url>
cd assistantCursor
```

4. Install dependencies:
```bash
npm install
```

5. Create a `.env` file in the project root:
```env
VITE_EMAIL_USER=your.email@gmail.com
VITE_EMAIL_PASSWORD=your-app-password
VITE_WEATHER_API_KEY=your-openweathermap-api-key
```

### Setting up Gmail App Password

1. Go to your Google Account settings (https://myaccount.google.com)
2. Navigate to Security > 2-Step Verification
3. Scroll to the bottom and select "App passwords"
4. Generate a new app password:
   - Select "Mail" as the app
   - Select "Other" as the device
   - Name it "AI Assistant"
   - Copy the generated 16-character password
5. Use this password in your `.env` file for `VITE_EMAIL_PASSWORD`

### Getting OpenWeatherMap API Key

1. Sign up at OpenWeatherMap (https://openweathermap.org/api)
2. Go to your API keys section
3. Generate a new API key
4. Copy the API key to your `.env` file for `VITE_WEATHER_API_KEY`

## Running the Application

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Available Tools

### Email Tool
Check your unread emails using natural language commands in the chat interface.

Example commands:
- "Check my unread emails"
- "Show me my latest emails"

The tool will display:
- Sender name/email
- Subject
- Date
- Attachment indicator (📎)
- Email size
- Preview snippet (when available)

### Weather Tool
Get weather information for any location.

Example commands:
- "What's the weather like in London?"
- "Show me the forecast for New York"

## Development

The project structure is organized as follows:

```
├── src/
│   ├── components/     # Frontend React components
│   ├── context/       # React context providers
│   ├── tools/         # Frontend tool implementations
│   └── config/        # Frontend configuration
├── server/
│   ├── src/
│   │   ├── services/  # Backend services
│   │   ├── routes/    # API route handlers
│   │   └── config/    # Backend configuration
│   └── index.ts       # Main server file
└── .env              # Environment variables
```

## Security Notes

- Never commit your `.env` file or expose your credentials
- The Gmail App Password is specific to this application and can be revoked at any time
- The server uses CORS and runs on a different port than the frontend
- Email credentials are only stored on the backend for security

## Troubleshooting

1. If the server fails to start:
   - Check if port 3001 is already in use
   - Verify your email credentials in `.env`
   - Ensure your Gmail account has IMAP enabled

2. If email fetching fails:
   - Verify your App Password is correct
   - Check if your Gmail account has 2FA enabled
   - Ensure you have an active internet connection

3. If weather data isn't showing:
   - Verify your OpenWeatherMap API key
   - Check if you've exceeded the API rate limits
   - Ensure the location name is valid

4. If the AI assistant is not responding:
   - Verify Ollama is running (`ollama ps`)
   - Check if the claude model is installed (`ollama list`)
   - Try restarting the Ollama service
   - Ensure you have enough system resources available
