# TaskFlow - Work Assignment App

A production-ready, mobile-first work assignment application built with Next.js, TypeScript, TailwindCSS, and Firebase.

## Features

### Phase 1 (Current) - Foundation MVP

- ✅ Firebase Authentication with email domain restriction (@tsb.com.vn)
- ✅ User registration, login, password reset
- ✅ Role-based access control (Admin/Manager/Employee)
- ✅ Teams CRUD with member management
- ✅ Projects CRUD with team linking
- ✅ Tasks CRUD with multi-assignee support
- ✅ Task status flow (Backlog → In Progress → Blocked → Done)
- ✅ Admin: User management with invite, role change, disable
- ✅ Firestore security rules with org isolation
- ✅ Mobile-first responsive design

### Upcoming Phases

- Phase 2: Subtasks, Comments, Attachments, Dashboards, Calendar
- Phase 3: Reminders, Excel exports, Audit logs
- Phase 4: iOS packaging with Capacitor
- Phase 5: Android, Multi-tenant support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: React Context + Hooks
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Excel Export**: xlsx (Phase 3)

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project

## Getting Started

### 1. Clone and Install

```bash
cd work-assignment-app
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
3. Create Firestore Database:
   - Go to Firestore Database > Create database
   - Start in test mode (we'll deploy security rules later)
4. Enable Storage:
   - Go to Storage > Get started
5. Get your config:
   - Go to Project Settings > General > Your apps
   - Click "Add app" > Web
   - Copy the firebaseConfig values

### 3. Environment Configuration

Copy `env.example` to `.env.local` and fill in your Firebase config:

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Deploy Security Rules & Indexes

Install Firebase CLI if you haven't:

```bash
npm install -g firebase-tools
firebase login
```

Initialize and deploy:

```bash
firebase use --add  # Select your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. Initialize Organization (First Time Setup)

Before users can register, you need to create the initial organization document. Run this in Firebase Console > Firestore > Data:

Create document at `/orgs/default-org`:

```json
{
  "id": "default-org",
  "name": "TSB Vietnam",
  "domain": "tsb.com.vn",
  "settings": {
    "allowedEmailDomains": ["tsb.com.vn"],
    "defaultRole": "employee"
  },
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

Create the first admin user by registering through the app, then manually update their role in Firestore:
`/orgs/default-org/users/{userId}` → set `role` to `"admin"` and `status` to `"active"`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Development with Emulators

For local development without affecting production data:

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, run with emulators
NEXT_PUBLIC_USE_EMULATORS=true npm run dev
```

Access emulator UI at [http://localhost:4000](http://localhost:4000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register, etc.)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # Context providers
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── common/            # Common components (Loading, EmptyState)
├── contexts/              # React contexts (Auth, Toast)
├── hooks/                 # Custom hooks (future)
├── lib/
│   ├── firebase/          # Firebase configuration & operations
│   ├── utils/             # Utility functions
│   └── constants.ts       # App constants
└── types/                 # TypeScript type definitions
```

## Security Rules

The app implements comprehensive Firestore security rules:

- **Org Isolation**: All data is scoped to `orgId`
- **Role-Based Access**: Admin > Manager > Employee hierarchy
- **Disabled User Blocking**: Disabled users cannot access any data
- **Field-Level Protection**: Employees can only update allowed fields on tasks

See `firestore.rules` for full implementation.

## Building for Production

```bash
npm run build
npm start
```

## iOS Packaging (Phase 4)

Coming soon - will use Capacitor for iOS deployment.

## License

Proprietary - TSB Vietnam

## Support

For issues or questions, contact the development team.
