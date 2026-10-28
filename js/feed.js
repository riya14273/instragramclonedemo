// feed.js - Dynamic feed generation, double tap animations, stories rendering, real-time sync
import { 
    db, 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    isConfigured 
} from "./firebase.js";
import { 
    getStoredPosts, 
    toggleLikePost, 
    addCommentToPost, 
    toggleSavePost, 
    deletePost 
} from "./posts.js";
import { AppState, formatTimeAgo, showToast } from "./app.js";

// Starter Demo Stories
export const SEED_STORIES = [
    {
        id: "story_1",
        userId: "user_maya",
        username: "maya_lens",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        media: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        caption: "Tropical escape 🌴 Ocean breeze & palm trees",
        timeAgo: "2h ago",
        watched: false
    },
    {
        id: "story_2",
        userId: "user_alex",
        username: "alex_design",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
        media: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        caption: "Late night coding session 💻 Building something cool!",
        timeAgo: "4h ago",
        watched: false
    },
    {
        id: "story_3",
        userId: "user_chloe",
        username: "chloe_bakes",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
        media: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        caption: "Fresh French croissants out of the oven! 🥐",
        timeAgo: "6h ago",
        watched: true
    },
    {
        id: "story_4",
        userId: "user_sam",
        username: "samuel_peaks",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
        media: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
        caption: "Summit views at 4000 meters. The hike was worth it! 🏔️",
        timeAgo: "11h ago",
        watched: false
    }
];

// Render Stories Strip
export function renderStories(containerId = "stories-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const user = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    const userAvatar = user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

    let html = `
        <!-- Current User Add Story Item -->
        <div class="story-item" id="add-story-btn">
            <div class="story-ring" style="background: none; position: relative;">
                <img src="${userAvatar}" alt="Your story" />
                <div class="story-add-badge">+</div>
            </div>
            <span class="story-user">Your story</span>
        </div>
    `;

    SEED_STORIES.forEach((story, index) => {
        html += `
            <div class="story-item" data-story-index="${index}">
                <div class="story-ring ${story.watched ? 'watched' : ''}">
                    <img src="${story.avatar}" alt="${story.username}" />
                </div>
                <span class="story-user">${story.username}</span>
            </div>
        `;
    });

    container.innerHTML = html;

    // Attach click events to open Story Viewer
    container.querySelectorAll(".story-item[data-story-index]").forEach(el => {
        el.addEventListener("click", () => {
            const index = parseInt(el.getAttribute("data-story-index"), 10);
            openStoryModal(SEED_STORIES[index]);
        });
    });

    document.getElementById("add-story-btn")?.addEventListener("click", () => {
        showToast("Create a story feature: select a media or snap a photo!", "info");
        document.getElementById("story-upload-input")?.click();
    });
}

