import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDf_0mYtDIr8b6tbB7FaVy23FPwk-4hoI",
  authDomain: "lotus-training-42c98.firebaseapp.com",
  projectId: "lotus-training-42c98",
  storageBucket: "lotus-training-42c98.firebasestorage.app",
  messagingSenderId: "389828779281",
  appId: "1:389828779281:web:c2047597a76464ab9180b0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
