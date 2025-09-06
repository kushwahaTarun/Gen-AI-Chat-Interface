import { useState } from "react";

export default function useMessageActions() {

// state to display the user a notification for the copied message status
  const [copyStatus, setCopyStatus] = useState("Copy");
    
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

    return {
        copyStatus,
        handleMessageCopy
    }
}