// Story Viewer Modal Controller
export function openStoryModal(story) {
    let modal = document.getElementById("story-viewer-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "story-viewer-modal";
        modal.className = "modal-overlay";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-card" style="max-width: 420px; height: 90vh; background: #000; border-radius: 20px; position: relative; overflow: hidden; display: flex; flex-direction: column;">
            <!-- Progress Bar -->
            <div style="position: absolute; top: 10px; left: 12px; right: 12px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden; z-index: 10;">
                <div id="story-progress-bar" style="width: 0%; height: 100%; background: #fff; transition: width 4.8s linear;"></div>
            </div>

            <!-- Story Header -->
            <div style="position: absolute; top: 22px; left: 14px; right: 14px; display: flex; align-items: center; justify-content: space-between; z-index: 10; color: #fff;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${story.avatar}" style="width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid #fff; object-fit: cover;" />
                    <div>
                        <span style="font-weight: 700; font-size: 14px; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">${story.username}</span>
                        <span style="font-size: 11px; opacity: 0.8; margin-left: 6px;">${story.timeAgo}</span>
                    </div>
                </div>
                <button id="close-story-viewer" style="color: #fff; font-size: 22px; padding: 4px;">&times;</button>
            </div>

            <!-- Media Content -->
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative;">
                <img src="${story.media}" style="width: 100%; height: 100%; object-fit: cover;" alt="Story" />
                <div style="position: absolute; bottom: 80px; left: 16px; right: 16px; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,0.8); font-size: 14px; font-weight: 500;">
                    ${story.caption}
                </div>
            </div>

            <!-- Bottom Reply Bar -->
            <div style="padding: 14px 16px; display: flex; gap: 10px; align-items: center; z-index: 10; background: linear-gradient(transparent, rgba(0,0,0,0.8));">
                <input type="text" placeholder="Reply to ${story.username}..." style="flex: 1; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 20px; padding: 8px 14px; font-size: 13px;" id="story-reply-input" />
                <button id="story-send-reply" style="color: #fff; font-weight: bold; font-size: 14px;">Send</button>
            </div>
        </div>
    `;

    modal.classList.add("active");

    // Animate progress
    setTimeout(() => {
        const bar = document.getElementById("story-progress-bar");
        if (bar) bar.style.width = "100%";
    }, 50);

    const timer = setTimeout(() => {
        modal.classList.remove("active");
    }, 5000);

    const closeBtn = document.getElementById("close-story-viewer");
    closeBtn?.addEventListener("click", () => {
        clearTimeout(timer);
        modal.classList.remove("active");
    });

    document.getElementById("story-send-reply")?.addEventListener("click", () => {
        const input = document.getElementById("story-reply-input");
        if (input && input.value.trim()) {
            showToast(`Reply sent to ${story.username}!`, "success");
            input.value = "";
            clearTimeout(timer);
            modal.classList.remove("active");
        }
    });
}

// Fetch Posts (from Firestore if configured, else from local mock storage)
export async function fetchFeedPosts() {
    if (!isConfigured()) {
        return getStoredPosts();
    }

    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(20));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return getStoredPosts();
        }

        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        return posts;
    } catch (err) {
        console.warn("Firestore fetch error, falling back to local posts:", err);
        return getStoredPosts();
    }
}

// Render Feed Posts into container
export async function renderFeed(containerId = "feed-posts-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show initial skeleton loading state
    container.innerHTML = `
        <div class="post-card" style="padding: 16px; gap: 12px;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                <div class="skeleton" style="width: 120px; height: 16px;"></div>
            </div>
            <div class="skeleton" style="width: 100%; height: 380px; border-radius: 10px;"></div>
        </div>
    `;

    const posts = await fetchFeedPosts();
    const currentUserId = AppState.currentUser?.uid || JSON.parse(localStorage.getItem("instavibe_current_user") || "{}").uid;
    const savedPosts = JSON.parse(localStorage.getItem("instavibe_saved_posts") || "[]");

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <h3>No Posts Yet</h3>
                <p>Be the first to share an inspiring moment on InstaVibe!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    posts.forEach(post => {
        const isLiked = post.likedBy?.includes(currentUserId);
        const isSaved = savedPosts.includes(post.id);
        const isAuthor = currentUserId && post.userId === currentUserId;

        const postEl = document.createElement("article");
        postEl.className = "post-card";
        postEl.id = `post-${post.id}`;

        const postMediaHtml = post.mediaType === "video" 
            ? `<video src="${post.mediaUrl}" controls playsinline class="post-media"></video>`
            : `<img src="${post.mediaUrl}" alt="${post.altText || post.caption || 'Post image'}" class="post-media" loading="lazy" />`;

        postEl.innerHTML = `
            <!-- Header -->
            <div class="post-header">
                <a href="profile.html?user=${post.username}" class="post-author">
                    <img src="${post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" class="author-avatar" alt="${post.username}" />
                    <div class="author-info">
                        <span class="author-username">${post.username}</span>
                        <span class="post-time">${formatTimeAgo(post.createdAt)}</span>
                    </div>
                </a>
                <div class="post-options-dropdown">
                    <button class="post-options-trigger" style="color: var(--text-secondary); padding: 4px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                    </button>
                    ${isAuthor ? `<button class="delete-post-btn" style="color: var(--danger); font-size: 12px; margin-left: 8px; font-weight: 600;">Delete</button>` : ''}
                </div>
            </div>

            <!-- Media Container with double-tap like heart -->
            <div class="post-media-container" data-post-id="${post.id}">
                ${postMediaHtml}
                <div class="double-tap-heart">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="#ed4956" stroke="#ed4956" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="post-actions">
                <div class="action-group">
                    <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? '#ed4956' : 'none'}" stroke="${isLiked ? '#ed4956' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </button>
                    <button class="action-btn share-btn" data-post-id="${post.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
                <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" data-post-id="${post.id}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </button>
            </div>

            <!-- Details: Likes, Caption, Comments -->
            <div class="post-details">
                <span class="likes-count" id="likes-count-${post.id}">${post.likesCount || 0} likes</span>
                <div class="post-caption">
                    <a href="profile.html?user=${post.username}" class="caption-user">${post.username}</a>
                    <span>${post.caption || ''}</span>
                    ${post.tags && post.tags.length > 0 ? `<div class="post-tags">${post.tags.join(' ')}</div>` : ''}
                </div>

                <!-- Recent Comments Preview -->
                <div class="recent-comments" id="comments-list-${post.id}">
                    ${(post.comments || []).slice(-2).map(c => `
                        <div class="comment-row">
                            <span class="comment-content"><span class="comment-user">${c.username}</span>${c.text}</span>
                        </div>
                    `).join('')}
                </div>

                ${(post.commentsCount || 0) > 2 ? `<div class="view-comments-btn">View all ${post.commentsCount} comments</div>` : ''}
            </div>

            <!-- Add Comment Input Box -->
            <form class="post-add-comment" data-post-id="${post.id}">
                <input type="text" class="comment-input" placeholder="Add a comment for ${post.username}..." />
                <button type="submit" class="comment-submit-btn">Post</button>
            </form>
        `;

        container.appendChild(postEl);

        // Bind interactive events for this post
        bindPostEvents(postEl, post);
    });
}

// Bind Like, Double-tap, Comment, Save, Delete
function bindPostEvents(postEl, post) {
    const mediaContainer = postEl.querySelector(".post-media-container");
    const likeBtn = postEl.querySelector(".like-btn");
    const likesCountEl = postEl.querySelector(`#likes-count-${post.id}`);
    const doubleHeart = postEl.querySelector(".double-tap-heart");
    const saveBtn = postEl.querySelector(".save-btn");
    const shareBtn = postEl.querySelector(".share-btn");
    const commentForm = postEl.querySelector(".post-add-comment");
    const commentInput = postEl.querySelector(".comment-input");
    const commentSubmitBtn = postEl.querySelector(".comment-submit-btn");
    const deleteBtn = postEl.querySelector(".delete-post-btn");

    // Double tap on media to like
    let lastTap = 0;
    mediaContainer.addEventListener("click", async () => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            // Double tap triggered
            doubleHeart.classList.add("animate");
            setTimeout(() => doubleHeart.classList.remove("animate"), 800);
            
            const result = await toggleLikePost(post.id);
            if (result) {
                updateLikeUI(likeBtn, likesCountEl, result.isLiked, result.likesCount);
            }
        }
        lastTap = currentTime;
    });

    // Single click like button
    likeBtn.addEventListener("click", async () => {
        const result = await toggleLikePost(post.id);
        if (result) {
            updateLikeUI(likeBtn, likesCountEl, result.isLiked, result.likesCount);
        }
    });

    // Bookmark / Save
    saveBtn.addEventListener("click", () => {
        const isSaved = toggleSavePost(post.id);
        saveBtn.classList.toggle("saved", isSaved);
        const svg = saveBtn.querySelector("svg");
        svg.setAttribute("fill", isSaved ? "currentColor" : "none");
    });

    // Share link
    shareBtn.addEventListener("click", () => {
        if (navigator.share) {
            navigator.share({
                title: `Post by @${post.username} on InstaVibe`,
                text: post.caption,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard! 📋", "info");
        }
    });

    // Comment input active state
    commentInput.addEventListener("input", () => {
        if (commentInput.value.trim().length > 0) {
            commentSubmitBtn.classList.add("active");
        } else {
            commentSubmitBtn.classList.remove("active");
        }
    });

    // Add comment
    commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const newComment = await addCommentToPost(post.id, text);
        if (newComment) {
            const commentsList = postEl.querySelector(`#comments-list-${post.id}`);
            const row = document.createElement("div");
            row.className = "comment-row";
            row.innerHTML = `<span class="comment-content"><span class="comment-user">${newComment.username}</span>${newComment.text}</span>`;
            commentsList.appendChild(row);

            commentInput.value = "";
            commentSubmitBtn.classList.remove("active");
            showToast("Comment posted!", "success");
        }
    });

    // Delete Post
    deleteBtn?.addEventListener("click", async () => {
        const deleted = await deletePost(post.id, post.userId);
        if (deleted) {
            postEl.remove();
        }
    });
}

function updateLikeUI(btn, countEl, isLiked, likesCount) {
    btn.classList.toggle("liked", isLiked);
    const svg = btn.querySelector("svg");
    svg.setAttribute("fill", isLiked ? "#ed4956" : "none");
    svg.setAttribute("stroke", isLiked ? "#ed4956" : "currentColor");
    countEl.textContent = `${likesCount} likes`;
}
