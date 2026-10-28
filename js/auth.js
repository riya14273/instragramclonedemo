// auth.js - Authentication handler: Signup, Login, Password Reset, Username Validation
import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    updateProfile,
    doc, 
    setDoc, 
    getDoc, 
    getDocs,
    collection, 
    query, 
    where, 
    serverTimestamp,
    isConfigured
} from "./firebase.js";
import { showToast, AppState } from "./app.js";

// Check if username already exists in Firestore
export async function isUsernameTaken(username) {
    if (!username) return false;
    const cleanUsername = username.trim().toLowerCase();
    
    // Check local mock cache or firestore
    if (!isConfigured()) {
        const localMockUsers = JSON.parse(localStorage.getItem("instavibe_mock_users") || "[]");
        return localMockUsers.some(u => u.username.toLowerCase() === cleanUsername);
    }

    try {
        const q = query(collection(db, "users"), where("username", "==", cleanUsername));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (err) {
        console.warn("Username query check fallback:", err);
        return false;
    }
}

// User Sign Up
export async function handleSignUp({ name, username, email, password }) {
    const cleanUsername = username.trim().toLowerCase();
    
    if (cleanUsername.length < 3) {
        throw new Error("Username must be at least 3 characters long");
    }

    if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
        throw new Error("Username can only contain letters, numbers, periods, and underscores");
    }

    const taken = await isUsernameTaken(cleanUsername);
    if (taken) {
        throw new Error("Username is already taken. Please pick another one.");
    }

    // Default high-res trendy avatar
    const defaultAvatar = `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&w=250&q=80`;

    if (!isConfigured()) {
        // Offline / Demo mode simulation so app is 100% testable right away
        const mockUid = "demo_user_" + Date.now();
        const mockUserData = {
            uid: mockUid,
            fullName: name.trim(),
            username: cleanUsername,
            email: email.trim().toLowerCase(),
            photoURL: defaultAvatar,
            bio: "Welcome to my creative space on InstaVibe! ✨",
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date().toISOString()
        };

        const existingMockUsers = JSON.parse(localStorage.getItem("instavibe_mock_users") || "[]");
        existingMockUsers.push(mockUserData);
        localStorage.setItem("instavibe_mock_users", JSON.stringify(existingMockUsers));
        localStorage.setItem("instavibe_current_user", JSON.stringify(mockUserData));
        showToast("Signed up successfully in demo mode!", "success");
        return mockUserData;
    }

    // Real Firebase Authentication execution
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase display name & avatar
    await updateProfile(user, {
        displayName: name.trim(),
        photoURL: defaultAvatar
    });

    // Create Firestore User Document
    const userDocData = {
        uid: user.uid,
        fullName: name.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        photoURL: defaultAvatar,
        bio: "Hey there! I am using InstaVibe ✨",
        website: "",
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        isPrivate: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), userDocData);
    showToast("Account created successfully! Welcome to InstaVibe.", "success");
    return userDocData;
}

// User Log In
export async function handleLogin(emailOrUsername, password) {
    if (!emailOrUsername || !password) {
        throw new Error("Please fill in all required fields.");
    }

    if (!isConfigured()) {
        // Offline demo login fallback
        const existingMockUsers = JSON.parse(localStorage.getItem("instavibe_mock_users") || "[]");
        const found = existingMockUsers.find(u => 
            u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
            u.username.toLowerCase() === emailOrUsername.toLowerCase()
        );

        if (found) {
            localStorage.setItem("instavibe_current_user", JSON.stringify(found));
            showToast("Welcome back, @" + found.username, "success");
            return found;
        } else {
            // Create a default session
            const guestUser = {
                uid: "user_guest_" + Date.now(),
                fullName: emailOrUsername.includes("@") ? emailOrUsername.split("@")[0] : emailOrUsername,
                username: emailOrUsername.includes("@") ? emailOrUsername.split("@")[0] : emailOrUsername,
                email: emailOrUsername.includes("@") ? emailOrUsername : `${emailOrUsername}@instavibe.test`,
                photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
                bio: "Exploring the vibrant InstaVibe community 📸",
                postsCount: 2,
                followersCount: 142,
                followingCount: 88,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem("instavibe_current_user", JSON.stringify(guestUser));
            showToast("Welcome to InstaVibe Demo Mode!", "success");
            return guestUser;
        }
    }

    let targetEmail = emailOrUsername.trim();

    // If username was entered instead of email, resolve email from Firestore
    if (!targetEmail.includes("@")) {
        const q = query(collection(db, "users"), where("username", "==", targetEmail.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
            throw new Error("No user found with that username.");
        }
        targetEmail = snap.docs[0].data().email;
    }

    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
    showToast("Signed in successfully!", "success");
    return userCredential.user;
}

// Password Reset
export async function handlePasswordReset(email) {
    if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address.");
    }

    if (!isConfigured()) {
        showToast("Password reset link simulated for demo mode.", "info");
        return true;
    }

    await sendPasswordResetEmail(auth, email.trim());
    showToast("Password reset link sent to your email!", "success");
    return true;
}
