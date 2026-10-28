// notifications.js - Notification feed, badges, and read states
import { db, collection, getDocs, query, where, orderBy, limit, isConfigured } from "./firebase.js";
import { AppState, formatTimeAgo } from "./app.js";

export const SAMPLE_NOTIFICATIONS = [
    {
        id: "notif_1",
        type: "like",
        senderUsername: "elena_vibes",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        text: "liked your post.",
        postImage: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=150&q=80",
        timeAgo: "15m ago",
        isRead: false
    },
    {
        id: "notif_2",
        type: "follow",
        senderUsername: "urban_architect",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        text: "started following you.",
        timeAgo: "2h ago",
        isRead: false
    },
    {
        id: "notif_3",
        type: "comment",
        senderUsername: "foodie_chef_leo",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        text: 'commented: "Incredible shot! 🙌"',
        postImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80",
        timeAgo: "1d ago",
        isRead: true
    }
];

// Open and toggle Notifications Modal / Dropdown
export function toggleNotificationsDropdown() {
    let modal = document.getElementById("notifications-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "notifications-modal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-card" style="max-width: 440px;">
                <div class="modal-header">
                    <span class="modal-title">Notifications</span>
                    <button class="modal-close-btn" id="close-notif-modal">&times;</button>
                </div>
                <div class="modal-body" id="notif-list-body" style="padding: 12px 16px;">
                    ${SAMPLE_NOTIFICATIONS.map(n => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light); ${!n.isRead ? 'background: rgba(0, 149, 246, 0.04);' : ''}">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img src="${n.senderAvatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                                <div style="font-size: 13.5px; line-height: 1.4;">
                                    <span style="font-weight: 700;">${n.senderUsername}</span> ${n.text}
                                    <div style="font-size: 11.5px; color: var(--text-muted);">${n.timeAgo}</div>
                                </div>
                            </div>
                            ${n.postImage ? `<img src="${n.postImage}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;" />` : `<button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;">Follow</button>`}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector("#close-notif-modal").addEventListener("click", () => {
            modal.classList.remove("active");
        });
    }

    modal.classList.toggle("active");
}
