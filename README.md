# TechConnect - Online Tutoring Platform

A modern, real-time tutoring platform connecting learners with tutors for personalized educational sessions.

## Features

### For Learners
- 🔍 Browse and find qualified tutors by subject
- 📅 Book scheduled tutoring sessions
- ⚡ Request instant tutoring sessions
- 💬 Real-time video sessions with chat, whiteboard, and file sharing
- ⭐ Rate and provide feedback on sessions
- 📚 Access learning resources

### For Tutors
- 📊 Comprehensive dashboard with session analytics
- 🗓️ Manage availability and schedule
- 🔔 Receive instant session requests
- 👥 Track learners and session history
- 💰 Donation system for voluntary contributions
- 📝 View learner feedback

### For Administrators
- 👤 User management and tutor approvals
- 📈 Platform analytics and monitoring
- 📢 Announcement system
- 💵 Donation tracking
- 📋 Session logs and monitoring
- 🎯 Live session monitoring

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Realtime, Storage)
- **Video**: WebRTC for peer-to-peer video sessions
- **State Management**: React Hooks + Context API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SCLK-0/techconnect.git
cd techconnect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env` to create your environment file
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Run the migrations in `supabase/migrations/` in your Supabase project
   - Or use the `database-schema.sql` file for the complete schema

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
techconnect/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── admin/       # Admin-specific components
│   │   ├── learner/     # Learner-specific components
│   │   ├── tutor/       # Tutor-specific components
│   │   ├── ui/          # shadcn/ui components
│   │   └── video-session/ # Video session components
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Supabase integration
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── learner/     # Learner pages
│   │   └── tutor/       # Tutor pages
│   ├── lib/             # Utility functions
│   └── utils/           # Helper utilities
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

The app can be deployed to any static hosting service that supports Vite:
- Netlify
- Cloudflare Pages
- AWS Amplify
- GitHub Pages

## Documentation

- `MIGRATION-INSTRUCTIONS.md` - Guide for migrating to external Supabase
- `SETUP-AUTH-HOOKS.md` - Authentication hooks setup
- `SETUP-RESEND-EMAILS.md` - Email system configuration
- `SYSTEM-ARCHITECTURE.md` - System architecture overview
- `TESTING-GUIDE.md` - Testing guidelines
- `storage-setup-guide.md` - Storage bucket configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
