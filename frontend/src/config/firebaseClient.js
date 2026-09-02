import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Full Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Check for missing keys
const missingKeys = [];
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) missingKeys.push(key);
}

const hasClientConfig = missingKeys.length === 0;

// Initialize Firebase only if config exists
let firebaseApp = null;
if (hasClientConfig) {
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export { firebaseApp, auth, missingKeys };