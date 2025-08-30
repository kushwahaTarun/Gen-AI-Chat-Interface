// HOOK THAT STORES THE FIREBASE AUTHENTICATION LOGIC

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { onAuthStateChanged, getAuth } from "firebase/auth";

import {setLoggedInUser, setMessages} from "@/features/chatInterfaceSlice"

// creating a new auth instance
const auth = getAuth(); 

export default function useAuth() {

    // for dispatching an action
    const dispatch = useDispatch();

      // Handle authentication state changes
      useEffect(() => {
        let unsubscribe: (() => void) | undefined;
    
        try {
          unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              const serializableUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              };
    
              dispatch(setLoggedInUser(serializableUser));
            } else {
              dispatch(setLoggedInUser(null));
              dispatch(setMessages([]));
            }
          });
        } catch {
          toast.error(
            "Error checking authentication state. Please try again later."
          );
          dispatch(setLoggedInUser(null));
        }
    
        // Cleanup function
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      }, [dispatch]);
}