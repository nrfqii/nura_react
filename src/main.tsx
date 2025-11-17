import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initEcho } from "./lib/echo";

// Initialize Echo (if configured) for realtime subscriptions
initEcho();

createRoot(document.getElementById("root")!).render(<App />);
