import { useState, useEffect } from "react";

export const useSocket = (token) => {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket("ws://localhost:5000");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "AUTH", payload: { token } }));
    };

    socket.onmessage = (e) => {
      const message = JSON.parse(e.data);
      if (message.type === "NEW_MESSAGE") {
        setMessages((prevMessages) => [...prevMessages, message.message]);
      }
      if (message.type === "ROOM_JOINED") {
        setRoom(message.room);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [token]);

  const joinRoom = (room) => {
    if (ws && room) {
      ws.send(JSON.stringify({ type: "JOIN_ROOM", payload: { room } }));
    }
  };

  const sendMessage = (message) => {
    if (ws && room) {
      ws.send(JSON.stringify({ type: "SEND_MESSAGE", payload: { message } }));
    }
  };

  return { messages, joinRoom, sendMessage };
};
