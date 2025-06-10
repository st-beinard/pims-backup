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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // <<< IMPORTED serverTimestamp

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Renamed from loadingAuth to match your code
  const [userData, setUserData] = useState(null);

  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });

    const userRef = doc(db, "users", userCredential.user.uid);
    // User data to be stored in Firestore
    const newUserDocument = {
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName,
      role: "Team_Member", // <<< CHANGED: Default role to "Team_Member"
      createdAt: serverTimestamp() // <<< SUGGESTION: Use serverTimestamp for consistency
      
    };
    await setDoc(userRef, newUserDocument);
    // userData will be populated by onAuthStateChanged after this, or you can set it here too
    // setUserData(newUserDocument); // This would provide immediate userData but might be slightly out of sync if onAuthStateChanged runs immediately after
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserData(null);
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function fetchUserData(userId) {
    if (!userId) {
      setUserData(null);
      return;
    }
    console.log("AuthContext: Fetching user data for UID:", userId); // Debug log
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.log("AuthContext: User document found:", userDocSnap.data()); // Debug log
        setUserData({ id: userDocSnap.id, ...userDocSnap.data() }); // Storing id as well, which is user.uid
      } else {
        console.warn("AuthContext: No such user document in Firestore for UID:", userId);
        
        const authUser = auth.currentUser;
        if (authUser && authUser.uid === userId) {
            setUserData({
                uid: authUser.uid,
                email: authUser.email,
                displayName: authUser.displayName,
                role: "Team_Member", // Fallback default role
            });
        } else {
            setUserData(null);
        }
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user data:", error);
      setUserData(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: onAuthStateChanged event. User authenticated:", !!user); // Debug log
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false); // Use 'loading' as per your state variable name
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading, // Use 'loading'
    signup,
    login,
    logout,
    resetPassword,
    fetchUserData, 
    setUserData // <<< NEW: Expose setUserData so other components can update context if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}