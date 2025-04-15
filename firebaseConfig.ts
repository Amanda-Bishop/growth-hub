// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import app from "@react-native-firebase/app"; // ✅ Replaces `firebase/app`
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getAuth, initializeAuth, getReactNativePersistence, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// import auth from "@react-native-firebase/auth"; // ✅ Use React Native Firebase Auth

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoCuftVgvA9G21vJjArCal0Bc4UtFO1JQ",
  authDomain: "growthhub-52a60.firebaseapp.com",
  projectId: "growthhub-52a60",
  storageBucket: "growthhub-52a60.firebasestorage.app",
  messagingSenderId: "1053640708546",
  appId: "1:1053640708546:web:c196d5269bdceafaf4865b",
  measurementId: "G-N1DEFG1RV8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app); // use 'db' for firestore calls
// const auth = getAuth(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage), // ✅ Enables session persistence
});


// const saveUserSession = async (user: User | null) => {
//   if (user) {
//     await AsyncStorage.setItem("user", JSON.stringify(user));
//   } else {
//     await AsyncStorage.removeItem("user");
//   }
// };

// // Function to restore user session on app launch
// const restoreUserSession = async () => {
//   const storedUser = await AsyncStorage.getItem("user");
//   return storedUser ? JSON.parse(storedUser) : null;
// };

// // Listen for authentication state changes and save session
// onAuthStateChanged(auth, (user) => {
//   saveUserSession(user);
// });

export { auth, db };
