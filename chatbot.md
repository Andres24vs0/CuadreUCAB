
# 1) Instalación y envs

```bash
pnpm add pusher pusher-js
```

En tu `.env.local`:

```env
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=mt1   # o el que uses
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

---

# 2) Utilidades Pusher (server & client)

`/lib/pusher.ts`:

```ts
// Server
import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client
import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    // Para canales privados/presence:
    authEndpoint: "/api/pusher/auth",
    // Si usas NextAuth, puedes dejar que la cookie de sesión autentique
  }
);
```

---

# 3) Auth para canales privados (asegura que sólo vean el chat los que hacen match)

`/app/api/pusher/auth/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth"; // o tu método de auth
import { db, Matches } from "@/lib/db";       // ajusta a tu capa Mongo

export async function POST(req: NextRequest) {
  const session = await getServerSession(); // obtén userId de tu sesión
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.formData();
  const channel_name = String(body.get("channel_name")); // pusher envía form-data
  const socket_id = String(body.get("socket_id"));

  // Convención: private-chat-<matchId>
  const matchId = channel_name.replace("private-chat-", "");

  await db.connect();

  const match = await Matches.findOne({ _id: matchId, participants: session.user.id });
  if (!match) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
    user_id: session.user.id, // opcional si usas presence
  });

  return NextResponse.json(authResponse);
}
```

> Con esto, **sólo** los usuarios que pertenecen al `matchId` pueden suscribirse al canal.

---

# 4) Esquemas básicos en Mongo (Message & Match)

(usa Mongoose o el driver que prefieras)

```ts
// /lib/models.ts (ejemplo Mongoose)
import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  matchId: { type: String, index: true, required: true },
  senderId: { type: String, index: true, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
  readAt: { type: Date, default: null },
});

const MatchSchema = new Schema({
  participants: { type: [String], index: true, required: true }, // [userA, userB]
  createdAt: { type: Date, default: () => new Date() },
});

export const Messages = models.Messages || model("Messages", MessageSchema);
export const Matches  = models.Matches  || model("Matches", MatchSchema);
```

---

# 5) Server Action para enviar mensaje (graba y emite)

`/app/actions/sendMessage.ts`:

```ts
"use server";

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { Messages } from "@/lib/models";
import { pusherServer } from "@/lib/pusher";

export async function sendMessage(input: { matchId: string; text: string }) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { matchId, text } = input;

  await db.connect();
  const msg = await Messages.create({
    matchId,
    senderId: session.user.id,
    text,
  });

  // Emitimos al canal privado del match
  await pusherServer.trigger(`private-chat-${matchId}`, "message:new", {
    _id: String(msg._id),
    matchId,
    senderId: msg.senderId,
    text: msg.text,
    createdAt: msg.createdAt,
  });

  return { ok: true, id: String(msg._id) };
}
```

---

# 6) Hook cliente para suscribirse a un match

`/hooks/useChatChannel.ts`:

```ts
import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";

type Message = {
  _id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export function useChatChannel(matchId: string, onNewMessage: (m: Message) => void) {
  useEffect(() => {
    if (!matchId) return;

    const channel = pusherClient.subscribe(`private-chat-${matchId}`);

    const handler = (data: Message) => {
      onNewMessage(data);
    };

    channel.bind("message:new", handler);

    return () => {
      channel.unbind("message:new", handler);
      pusherClient.unsubscribe(`private-chat-${matchId}`);
    };
  }, [matchId, onNewMessage]);
}
```

---

# 7) Componente de Chat (lista y input)

`/app/(match)/chat/[matchId]/Chat.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useChatChannel } from "@/hooks/useChatChannel";
import { sendMessage } from "@/app/actions/sendMessage";

type Message = {
  _id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export default function Chat({ matchId, me }: { matchId: string; me: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Carga inicial (SSR o fetch en efecto) — opcional:
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/messages?matchId=${matchId}`, { cache: "no-store" });
      const data = (await res.json()) as Message[];
      setMessages(data);
      endRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    })();
  }, [matchId]);

  useChatChannel(matchId, (m) => {
    setMessages((prev) => [...prev, m]);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const pending: Message = {
      _id: `tmp-${crypto.randomUUID()}`,
      matchId,
      senderId: me,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, pending]); // optimista
    setText("");

    try {
      await sendMessage({ matchId, text: pending.text });
    } catch {
      // opcional: mostrar error / revertir optimista
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`max-w-[70%] rounded-2xl px-3 py-2 ${
              m.senderId === me ? "ml-auto bg-blue-500 text-white" : "mr-auto bg-gray-200"
            }`}
          >
            <div className="text-sm">{m.text}</div>
            <div className="text-[10px] opacity-70 mt-1">
              {new Date(m.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSend} className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
        />
        <button
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          disabled={!text.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
```

---

# 8) Endpoint para cargar mensajes iniciales (opcional)

`/app/api/messages/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Messages } from "@/lib/models";
import { getServerSession } from "next-auth";
import { Matches } from "@/lib/models";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId")!;
  await db.connect();

  // seguridad: confirma que pertenece al match
  const ok = await Matches.exists({ _id: matchId, participants: session.user.id });
  if (!ok) return NextResponse.json([], { status: 403 });

  const items = await Messages.find({ matchId }).sort({ createdAt: 1 }).limit(200);
  return NextResponse.json(items);
}
```
