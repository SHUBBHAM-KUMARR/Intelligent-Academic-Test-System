import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import axios from "axios";

export default function App() {
  const [, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:5000";
        await axios.get(serverUrl, { timeout: 3000 });
        setServerStatus("online");
      } catch {
        setServerStatus("offline");
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="relative">
      <HomePage />
    </div>
  );
}
