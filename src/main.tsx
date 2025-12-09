import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google'; // --- NEW ---
import App from "./App.tsx";
import "./index.css";

// --- NEW: Get Client ID from .env ---
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Missing VITE_GOOGLE_CLIENT_ID environment variable");
}

createRoot(document.getElementById("root")!).render(
  // --- NEW: Wrap App with provider ---
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
);