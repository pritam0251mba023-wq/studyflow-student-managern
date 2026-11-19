# STUDYFLOW – Student Productivity Manager

STUDYFLOW is a responsive student productivity and assignment deadline manager built with **React**, **TypeScript**, **Tailwind CSS**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore**.

## Features

- **Landing Page & Google Authentication**: Clean introduction and one-click Google Sign-In via Firebase Auth (`signInWithPopup`).
- **Student Productivity Dashboard**: Real-time summary cards for **Total**, **Pending**, **Completed**, and **Overdue** assignments, paired with interactive SVG charts (Completion Breakdown donut chart, Subject Workload bar chart, and 7-Day Deadline Forecast).
- **Assignment Manager**: Full CRUD workflow (create, edit, delete, filter by status/subject, sort by due date/priority, and live search) with inline transitions across `Pending`, `In Progress`, and `Completed`.
- **Interactive Deadline Calendar**: Monthly grid view highlighting submission dates, overdue items, and a selected-day schedule panel with one-click assignment creation for any date.
- **Per-User Cloud Firestore Security**: Hardened `firestore.rules` enforcing strict user ownership (`ownerId == request.auth.uid`), schema validation, bounded string sizes, and server timestamps.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Firebase v12 (Authentication + Cloud Firestore)
- Lucide React icons

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <your-github-repo-url>
cd studyflow
npm install
```

### 2. Configure Firebase

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** -> **Sign-in method** -> **Google**.
3. Create a **Cloud Firestore** database.
4. Deploy the security rules from `firestore.rules` in this repository (via Firebase CLI `firebase deploy --only firestore:rules` or by pasting `firestore.rules` into the Firestore Rules tab).
5. Copy `.env.example` to `.env` and fill in your Firebase Web App credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_DATABASE_ID="(default)"
```

*(In AI Studio, `firebase-applet-config.json` is automatically loaded when `VITE_FIREBASE_*` environment variables are not set.)*

### 3. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 4. Type-check and production build

```bash
npm run lint
npm run build
```

## Deploying to GitHub & Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: STUDYFLOW Student Productivity Manager"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
   - Framework Preset: **Vite** (`vercel.json` is pre-configured with SPA rewrites).
   - Add all `VITE_FIREBASE_*` environment variables under **Project Settings -> Environment Variables**.
   - Click **Deploy**.
3. **Authorize your Vercel domain in Firebase**:
   - In the Firebase Console, go to **Authentication -> Settings -> Authorized domains** and add your `*.vercel.app` (and custom) domain so Google Sign-In popups succeed in production.

## Security Rules

Review and audit `firestore.rules` before sharing your deployment broadly. The rules enforce authenticated, email-verified ownership (`ownerId == request.auth.uid`), strict key allowlists, field length bounds, and server-side timestamp checks.
