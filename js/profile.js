// profile.js - User Profile view, Follow/Unfollow, Edit Profile, Grid View & Saved Posts
import { 
    db, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    increment,
    serverTimestamp,
    isConfigured
} from "./firebase.js";
import { AppState, showToast, showConfirm } from "./app.js";
import { getStoredPosts, uploadMediaFile } from "./posts.js";

// Fetch user profile by username or UID
export async function fetchUserProfile(usernameOrUid) {
    if (!usernameOrUid) {
        return AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    }

    if (!isConfigured()) {
        const mockUsers = JSON.parse(localStorage.getItem("instavibe_mock_users") || "[]");
        const found = mockUsers.find(u => u.username === usernameOrUid || u.uid === usernameOrUid);
        if (found) return found;

        // Check if current user
        const curr = JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
        if (curr && (curr.username === usernameOrUid || curr.uid === usernameOrUid)) return curr;

        // Fallback default sample profile
        return {
            uid: "demo_profile_user",
            fullName: usernameOrUid.replace('_', ' ').toUpperCase(),
            username: usernameOrUid,
            bio: "Visual artist & digital creator exploring creative expressions 🎨📸",
            photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
            postsCount: 3,
            followersCount: 1420,
            followingCount: 380,
            isPrivate: false
        };
    }

    // Try finding by username query
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", usernameOrUid.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
        return snap.docs[0].data();
    }

    // Otherwise try UID doc lookup
    const docSnap = await getDoc(doc(db, "users", usernameOrUid));
    if (docSnap.exists()) {
        return docSnap.data();
    }

    return null;
}

// Fetch posts created by a specific user
export async function fetchUserPosts(userId, username) {
    if (!isConfigured()) {
        const allPosts = getStoredPosts();
        return allPosts.filter(p => p.userId === userId || p.username === username);
    }

    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("username", "==", username), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const posts = [];
        snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
        return posts;
    } catch (e) {
        console.warn("Could not load user posts from firestore:", e);
        const allPosts = getStoredPosts();
        return allPosts.filter(p => p.username === username);
    }
}

// Toggle Follow/Unfollow user
export async function toggleFollowUser(targetUserId, targetUsername) {
    const currentUser = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!currentUser) {
        showToast("Please log in to follow creators", "error");
        return null;
    }

    const followKey = `instavibe_following_${currentUser.uid}`;
    const following = JSON.parse(localStorage.getItem(followKey) || "[]");
    const index = following.indexOf(targetUserId || targetUsername);
    let isFollowing = false;

    if (index > -1) {
        following.splice(index, 1);
        isFollowing = false;
        showToast(`Unfollowed @${targetUsername}`, "info");
    } else {
        following.push(targetUserId || targetUsername);
        isFollowing = true;
        showToast(`Following @${targetUsername}! 🎉`, "success");
    }

    localStorage.setItem(followKey, JSON.stringify(following));

    if (isConfigured()) {
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                followingCount: increment(isFollowing ? 1 : -1)
            });
            if (targetUserId) {
                const targetRef = doc(db, "users", targetUserId);
                await updateDoc(targetRef, {
                    followersCount: increment(isFollowing ? 1 : -1)
                });
            }
        } catch (e) {
            console.warn("Follow count firestore update error:", e);
        }
    }

    return isFollowing;
}

// Check if currently following
export function isCurrentlyFollowing(targetUserId, targetUsername) {
    const currentUser = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!currentUser) return false;
    const followKey = `instavibe_following_${currentUser.uid}`;
    const following = JSON.parse(localStorage.getItem(followKey) || "[]");
    return following.includes(targetUserId) || following.includes(targetUsername);
}

// Update User Profile details (Bio, Name, Avatar)
export async function updateCurrentUserProfile({ fullName, bio, website, avatarFile }) {
    const currentUser = AppState.userProfile || JSON.parse(localStorage.getItem("instavibe_current_user") || "null");
    if (!currentUser) throw new Error("No active user session");

    let newPhotoURL = currentUser.photoURL;
    if (avatarFile) {
        const uploadRes = await uploadMediaFile(avatarFile, "avatars");
        newPhotoURL = uploadRes.url;
    }

    const updatedData = {
        ...currentUser,
        fullName: fullName.trim(),
        bio: bio.trim(),
        website: website ? website.trim() : "",
        photoURL: newPhotoURL,
        updatedAt: isConfigured() ? serverTimestamp() : new Date().toISOString()
    };

    if (!isConfigured()) {
        localStorage.setItem("instavibe_current_user", JSON.stringify(updatedData));
        AppState.userProfile = updatedData;
        showToast("Profile updated successfully!", "success");
        return updatedData;
    }

    await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: fullName.trim(),
        bio: bio.trim(),
        website: website ? website.trim() : "",
        photoURL: newPhotoURL,
        updatedAt: serverTimestamp()
    });

    AppState.userProfile = updatedData;
    showToast("Profile changes saved to cloud!", "success");
    return updatedData;
}
