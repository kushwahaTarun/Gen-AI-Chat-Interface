import { RootState } from "@/store/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {setCurrentConversationId, setMessages} from "@/features/chatInterfaceSlice"

export default function useConversation() {

    // for dispatching an action
    const dispatch = useDispatch();

    // destructuring the states from the redux slice
    const {currentConversationId, messages, loggedInUser} = useSelector((state: RootState) => state.chat)

      // Only set conversation ID if none exists AND we don't have any messages
      useEffect(() => {
        if (!currentConversationId && messages.length === 0) {
          const newConversationId = "chat-" + Date.now();
          dispatch(setCurrentConversationId(newConversationId));
        }
      }, [currentConversationId, messages.length, dispatch]);
    
      // Handle conversation switching and message loading
      useEffect(() => {
        let messageUnsubscribe: (() => void) | undefined;
    
        // When conversation ID changes and we have a logged in user, load the messages
        if (loggedInUser && currentConversationId) {
          messageUnsubscribe = loadConversationMessages(
            loggedInUser.uid,
            currentConversationId
          );
        }
    
        // Return cleanup function
        return () => {
          if (messageUnsubscribe) {
            messageUnsubscribe();
          }
        };
      }, [currentConversationId, loggedInUser]);

        // Load conversation messages in real-time
        const loadConversationMessages = (
          userUid: string,
          conversationId: string
        ) => {
          const messagesRef = collection(
            db,
            "users",
            userUid,
            "conversations",
            conversationId,
            "messages"
          );
          const q = query(messagesRef, orderBy("timestamp", "asc"));
      
          return onSnapshot(
            q,
            (snapshot) => {
              const loadedMessages: any[] = [];
              snapshot.forEach((doc) => {
                const messageData = doc.data();
                loadedMessages.push({
                  id: doc.id,
                  role: messageData.isBot ? "assistant" : messageData.role,
                  content: messageData.content,
                  isComplete: messageData.isComplete,
                  timestamp:
                    messageData.timestamp?.toDate?.()?.toISOString() ||
                    new Date().toISOString(),
                });
              });
      
              dispatch(setMessages(loadedMessages));
            },
            (error) => {
              // Handle case where conversation doesn't exist yet (new conversation)
              if (error.code === "permission-denied" || loadedMessages.length === 0) {
                console.log("No messages found for conversation:", conversationId);
                dispatch(setMessages([]));
              } else {
                console.error("Error loading messages:", error);
              }
            }
          );
        };

          // CREATE conversation only once when starting new chat
          async function createNewConversation(
            userUid: string,
            conversationId: string,
            firstMessage: string
          ) {
            try {
              const conversationRef = doc(
                db,
                "users",
                userUid,
                "conversations",
                conversationId
              );
        
              await setDoc(conversationRef, {
                title:
                  firstMessage.length > 50
                    ? firstMessage.substring(0, 50) + "..."
                    : firstMessage,
                lastMessage: firstMessage,
                lastActivity: serverTimestamp(),
                createdAt: serverTimestamp(),
              });
        
              return true;
            } catch (error) {
              console.error("Error creating conversation:", error);
              return false;
            }
          }
        
          // UPDATE conversation only when needed (not for every message)
          async function updateConversationLastMessage(
            userUid: string,
            conversationId: string,
            lastMessage: string
          ) {
            try {
              const conversationRef = doc(
                db,
                "users",
                userUid,
                "conversations",
                conversationId
              );
        
              await updateDoc(conversationRef, {
                lastMessage: lastMessage,
                lastActivity: serverTimestamp(),
              });
            } catch (error) {
              console.error("Error updating conversation:", error);
            }
          }

          return {
            createNewConversation, 
            updateConversationLastMessage
          }
    
}