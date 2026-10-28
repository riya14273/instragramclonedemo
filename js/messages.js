// messages.js - Real-time one-to-one Direct Messaging & Conversations
import { 
    db, 
    collection, 
    addDoc, 
    doc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot, 
    serverTimestamp, 
    isConfigured 
} from "./firebase.js";
import { AppState, formatTimeAgo, showToast } from "./app.js";

// Starter conversations for offline/demo experience
export const SEED_CONVERSATIONS = [
    {
        id: "conv_maya",
        participant: {
            username: "maya_lens",
            fullName: "Maya Visuals",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
            online: true
        },
        lastMessage: "Loved your latest sunset shot! Which lens was that?",
        lastTime: "10m ago",
        unread: true,
        messages: [
            { id: "m1", senderId: "user_maya", text: "Hey! Loved your latest post on InstaVibe!", time: "12m ago", isMine: false },
            { id: "m2", senderId: "user_maya", text: "Loved your latest sunset shot! Which lens was that?", time: "10m ago", isMine: false }
        ]
    },
    {
        id: "conv_alex",
        participant: {
            username: "alex_design",
            fullName: "Alex Rover",
            avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
            online: false
        },
        lastMessage: "Can we collaborate on the upcoming design reel?",
        lastTime: "2h ago",
        unread: false,
        messages: [
            { id: "m3", senderId: "user_alex", text: "Hey there! Are you free to collaborate this weekend?", time: "2h ago", isMine: false },
            { id: "m4", senderId: "current_user", text: "Hey Alex! Yes absolutely, what do you have in mind?", time: "2h ago", isMine: true },
            { id: "m5", senderId: "user_alex", text: "Can we collaborate on the upcoming design reel?", time: "2h ago", isMine: false }
        ]
    }
];

export function getStoredConversations() {
    const raw = localStorage.getItem("instavibe_conversations");
    if (!raw) {
        localStorage.setItem("instavibe_conversations", JSON.stringify(SEED_CONVERSATIONS));
        return SEED_CONVERSATIONS;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return SEED_CONVERSATIONS;
    }
}

export function saveStoredConversations(convs) {
    localStorage.setItem("instavibe_conversations", JSON.stringify(convs));
}

// Send a direct message
export async function sendDirectMessage(conversationId, text) {
    if (!text || !text.trim()) return null;
    const currentUser = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!currentUser) {
        showToast("Please log in to chat", "error");
        return null;
    }

    const newMessage = {
        id: "msg_" + Date.now(),
        senderId: currentUser.uid,
        senderUsername: currentUser.username,
        text: text.trim(),
        createdAt: isConfigured() ? serverTimestamp() : new Date().toISOString(),
        time: "Just now",
        isMine: true
    };

    if (!isConfigured()) {
        const convs = getStoredConversations();
        const conv = convs.find(c => c.id === conversationId);
        if (conv) {
            conv.messages.push(newMessage);
            conv.lastMessage = newMessage.text;
            conv.lastTime = "Just now";
            saveStoredConversations(convs);
        }
        return newMessage;
    }

    // Real Firebase Firestore Direct Messaging
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    await addDoc(messagesRef, newMessage);
    return newMessage;
}
