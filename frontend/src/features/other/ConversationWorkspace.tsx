"use client"
import {FormEvent, useEffect, useState} from "react";
import {API_BASE} from "@/constants";
import {Message, MessageWrapper, UserWrapper} from "@/types";


export default function ConversationWorkspace({currentUser}: any) {

    // Message states
    const [recipientId, setRecipientId] = useState(0);
    const [messageText, setMessageText] = useState("");

    const [error, setError] = useState("");

    // Load messages for current user
    async function loadConversations() {
        try {
            const messages = await fetch(`${API_BASE}/api/conversations`);
            if (!messages.ok) throw new Error("Failed to load messages");
            const data: [] = await messages.json();
        } catch {}
    }

    // Send a new message
    async function sendMessage(e: FormEvent) {
        e.preventDefault();
        if (!messageText.trim()) {
            setError("Message text must be provided.");
            return;
        }

        try {
            const recipient_res = await fetch(`${API_BASE}/api/artists/${recipientId}`);
            if (!recipient_res.ok) throw new Error("Could not find recipient.");
            const recipient = await recipient_res.json();

            const userWrapper: UserWrapper = {
                users: [currentUser, recipient],
            };

            const newMessage: Message = {
                senderId: currentUser.id,
                messageText: messageText.trim(),
            };

            const newMessageWrapper: MessageWrapper = {
                userWrapper: userWrapper,
                message: newMessage,
            };

            const response = await fetch(
                `${API_BASE}/api/conversations/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newMessageWrapper),
                }
            );

        } catch {}
    }

    // Start a new conversation
    async function startConversation(e: FormEvent) {
        e.preventDefault();

        try {
            const recipient_res = await fetch(`${API_BASE}/api/artists/${recipientId}`);
            if (!recipient_res.ok) throw new Error("Could not find recipient.");
            const recipient = await recipient_res.json();

            const userWrapper: UserWrapper = {
                users: [currentUser, recipient],
            };

            const response = await fetch(
                `${API_BASE}/api/conversations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userWrapper),
                }
            );

        } catch {}
    }


    return(

        <div className="studio-grid">

            <form onSubmit={startConversation}>
                <label>Start a new conversation</label>

                <textarea
                    rows={7}
                    maxLength={5000}
                    placeholder={"Type your message here..."}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                />

                <input
                    aria-label={"Recipient ID"}
                    type={"text"}
                    onChange={e => setRecipientId(e.target.valueAsNumber)}
                />

                <button className={"primary full"}>Send message</button>

            </form>

        </div>

    );

}