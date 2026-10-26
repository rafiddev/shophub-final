import { createSlice } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, googleProvider, isFirebaseConfigured, storage, track } from "@/lib/firebase";

// Only plain, serialisable fields go into Redux (never the Firebase User object itself).
export function serializeUser(u) {
  if (!u) return null;
  return {
    uid: u.uid,
    displayName: u.displayName || "",
    email: u.email || "",
    photoURL: u.photoURL || "",
    emailVerified: !!u.emailVerified,
  };
}

// Turns Firebase error codes into messages a customer can understand.
export function authErrorMessage(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
    "auth/cancelled-popup-request": "The Google sign-in window was closed before finishing.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in the Firebase console yet.",
    "auth/unauthorized-domain": "This domain is not authorised in Firebase Auth settings.",
    "auth/requires-recent-login": "Please log in again to do that.",
    "permission-denied": "Firestore denied the request. Check your security rules.",
  };
  return map[code] || err?.message || "Something went wrong. Please try again.";
}

function requireFirebase() {
  if (!isFirebaseConfigured) {
    throw Object.assign(new Error("Firebase is not configured. Add your keys to the .env file first."), {
      code: "app/not-configured",
    });
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, ready: false, profile: null },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAuthReady: (state) => {
      state.ready = true;
    },
    // users/{uid} document from Firestore (address, phone, wishlist, ...). null = not loaded yet.
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
  },
});

export const { setUser, setAuthReady, setProfile } = authSlice.actions;

/* ---------------- thunks (Firebase Auth + Firestore + Storage) ---------------- */

export const registerUser =
  ({ name, email, password }) =>
  async (dispatch) => {
    requireFirebase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(
      doc(db, "users", cred.user.uid),
      { uid: cred.user.uid, displayName: name, email, role: "customer", createdAt: serverTimestamp() },
      { merge: true }
    );
    sendEmailVerification(cred.user).catch(() => {});
    dispatch(setUser(serializeUser(auth.currentUser)));
    track("sign_up", { method: "password" });
  };

export const loginUser =
  ({ email, password }) =>
  async () => {
    requireFirebase();
    await signInWithEmailAndPassword(auth, email, password);
    track("login", { method: "password" });
  };

// "Username or email" sign-in.
//  - An email goes straight to Firebase Auth.
//  - The demo username "rafid" is checked locally (see DEMO_ACCOUNT below).
//  - Any other username (for example the DummyJSON user "emilys") is checked with the DummyJSON auth API
//    first. Its profile (email, name, photo) then becomes a real Firebase account, created
//    the first time, so orders and the wishlist are saved in Firestore like for any customer.
// The built-in demo account shown on the login page. Firebase needs passwords of 6+ characters,
// so the short demo password is mapped to a longer internal one that users never see.
export const DEMO_ACCOUNT = { username: "rafid", password: "rafs" };
export const DEMO_EMAIL_DOMAIN = "@demo.shophub.app";
const DEMO_PROFILE = {
  name: "Rafid",
  email: `rafid${DEMO_EMAIL_DOMAIN}`,
  firebasePassword: "shophub-demo-rafid-2026",
};

async function loginDemoAccount(dispatch) {
  const { email, firebasePassword: password, name } = DEMO_PROFILE;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code !== "auth/user-not-found" && err.code !== "auth/invalid-credential") throw err;
    // First time the demo account is used: create it in Firebase.
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(
      doc(db, "users", cred.user.uid),
      { uid: cred.user.uid, displayName: name, email, role: "customer", demo: true, createdAt: serverTimestamp() },
      { merge: true }
    );
    dispatch(setUser(serializeUser(auth.currentUser)));
  }
  track("login", { method: "demo" });
}

export const loginWithIdentifier =
  ({ identifier, password }) =>
  async (dispatch) => {
    requireFirebase();
    const id = identifier.trim();
    if (id.includes("@")) return dispatch(loginUser({ email: id, password }));

    // The demo account (rafid / rafs) is handled here, not by DummyJSON.
    if (id.toLowerCase() === DEMO_ACCOUNT.username) {
      if (password !== DEMO_ACCOUNT.password) throw new Error("Incorrect username or password.");
      return loginDemoAccount(dispatch);
    }

    let info;
    try {
      const res = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: id, password, expiresInMins: 1 }),
      });
      if (!res.ok) throw Object.assign(new Error("Incorrect username or password."), { code: "app/bad-credentials" });
      info = await res.json();
    } catch (err) {
      if (err.code === "app/bad-credentials") throw err;
      throw new Error("Could not reach the demo login service. Check your connection and try again.");
    }

    const email = info.email;
    const name = [info.firstName, info.lastName].filter(Boolean).join(" ") || id;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code !== "auth/user-not-found" && err.code !== "auth/invalid-credential") throw err;
      // First time this demo user logs in: create the Firebase account.
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr) {
        if (createErr.code === "auth/email-already-in-use") {
          throw new Error("Incorrect username or password.");
        }
        throw createErr;
      }
      await updateProfile(cred.user, { displayName: name, photoURL: info.image || null });
      await setDoc(
        doc(db, "users", cred.user.uid),
        { uid: cred.user.uid, displayName: name, email, photoURL: info.image || "", role: "customer", demo: true, createdAt: serverTimestamp() },
        { merge: true }
      );
      dispatch(setUser(serializeUser(auth.currentUser)));
    }
    track("login", { method: "username" });
  };

export const loginWithGoogle = () => async () => {
  requireFirebase();
  const cred = await signInWithPopup(auth, googleProvider);
  const isNew = getAdditionalUserInfo(cred)?.isNewUser;
  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      uid: cred.user.uid,
      displayName: cred.user.displayName || "",
      email: cred.user.email || "",
      photoURL: cred.user.photoURL || "",
      lastLoginAt: serverTimestamp(),
      ...(isNew ? { role: "customer", createdAt: serverTimestamp() } : {}),
    },
    { merge: true }
  );
  track(isNew ? "sign_up" : "login", { method: "google" });
};

export const logoutUser = () => async () => {
  if (auth) await signOut(auth);
};

export const sendReset = (email) => async () => {
  requireFirebase();
  await sendPasswordResetEmail(auth, email);
};

export const resendVerification = () => async () => {
  requireFirebase();
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
};

export const saveProfile =
  ({ displayName, phone, address }) =>
  async (dispatch) => {
    requireFirebase();
    const current = auth.currentUser;
    if (!current) throw new Error("You need to be logged in.");
    if (displayName && displayName !== current.displayName) {
      await updateProfile(current, { displayName });
      dispatch(setUser(serializeUser(current)));
    }
    await setDoc(
      doc(db, "users", current.uid),
      { displayName: displayName || current.displayName || "", phone: phone || "", address: address || {}, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

// Firebase Storage: profile photo at avatars/{uid}
export const uploadAvatar = (file) => async (dispatch) => {
  requireFirebase();
  const current = auth.currentUser;
  if (!current) throw new Error("You need to be logged in.");
  if (!storage) throw new Error("Firebase Storage is not set up. Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to .env.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Image must be smaller than 2 MB.");
  const fileRef = ref(storage, `avatars/${current.uid}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  await updateProfile(current, { photoURL: url });
  await setDoc(doc(db, "users", current.uid), { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });
  dispatch(setUser(serializeUser(current)));
};

export default authSlice.reducer;
