import { useEffect, useState } from "react"
import { getAuth, signInWithPopup } from "firebase/auth";
import { app } from "./firebase";


export const AuthProvider = (app) => {
  const auth = getAuth();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    auth.onAuthStateChanged((maybeUser) => {
      if (maybeUser != null) {
        return setUser(maybeUser);
      }

      signInWithPopup(() => {
        
      });
    })
  }, []);

  return user != null ? <>{user.displayName}</> : <>loading</>
}