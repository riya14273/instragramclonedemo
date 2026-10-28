// app.js - Central Application Engine & Utilities
// Toast notifications, Theme Management, Navigation UI, Mock & Demo Fallbacks

import { auth, db, doc, getDoc, onAuthStateChanged, signOut } from "./firebase.js";

// Global App State
export const AppState = {
    currentUser: null,
    userProfile: null,
    isDarkMode: false,
};

// Initialize Toast notification system
export function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ed4956" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0095f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// Confirmation Dialog Utility
export function showConfirm(title, message, confirmBtnText = "Confirm", isDanger = false) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay active";
        overlay.innerHTML = `
            <div class="modal-card" style="max-width: 400px; text-align: center;">
                <div class="modal-body" style="padding: 28px 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${title}</h3>
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px;">${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn btn-secondary" id="confirm-cancel" style="flex: 1;">Cancel</button>
                        <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok" style="flex: 1;">${confirmBtnText}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector("#confirm-cancel").addEventListener("click", () => {
            overlay.remove();
            resolve(false);
        });

        overlay.querySelector("#confirm-ok").addEventListener("click", () => {
            overlay.remove();
            resolve(true);
        });
    });
}

// Theme Management
export function initTheme() {
    const savedTheme = localStorage.getItem("instavibe_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute("data-theme", "dark");
        AppState.isDarkMode = true;
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        AppState.isDarkMode = false;
    }
}

export function toggleTheme() {
    AppState.isDarkMode = !AppState.isDarkMode;
    const newTheme = AppState.isDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("instavibe_theme", newTheme);
    showToast(`Switched to ${newTheme} mode`, "info");
}

// Relative time formatting
export function formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// User Profile Loader & Sync
export async function syncUserProfile(user) {
    if (!user) {
        AppState.currentUser = null;
        AppState.userProfile = null;
        return null;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
            AppState.userProfile = userSnap.data();
        } else {
            // Default profile structure fallback
            AppState.userProfile = {
                uid: user.uid,
                email: user.email,
                username: user.displayName || user.email.split('@')[0],
                fullName: user.displayName || "InstaVibe Creator",
                photoURL: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                bio: "Vibing on InstaVibe ✨",
                postsCount: 0,
                followersCount: 0,
                followingCount: 0,
                savedPosts: []
            };
        }
        AppState.currentUser = user;
        updateUIWithUser(AppState.userProfile);
        return AppState.userProfile;
    } catch (e) {
        console.warn("Could not fetch remote user doc, falling back to local auth object:", e);
        AppState.userProfile = {
            uid: user.uid,
            email: user.email,
            username: user.displayName || "user",
            fullName: user.displayName || "InstaVibe User",
            photoURL: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            bio: "Welcome to my InstaVibe!",
            postsCount: 0,
            followersCount: 0,
            followingCount: 0
        };
        AppState.currentUser = user;
        updateUIWithUser(AppState.userProfile);
        return AppState.userProfile;
    }
}

// Update Avatars and User Details across active DOM
function updateUIWithUser(profile) {
    if (!profile) return;
    document.querySelectorAll(".current-user-avatar").forEach(el => {
        el.src = profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
    });
    document.querySelectorAll(".current-user-name").forEach(el => {
        el.textContent = profile.fullName || profile.username;
    });
    document.querySelectorAll(".current-user-handle").forEach(el => {
        el.textContent = `@${profile.username}`;
    });
}

// Global Auth State Observer
export function initAuthObserver(onUserLoaded) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profile = await syncUserProfile(user);
            if (onUserLoaded) onUserLoaded(profile);
        } else {
            AppState.currentUser = null;
            AppState.userProfile = null;
            // If current page requires auth and not on auth pages, redirect
            const path = window.location.pathname.toLowerCase();
            const isAuthPage = path.includes("login.html") || path.includes("signup.html");
            if (!isAuthPage) {
                // Allow guest preview or route if strictly protected
            }
            if (onUserLoaded) onUserLoaded(null);
        }
    });
}

// Shared Navigation Component Generator
export function renderNavigation(activePage = "home") {
    const sidebar = document.getElementById("main-sidebar");
    const bottomNav = document.getElementById("bottom-navigation");
    const mobileTopbar = document.getElementById("mobile-topbar");

    const navItems = [
        { id: "home", label: "Home", href: "index.html", icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
        { id: "search", label: "Search", href: "explore.html?action=search", icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>` },
        { id: "explore", label: "Explore", href: "explore.html", icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
        { id: "messages", label: "Messages", href: "messages.html", icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>` },
        { id: "notifications", label: "Notifications", href: "#", isNotificationBtn: true, icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>` },
        { id: "create", label: "Create", href: "#", isCreateBtn: true, icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>` },
        { id: "profile", label: "Profile", href: "profile.html", isProfile: true, icon: `<img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" class="nav-avatar current-user-avatar" alt="Profile" />` }
    ];

    if (sidebar) {
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <a href="index.html" class="brand-logo">
                    <span class="brand-icon-gradient">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </span>
                    <span class="brand-logo-text">InstaVibe</span>
                </a>
            </div>
            <ul class="nav-links">
                ${navItems.map(item => `
                    <li class="nav-item ${activePage === item.id ? 'active' : ''}">
                        <a href="${item.href}" id="nav-${item.id}">
                            <div class="nav-icon-wrap">${item.icon}</div>
                            <span class="nav-label">${item.label}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
            <div class="sidebar-footer">
                <div class="nav-item">
                    <button id="theme-toggle-btn">
                        <div class="nav-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        </div>
                        <span class="nav-label">Switch Theme</span>
                    </button>
                </div>
                <div class="nav-item">
                    <button id="logout-btn">
                        <div class="nav-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </div>
                        <span class="nav-label">Log Out</span>
                    </button>
                </div>
            </div>
        `;
    }

    if (bottomNav) {
        bottomNav.innerHTML = `
            <a href="index.html" class="bottom-nav-item ${activePage === 'home' ? 'active' : ''}">${navItems[0].icon}</a>
            <a href="explore.html" class="bottom-nav-item ${activePage === 'explore' ? 'active' : ''}">${navItems[2].icon}</a>
            <button class="bottom-nav-item" id="bottom-create-btn">${navItems[5].icon}</button>
            <a href="messages.html" class="bottom-nav-item ${activePage === 'messages' ? 'active' : ''}">${navItems[3].icon}</a>
            <a href="profile.html" class="bottom-nav-item ${activePage === 'profile' ? 'active' : ''}">${navItems[6].icon}</a>
        `;
    }

    if (mobileTopbar) {
        mobileTopbar.innerHTML = `
            <a href="index.html" class="brand-logo" style="font-size: 22px;">
                <span class="brand-icon-gradient" style="padding: 4px; border-radius: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path></svg>
                </span>
                <span>InstaVibe</span>
            </a>
            <div style="display: flex; gap: 14px; align-items: center;">
                <button id="mobile-notif-btn" style="color: var(--text-primary);">${navItems[4].icon}</button>
                <a href="messages.html" style="color: var(--text-primary);">${navItems[3].icon}</a>
            </div>
        `;
    }

    // Attach core listeners
    document.getElementById("theme-toggle-btn")?.addEventListener("click", toggleTheme);
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
        const confirmed = await showConfirm("Log Out", "Are you sure you want to log out of InstaVibe?", "Log Out", true);
        if (confirmed) {
            try {
                await signOut(auth);
                localStorage.removeItem("instavibe_cached_user");
                showToast("Logged out successfully", "info");
                setTimeout(() => window.location.href = "login.html", 600);
            } catch (err) {
                showToast("Error logging out", "error");
            }
        }
    });

    // Create Modal Listeners
    const triggerCreate = (e) => {
        e.preventDefault();
        const createModal = document.getElementById("create-post-modal");
        if (createModal) {
            createModal.classList.add("active");
        }
    };

    document.getElementById("nav-create")?.addEventListener("click", triggerCreate);
    document.getElementById("bottom-create-btn")?.addEventListener("click", triggerCreate);
}

// Global script bootstrap
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
});
