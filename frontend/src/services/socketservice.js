import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (!socket) {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:8080";
    socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(" Connected to ChatApp Socket server with ID:", socket.id);
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