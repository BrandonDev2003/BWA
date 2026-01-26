"use client";

import { useEffect, useRef, useState } from "react";

type Notification = {
  chatId: number;
  name: string;
  photo: string | null;
  message: string;
};

export default function ChatNotifications({
  userId,
  onOpenChat,
}: {
  userId: number;
  onOpenChat: (chatId: number) => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastMessages = useRef<Record<number, string>>({});

  const checkNewMessages = async () => {
    const res = await fetch(`/api/chats?userId=${userId}`);
    const chats = await res.json();

    if (!Array.isArray(chats)) return;

    chats.forEach((chat) => {
      const prev = lastMessages.current[chat.id];
      const current = chat.lastMessage;

      if (prev && current && prev !== current) {
        setNotifications((prevNotifs) => {
          if (prevNotifs.some((n) => n.chatId === chat.id)) return prevNotifs;

          return [
            ...prevNotifs,
            {
              chatId: chat.id,
              name: chat.name,
              photo: chat.photo,
              message: current,
            },
          ];
        });
      }

      lastMessages.current[chat.id] = current;
    });
  };

  useEffect(() => {
    checkNewMessages();
    const interval = setInterval(checkNewMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const openChat = (chatId: number) => {
    setNotifications((prev) =>
      prev.filter((n) => n.chatId !== chatId)
    );
    onOpenChat(chatId);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {notifications.map((n) => (
        <div
          key={n.chatId}
          onClick={() => openChat(n.chatId)}
          className="
            flex items-center gap-3
            bg-white shadow-xl rounded-xl
            px-4 py-3 w-72
            cursor-pointer
            animate-slide-in
          "
        >
          <img
            src={n.photo || "/avatar.png"}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col">
            <strong className="text-sm">
              {n.name}
            </strong>
            <span className="text-xs text-gray-600 truncate">
              {n.message}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
