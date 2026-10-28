// posts.js - Post creation, Likes, Comments, Bookmarks, and Media handling
import { 
    db, 
    storage, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp,
    increment,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    isConfigured
} from "./firebase.js";
import { AppState, showToast, showConfirm } from "./app.js";

// Sample starter posts for demo/fresh setups
export const SEED_POSTS = [
    {
        id: "seed_post_1",
        userId: "demo_creator_1",
        username: "elena_vibes",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        mediaUrl: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1000&q=80",
        mediaType: "image",
        caption: "Golden sunsets over the coastline 🌊🌅 Taking in every second of this evening magic. What's your favorite golden hour spot?",
        tags: ["#sunset", "#beachlife", "#goldenhour", "#vibes"],
        likesCount: 238,
        likedBy: [],
        commentsCount: 14,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        comments: [
            { id: "c1", username: "marcus_art", text: "The tones in this shot are absolutely breathtaking! 🔥", createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: "c2", username: "sarah_travels", text: "Pure serenity! Which camera did you use?", createdAt: new Date(Date.now() - 1800000).toISOString() }
        ]
    },
    {
        id: "seed_post_2",
        userId: "demo_creator_2",
        username: "urban_architect",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        mediaUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
        mediaType: "image",
        caption: "Minimalist geometry in modern Scandinavian interior design. Light, space, and harmony 📐✨",
        tags: ["#architecture", "#minimalism", "#design", "#aesthetic"],
        likesCount: 512,
        likedBy: [],
        commentsCount: 28,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        comments: [
            { id: "c3", username: "sophia_c", text: "That warm wooden accent elevates the whole room!", createdAt: new Date(Date.now() - 7200000).toISOString() }
        ]
    },
    {
        id: "seed_post_3",
        userId: "demo_creator_3",
        username: "foodie_chef_leo",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        mediaUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80",
        mediaType: "image",
        caption: "Handmade sourdough pizza straight from the wood-fired stone oven. 48hr fermentation = crunchy crust & airy crumb 🍕🔥",
        tags: ["#pizza", "#foodlover", "#culinaryart", "#instafood"],
        likesCount: 891,
        likedBy: [],
        commentsCount: 45,
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        comments: [
            { id: "c4", username: "elena_vibes", text: "Save me a slice please! 🤤", createdAt: new Date(Date.now() - 3600000 * 10).toISOString() }
        ]
    }
];

// Initialize local posts if needed
export function getStoredPosts() {
    const raw = localStorage.getItem("instavibe_posts");
    if (!raw) {
        localStorage.setItem("instavibe_posts", JSON.stringify(SEED_POSTS));
        return SEED_POSTS;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return SEED_POSTS;
    }
}

export function saveStoredPosts(posts) {
    localStorage.setItem("instavibe_posts", JSON.stringify(posts));
}

// Upload Media to Firebase Storage (or convert to base64 for demo mode)
export async function uploadMediaFile(file, folder = "posts") {
    if (!file) throw new Error("No file selected");

    // File validation: Images & MP4 videos up to 25MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
        throw new Error("Unsupported format. Please upload JPG, PNG, WEBP, or MP4 video.");
    }

    if (file.size > 25 * 1024 * 1024) {
        throw new Error("File exceeds 25MB size limit.");
    }

    if (!isConfigured()) {
        // Return base64 for demo/offline operation
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: reader.result, type: file.type.startsWith("video") ? "video" : "image" });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Real Firebase Storage upload
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                const progressBar = document.getElementById("upload-progress-fill");
                if (progressBar) progressBar.style.width = `${progress}%`;
            },
            (error) => reject(error),
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                    url: downloadUrl,
                    type: file.type.startsWith("video") ? "video" : "image"
                });
            }
        );
    });
}

// Create a New Post
export async function createPost({ mediaFile, caption, tags = [], altText = "" }) {
    const user = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!user) throw new Error("You must be logged in to create a post.");

    const { url, type } = await uploadMediaFile(mediaFile, "posts");

    // Extract hashtags from caption if not explicitly provided
    const extractedTags = caption.match(/#[a-zA-Z0-9_]+/g) || tags;

    const newPostData = {
        userId: user.uid,
        username: user.username,
        userAvatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        mediaUrl: url,
        mediaType: type,
        caption: caption.trim(),
        tags: extractedTags,
        altText: altText.trim(),
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        comments: [],
        createdAt: isConfigured() ? serverTimestamp() : new Date().toISOString()
    };

    if (!isConfigured()) {
        const posts = getStoredPosts();
        const createdPost = { ...newPostData, id: "post_" + Date.now() };
        posts.unshift(createdPost);
        saveStoredPosts(posts);
        showToast("Post shared successfully!", "success");
        return createdPost;
    }

    const docRef = await addDoc(collection(db, "posts"), newPostData);
    // Increment post count in user's profile
    try {
        await updateDoc(doc(db, "users", user.uid), {
            postsCount: increment(1)
        });
    } catch (e) {
        console.warn("Could not increment user post count:", e);
    }

    showToast("Post published to your feed!", "success");
    return { ...newPostData, id: docRef.id };
}

