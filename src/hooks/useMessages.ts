import {addDoc, doc, updateDoc, collection, serverTimestamp} from "firebase/firestore"

import { db } from "@/lib/firebase";

export default function useMessages() {
      // triggers when the user submits a query and this will save the user message
      // to the Firestore database
      async function saveUserMessage(
        userUid: string,
        conversationId: string,
        userCurrentMessage: {
          [key: string]: string;
        }
      ) {
        try {
          const messageRef = await addDoc(
            collection(
              db,
              "users",
              userUid,
              "conversations",
              conversationId,
              "messages"
            ),
            {
              content: userCurrentMessage.content,
              role: userCurrentMessage.role,
              isBot: false,
              isComplete: true,
              timestamp: serverTimestamp(),
            }
          );
          return messageRef.id;
        } catch (error) {
          console.error("Error saving user message:", error);
          throw error;
        }
      }
    
      async function createBotMessage(userUid: string, conversationId: string) {
        try {
          // Create an empty bot message first
          const messageRef = await addDoc(
            collection(
              db,
              "users",
              userUid,
              "conversations",
              conversationId,
              "messages"
            ),
            {
              content: "", // Start empty
              role: "assistant",
              isBot: true,
              isComplete: false, // Not complete yet
              timestamp: serverTimestamp(),
            }
          );
          return messageRef.id; // Return message ID to update later
        } catch (error) {
          console.error("Error creating bot message:", error);
          throw error;
        }
      }
    
      // Update bot message during streaming
      async function updateBotMessage(
        userUid: string,
        conversationId: string,
        messageId: string,
        content: string,
        isComplete: boolean = false
      ) {
        try {
          await updateDoc(
            doc(
              db,
              "users",
              userUid,
              "conversations",
              conversationId,
              "messages",
              messageId
            ),
            {
              content: content,
              isComplete: isComplete,
            }
          );
        } catch (error) {
          console.error("Error updating bot message:", error);
        }
      }
      
    return {
        saveUserMessage,
        createBotMessage,
        updateBotMessage
    }
}