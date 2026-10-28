// explore.js - Explore dynamic grid, real-time search, trending tags & suggested creators
import { db, collection, getDocs, query, where, limit, isConfigured } from "./firebase.js";
import { getStoredPosts } from "./posts.js";

// Sample trending exploration data
export const TRENDING_TAGS = [
    { tag: "#photography", postsCount: "420K" },
    { tag: "#design", postsCount: "310K" },
    { tag: "#aesthetic", postsCount: "185K" },
    { tag: "#nature", postsCount: "250K" },
    { tag: "#vibes", postsCount: "95K" },
    { tag: "#digitalart", postsCount: "140K" }
];

export const SUGGESTED_CREATORS = [
    { username: "maya_lens", name: "Maya Visuals", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80", bio: "Visual storyteller & travel lover" },
    { username: "alex_design", name: "Alex Rover", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80", bio: "Product designer & typography enthusiast" },
    { username: "chloe_bakes", name: "Chloe Fontaine", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", bio: "Pastry chef crafting pastry wonders" }
];

// Curated high quality explore posts
export const EXPLORE_GALLERY = [
    { id: "ex_1", mediaUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80", likesCount: 420, commentsCount: 31, username: "cat_aesthetic", caption: "Soft morning light on ginger paws 🐾" },
    { id: "ex_2", mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80", likesCount: 980, commentsCount: 52, username: "mountain_wander", caption: "Reflection over Yosemite waters 🌲" },
    { id: "ex_3", mediaUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80", likesCount: 712, commentsCount: 44, username: "aurora_magic", caption: "Northern lights dancing across Iceland 🌌" },
    { id: "ex_4", mediaUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80", likesCount: 350, commentsCount: 19, username: "tech_workspace", caption: "Minimal mechanical desk setup vibes ⌨️" },
    { id: "ex_5", mediaUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80", likesCount: 630, commentsCount: 27, username: "portrait_mode", caption: "Cinematic portrait in golden afternoon 📸" },
    { id: "ex_6", mediaUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80", likesCount: 880, commentsCount: 63, username: "foggy_forest", caption: "Deep into misty alpine evergreens 🌲" },
    { id: "ex_7", mediaUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80", likesCount: 540, commentsCount: 38, username: "interior_hub", caption: "Modern living room warmth & earthy tones 🛋️" },
    { id: "ex_8", mediaUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80", likesCount: 1120, commentsCount: 89, username: "nature_lens", caption: "Enchanted bridge inside lush greenery 🍃" },
    { id: "ex_9", mediaUrl: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=600&q=80", likesCount: 460, commentsCount: 22, username: "desert_hues", caption: "Vibrant canyon shadows in Utah 🏜️" }
];

// Search creators and tags in database
export async function searchContent(queryTerm) {
    if (!queryTerm || !queryTerm.trim()) return { users: [], posts: [] };
    const term = queryTerm.trim().toLowerCase();

    // Check users
    let users = [];
    if (!isConfigured()) {
        const mockUsers = JSON.parse(localStorage.getItem("instavibe_mock_users") || "[]");
        users = [...mockUsers, ...SUGGESTED_CREATORS].filter(u => 
            u.username.toLowerCase().includes(term) || 
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.fullName && u.fullName.toLowerCase().includes(term))
        );
    } else {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", ">=", term), where("username", "<=", term + '\uf8ff'), limit(10));
            const snap = await getDocs(q);
            snap.forEach(d => users.push(d.data()));
        } catch (e) {
            console.warn("Search users query error:", e);
        }
    }

    // Check posts
    const allPosts = [...getStoredPosts(), ...EXPLORE_GALLERY];
    const posts = allPosts.filter(p => 
        (p.caption && p.caption.toLowerCase().includes(term)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
    );

    return { users, posts };
}
