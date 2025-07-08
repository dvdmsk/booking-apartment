import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "booking-ef826.firebaseapp.com",
  projectId: "booking-ef826",
  storageBucket: "booking-ef826.appspot.com",
  messagingSenderId: "260811866727",
  appId: "1:260811866727:web:b4e26abfae922681a28ac2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);