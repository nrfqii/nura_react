import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { apiService } from "./api";

export function initEcho() {
  if ((window as any).Echo) return (window as any).Echo;
  const key =
    import.meta.env.VITE_PUSHER_APP_KEY || import.meta.env.VITE_PUSHER_KEY;
  const host = import.meta.env.VITE_PUSHER_HOST || "127.0.0.1";
  const port = Number(import.meta.env.VITE_PUSHER_PORT || 6001);
  const scheme = import.meta.env.VITE_PUSHER_SCHEME || "http";

  if (!key) return null;

  (window as any).Pusher = Pusher;

  const token = apiService.getToken();

  const echo = new Echo({
    broadcaster: "pusher",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    disableStats: true,
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          fetch("/broadcasting/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((res) => res.json())
            .then((data) => callback(false, data))
            .catch((err) => callback(true, new Error(err.message || 'Authorization failed')));
        },
      };
    },
  });

  (window as any).Echo = echo;
  return echo;
}
