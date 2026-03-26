# 🛠️ IT Support Portal

A production-level web application for managing company IT support issues. Built with React, Firebase Authentication, and Google Sheets as a backend database via Google Apps Script.

---

## ✨ Features

- **🔐 Secure Authentication** - Firebase email/password auth with employee number validation
- **📝 Issue Submission** - Submit IT issues with type selection, description, and screenshot upload
- **📊 Queue System** - Dynamic queue numbering that auto-updates when issues are resolved
- **🔄 Real-Time Sync** - Auto-polling every 15 seconds for status and queue updates
- **⭐ Feedback System** - Star rating + comments after issue resolution
- **📱 Mobile Responsive** - Works beautifully on all screen sizes
- **🎨 Premium UI** - Modern glassmorphism design with smooth animations

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Authentication | Firebase Auth |
| Database | Google Sheets |
| API Layer | Google Apps Script |
| Styling | Vanilla CSS (Custom Design System) |

---

## 📁 Project Structure

```
company-It-Issue-report/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx / Header.css
│   │   ├── Dashboard/
│   │   │   ├── IssueForm.jsx / IssueForm.css
│   │   │   ├── IssueStatus.jsx / IssueStatus.css
│   │   │   ├── QueueDisplay.jsx / QueueDisplay.css
│   │   │   └── FeedbackForm.jsx / FeedbackForm.css
│   │   └── UI/
│   │       ├── LoadingSpinner.jsx / LoadingSpinner.css
│   │       └── Toast.jsx / Toast.css
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── sheetsApi.js
│   │   └── imageUpload.js
│   ├── hooks/
│   │   └── useIssue.js
│   ├── pages/
│   │   ├── LoginPage.jsx / LoginPage.css
│   │   └── DashboardPage.jsx / DashboardPage.css
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx / App.css
│   ├── index.css
│   └── main.jsx
├── apps-script/
│   └── Code.gs          ← Google Apps Script backend
├── .env.example
├── package.json
└── vite.config.js
```

---

## 🚀 Setup Guide

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → **Email/Password** sign-in method
4. Add users manually in Firebase Auth with their company email + password
5. Go to **Project Settings** → copy your Firebase config values

### 2. Google Sheets + Apps Script Setup

1. Create a new **Google Sheet**
2. Name the first tab **"Issues"**
3. Add these headers in Row 1:
   ```
   Timestamp | EmpNo | Email | Issue Type | Description | Screenshot URL | Status | Queue Number | Feedback
   ```
4. Go to **Extensions → Apps Script**
5. Delete any existing code and paste the contents of `apps-script/Code.gs`
6. Run the `setupTrigger()` function once (this enables auto queue recalculation)
7. Deploy:
   - **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Copy the deployment URL

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123

   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

### 4. Run the Application

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🔄 User Flow

```
Login (empNo + email + password)
  │
  ▼
Dashboard
  │
  ├── No Active Issue → Show Issue Form
  │     └── Submit → Assigned Queue Number
  │
  ├── Active Issue (Pending) → Show Status + Queue Position
  │     └── Auto-polls for updates every 15s
  │
  └── Active Issue (Completed) → Show Feedback Form
        └── Submit Feedback → Can create new issue
```

---

## ⚙️ Queue Logic

1. **On Submit**: Queue number = count of today's pending issues + 1
2. **On Completion**: Admin marks "Completed" in Google Sheet → Queue numbers auto-recalculate
3. **On Feedback**: User submits feedback → Ticket fully closed → Can submit new issue

---

## 📸 Screenshot Upload

The app supports image upload in three ways:
1. **ImgBB API** (recommended) - Set `VITE_IMGBB_API_KEY` in `.env`
2. **Base64 Data URL** - Fallback if no API key (stored as text in sheet)
3. **Empty** - Screenshot is optional

---

## 🛡️ Security

- Firebase Authentication validates all users
- Employee number stored in localStorage
- Apps Script validates employee ownership before feedback submission
- Script lock prevents race conditions in queue numbering

---

## 📱 Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `< 640px` | Mobile phones |
| `641px - 900px` | Tablets |
| `> 900px` | Desktop |

---

## 🎨 Design System

The app uses a comprehensive CSS custom properties system defined in `src/index.css`:
- **Colors**: Indigo primary, Emerald accent, Amber warning, Rose danger
- **Typography**: Inter font family with 8 size tokens
- **Spacing**: 14 spacing tokens from 0.25rem to 5rem
- **Shadows**: 6 elevation levels + glow effects
- **Animations**: 9 keyframe animations for micro-interactions
- **Transitions**: 3 speed tokens (fast, base, slow)

---

## 📋 Admin Guide

To resolve an issue:
1. Open the Google Sheet
2. Find the employee's row
3. Change the **Status** column from `Pending` to `Completed`
4. Queue numbers will automatically recalculate
5. The employee will see the completion notice on their next refresh

---

## License

MIT
