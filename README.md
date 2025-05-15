# Productivity Nox

A pioneering mobile application that combines productivity tools with nutrition tracking to help users enhance their focus and overall well-being.

## Features

- Task Management with real-time sync
- Calendar Integration
- Nutrition Tracking with Edamam API integration
- Dark/Light Mode
- Cross-platform (iOS & Android)
- Real-time synchronization via Supabase

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase for backend
- Tailwind CSS (twrnc)
- React Navigation
- React Query

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account
- Edamam API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_EDAMAM_APP_ID=your_edamam_app_id
EXPO_PUBLIC_EDAMAM_APP_KEY=your_edamam_app_key
```

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── screens/        # Screen components
  ├── navigation/     # Navigation configuration
  ├── services/       # API and external service integrations
  ├── hooks/          # Custom React hooks
  ├── utils/          # Utility functions
  ├── types/          # TypeScript type definitions
  ├── constants/      # App constants
  └── context/        # React Context providers
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 