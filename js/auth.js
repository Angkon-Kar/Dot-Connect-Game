import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGO6_MVzcz7nggQPyEOyeVBQFVayYbVr4",
  authDomain: "akdot-connect-game.firebaseapp.com",
  projectId: "akdot-connect-game",
  storageBucket: "akdot-connect-game.firebasestorage.app",
  messagingSenderId: "769823058031",
  appId: "1:769823058031:web:f45d00b837e2702736859a",
  measurementId: "G-KCLEQPT0SZ"
};


// Global variables for Firebase (will be populated by the environment if available)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, db, auth;
let userId = null;
let isAuthReady = false;

// Initialize Firebase and authenticate
if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            console.log("Firebase authenticated. User ID:", userId);
        } else {
            console.log("No user signed in. Attempting anonymous sign-in or custom token sign-in.");
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    userId = auth.currentUser.uid;
                    console.log("Signed in with custom token. User ID:", userId);
                } else {
                    await signInAnonymously(auth);
                    userId = auth.currentUser.uid;
                    console.log("Signed in anonymously. User ID:", userId);
                }
            } catch (error) {
                console.error("Firebase authentication error:", error);
                showCustomAlert("Authentication failed. Please try again.");
            }
        }
        isAuthReady = true;
        // Update UI with user ID if needed
        const currentUserIdDisplay = document.getElementById('currentUserId');
        if (currentUserIdDisplay) {
            currentUserIdDisplay.textContent = `Your ID: ${userId}`;
        }
        // If we are in the lobby, refresh the game list after auth is ready
        if (!document.getElementById('gameSetup').classList.contains('hidden')) {
            // This is not the lobby, so no need to fetch games here.
            // The lobby screen (onlineLobby) will call fetchAvailableGames when shown.
        }
    });
} else {
    console.warn("Firebase config not found. Online multiplayer will not be available.");
    isAuthReady = true; // Mark auth ready even if not using Firebase
}

// Make Firebase instances and userId globally accessible to the main script
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseAuth = auth;
window.getUserId = () => userId;
window.isAuthReady = () => isAuthReady;
window.onAuthStateChanged = onAuthStateChanged; // Expose for main script if needed
window.getFirestore = getFirestore;
window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.onSnapshot = onSnapshot;
window.collection = collection;
window.query = query;
window.where = where; // Exposed globally
window.addDoc = addDoc;
window.getDocs = getDocs;
window.deleteDoc = deleteDoc;