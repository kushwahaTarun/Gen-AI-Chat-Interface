import { useState } from "react";
import {useDispatch} from "react-redux";

import {
  setCurrentConversationId,
  setMessages,
  setIsResponseStreaming,
} from "@/features/chatInterfaceSlice";

export default function useMessageActions() {

// state to display the user a notification for the copied message status
  const [copyStatus, setCopyStatus] = useState("Copy");

  // Redux dispatch to update the state
  const dispatch = useDispatch();
    
    // triggers and copy the message
      const handleMessageCopy = async (messageContent: string) => {
        try {
          await navigator.clipboard.writeText(messageContent);
          // updating the status to display user a status
          setCopyStatus("Copied");
    
          // clearing the state to remove the copied status after 2 second
          setTimeout(() => {
            setCopyStatus("Copy");
          }, 2000);
        } catch (err) {
          console.error("Error copying the message content", err);
    
          // updating the status to display user a status
          setCopyStatus("Failed to copy the message");
    
          // clearing the state to remove the copied status after 2 second
          setTimeout(() => {
            setCopyStatus("Copy");
          }, 2000);
        }
      };

      // Updated handleNewChat function with better ID generation and debugging
        const handleNewChat = () => {
          // Generate a unique conversation ID similar to AppSidebar
          const newConversationId =
            "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      
          // Reset the current conversation ID, messages, and streaming state
          dispatch(setMessages([]));
          dispatch(setCurrentConversationId(newConversationId));
          dispatch(setIsResponseStreaming(false));
      
          console.log("Sidebar: New chat initiated");
        };

    return {
        copyStatus,
        handleMessageCopy,
        handleNewChat
    }
}