// Toggle Like / Unlike Post
export async function toggleLikePost(postId) {
    const user = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!user) {
        showToast("Please log in to like posts", "error");
        return null;
    }

    if (!isConfigured()) {
        const posts = getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return null;

        if (!post.likedBy) post.likedBy = [];
        const index = post.likedBy.indexOf(user.uid);
        let isLiked = false;

        if (index > -1) {
            post.likedBy.splice(index, 1);
            post.likesCount = Math.max(0, post.likesCount - 1);
            isLiked = false;
        } else {
            post.likedBy.push(user.uid);
            post.likesCount += 1;
            isLiked = true;
        }
        saveStoredPosts(posts);
        return { isLiked, likesCount: post.likesCount };
    }

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return null;

    const data = postSnap.data();
    const likedBy = data.likedBy || [];
    const isLiked = likedBy.includes(user.uid);

    if (isLiked) {
        await updateDoc(postRef, {
            likesCount: increment(-1),
            likedBy: likedBy.filter(id => id !== user.uid)
        });
        return { isLiked: false, likesCount: Math.max(0, (data.likesCount || 1) - 1) };
    } else {
        await updateDoc(postRef, {
            likesCount: increment(1),
            likedBy: [...likedBy, user.uid]
        });
        // Create notification for post owner if not self
        if (data.userId !== user.uid) {
            try {
                await addDoc(collection(db, "notifications"), {
                    recipientId: data.userId,
                    senderId: user.uid,
                    senderUsername: user.username,
                    senderAvatar: user.photoURL,
                    type: "like",
                    postId: postId,
                    postImage: data.mediaUrl,
                    createdAt: serverTimestamp(),
                    isRead: false
                });
            } catch (err) {
                console.warn("Could not save like notification:", err);
            }
        }
        return { isLiked: true, likesCount: (data.likesCount || 0) + 1 };
    }
}

// Add Comment to Post
export async function addCommentToPost(postId, commentText) {
    if (!commentText || !commentText.trim()) return null;
    const user = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!user) {
        showToast("Please log in to comment", "error");
        return null;
    }

    const commentData = {
        id: "comm_" + Date.now(),
        userId: user.uid,
        username: user.username,
        userAvatar: user.photoURL,
        text: commentText.trim(),
        createdAt: isConfigured() ? serverTimestamp() : new Date().toISOString()
    };

    if (!isConfigured()) {
        const posts = getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            if (!post.comments) post.comments = [];
            post.comments.push(commentData);
            post.commentsCount = (post.commentsCount || 0) + 1;
            saveStoredPosts(posts);
            return commentData;
        }
        return null;
    }

    const postRef = doc(db, "posts", postId);
    await addDoc(collection(db, `posts/${postId}/comments`), commentData);
    await updateDoc(postRef, {
        commentsCount: increment(1)
    });

    return commentData;
}

// Delete Post (Only if post owner)
export async function deletePost(postId, postUserId) {
    const user = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!user || user.uid !== postUserId) {
        showToast("You are not authorized to delete this post.", "error");
        return false;
    }

    const confirmed = await showConfirm("Delete Post", "Are you sure you want to delete this post? This cannot be undone.", "Delete", true);
    if (!confirmed) return false;

    if (!isConfigured()) {
        let posts = getStoredPosts();
        posts = posts.filter(p => p.id !== postId);
        saveStoredPosts(posts);
        showToast("Post deleted", "info");
        return true;
    }

    await deleteDoc(doc(db, "posts", postId));
    // Decrement post count
    try {
        await updateDoc(doc(db, "users", user.uid), {
            postsCount: increment(-1)
        });
    } catch (e) {
        console.warn("Could not decrement user post count:", e);
    }

    showToast("Post deleted successfully", "info");
    return true;
}

// Save/Bookmark Post
export function toggleSavePost(postId) {
    const saved = JSON.parse(localStorage.getItem("instavibe_saved_posts") || "[]");
    const index = saved.indexOf(postId);
    let isSaved = false;

    if (index > -1) {
        saved.splice(index, 1);
        isSaved = false;
        showToast("Removed from saved posts", "info");
    } else {
        saved.push(postId);
        isSaved = true;
        showToast("Saved to your collection", "success");
    }
    localStorage.setItem("instavibe_saved_posts", JSON.stringify(saved));
    return isSaved;
}
