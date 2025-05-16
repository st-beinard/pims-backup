// frontend/src/contexts/AuthContext.js
import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig.js'; // Your Firebase services
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // To store Firestore user data

  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update Firebase Auth profile
    await updateProfile(userCredential.user, { displayName });

    // Create user document in Firestore
    const userRef = doc(db, "users", userCredential.user.uid);
    await setDoc(userRef, {
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName,
      role: "Member", // Default role
      createdAt: new Date()
    });
    // Note: currentUser will be set by onAuthStateChanged
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserData(null); // Clear Firestore user data on logout
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Function to fetch user data from Firestore
  async function fetchUserData(userId) {
    if (!userId) {
      setUserData(null);
      return;
    }
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserData({ id: userDocSnap.id, ...userDocSnap.data() });
      } else {
        console.log("No such user document in Firestore!");
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid); // Fetch Firestore data when auth state changes
      } else {
        setUserData(null); // Clear Firestore user data if no user
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    userData, // Expose Firestore user data
    signup,
    login,
    logout,
    resetPassword,
    fetchUserData // Expose fetchUserData if needed elsewhere
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}