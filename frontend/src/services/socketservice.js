import { io } from "socket.io-client";

let socket = null;

const getSocketURL = () => {
  if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://arthur-backend-wilm.onrender.com";
  }
  return "http://localhost:8080";
};

export const connectSocket = (token) => {
  if (!socket) {
    const socketUrl = getSocketURL();

    socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(" Connected to ChatApp Socket server at:", socketUrl, "ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error(" Socket Connection Error:", err.message);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log(" Socket disconnected.");
  }
};