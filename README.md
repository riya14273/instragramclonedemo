# InstaVibe – Modern Social Media Platform

A complete, modern, responsive social media web application inspired by Instagram, built with HTML5, CSS3, Vanilla JavaScript, and Firebase (Authentication, Cloud Firestore, Firebase Storage).

---

## 🌟 Key Features

1. **Creative UI/UX Design**
   - Signature InstaVibe gradient logo and design system.
   - Desktop left sidebar navigation and mobile-friendly bottom navigation bar.
   - Light and Dark mode toggle with seamless transitions and persistent storage.
   - Responsive layouts for Mobile, Tablet, and Desktop.
   - Double-tap heart animation on post images.
   - Toast notifications and interactive confirmation dialogs.

2. **User Authentication**
   - Sign up with full name, unique username validation, email, and password.
   - Secure login and session persistence.
   - Forgot password reset flow.
   - Demo / Guest offline fallback mode for immediate testing even before connecting Firebase keys.

3. **Dynamic Home Feed & Stories**
   - Top interactive Stories strip with viewer and progress timer.
   - Post cards supporting photos, supported videos, captions, hashtags, and alt text.
   - Real-time like/unlike counters, double-tap to like.
   - Comment section with instant updates.
   - Bookmark/save post feature.
   - Share modal and clipboard link copying.

4. **Post Creation**
   - Media upload drag-and-drop file picker with image and video preview.
   - File validation (type checks and 25MB limit).
   - Caption editor with automatic hashtag parsing and alt text accessibility.
   - Progress bar indicators.

5. **User Profiles**
   - Profile header with avatars, bio, website link, and post/followers/following counts.
   - Follow and unfollow functionality with real-time counter changes.
   - Tabbed grid layout for user's published and saved posts.
   - Lightbox modal for full post inspection.
   - Edit Profile dialog with real-time avatar preview.

6. **Search & Explore**
   - Live search input for creators and hashtags.
   - Suggested accounts and trending hashtag pills.
   - Curated high-resolution explore grid.

7. **Direct Messaging & Notifications**
   - 1-to-1 conversation view with chat bubbles.
   - Message timestamps and read state indicators.
   - Notifications modal for likes, comments, and follows.

---

## 📁 Project Structure

```
instavibe/
├── index.html               # Home Feed & Post creation modal
├── login.html               # User sign-in & password recovery
├── signup.html              # User sign-up & username validation
├── profile.html             # Profile view, edit dialog & post grid
├── explore.html             # Search, trending tags & explore gallery
├── messages.html            # 1-to-1 direct messaging interface
├── css/
│   ├── style.css            # Central design tokens, dark mode, component styles
│   └── responsive.css       # Mobile & tablet layout adaptations
├── js/
│   ├── firebase.js          # Firebase SDK configuration & initialization
│   ├── app.js               # Theme, toasts, navigation & global utilities
│   ├── auth.js              # Authentication, login, signup, username checks
│   ├── feed.js              # Stories and feed post rendering & double-tap
│   ├── posts.js             # Post uploads, likes, comments, bookmarks & deletion
│   ├── profile.js           # Profile data loading, follow/unfollow, profile edits
│   ├── explore.js           # Search algorithms, explore data & suggested users
│   ├── messages.js          # Direct messaging logic & conversation storage
│   └── notifications.js     # Activity notifications dropdown
└── firebase/
    ├── firestore.rules      # Cloud Firestore security rules
    ├── storage.rules        # Firebase Storage security rules
    └── firestore.indexes.json # Composite indexes for scalable queries
```

---

## 🚀 Getting Started & Local Setup

### 1. Run Locally
Because this project utilizes modern ES modules (`type="module"`), it should be served via a local web server:

**Using Python:**
```bash
cd instavibe
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

**Using VS Code Live Server:**
Right click `index.html` and select **"Open with Live Server"**.

**Using Node / npx:**
```bash
npx serve instavibe
```

> **Note on Demo Mode:** The project comes with an automatic offline fallback system so you can test all features (signing up, creating posts, liking, commenting, messaging) immediately without configuring Firebase first.

---

## ⚙️ Connecting Your Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (e.g., `instavibe-app`).
3. Enable **Authentication** in the sidebar:
   - Enable **Email/Password** provider.
4. Enable **Cloud Firestore Database**:
   - Start in Test mode or deploy the rules provided in `firebase/firestore.rules`.
5. Enable **Firebase Storage**:
   - Deploy the rules provided in `firebase/storage.rules`.
6. Go to **Project Settings > General > Your apps**, click the Web icon (`</>`), and copy your `firebaseConfig` object.
7. Open `js/firebase.js` and replace `firebaseConfig` with your real keys:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

---

## 🌐 Deploying to Firebase Hosting

Install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
```

Login and initialize:
```bash
firebase login
firebase init
```
- Select **Hosting, Firestore, Storage**.
- Set public directory to current directory `.` or `instavibe`.
- Configure as single-page app: `No`.
- Deploy:
```bash
firebase deploy
```
Your InstaVibe clone is now live with an SSL URL!
