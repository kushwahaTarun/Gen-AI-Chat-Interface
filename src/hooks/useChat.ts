import {useRef} from "react";
import {toast} from "react-hot-toast";
import { RootState } from "@/store/store";
import { useSelector, useDispatch } from "react-redux";
import useConversation from "./useConversation";
import useMessages from "./useMessages";
import useAutoScroll from "./useAutoScroll"; 

import {setIsResponseStreaming, setUserCurrentMessage} from "@/features/chatInterfaceSlice"

export default function useChat() {
    
    // for dispatching an action
    const dispatch = useDispatch();

    // importing utility functions form the custom hook
    const {scrollToBottom} = useAutoScroll();
    const {saveUserMessage, createBotMessage, updateBotMessage} = useMessages();
    const {createNewConversation, updateConversationLastMessage} = useConversation();

    const {loggedInUser, userCurrentMessage, currentConversationId, messages, userSelectedLLMModelId,  } = useSelector((state: RootState) => state.chat);

    // creating a reference to the AbortController
  const controllerRef = useRef<AbortController | null>(null);

    // triggers when the user clicks on the stop streaming button
  const stopStream = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch(setIsResponseStreaming(false));
  };

  // triggers when the user submits a query
    const handleQuerySubmit = async () => {
      if (!loggedInUser || !userCurrentMessage?.content) {
        toast.error(
          "Please make sure you're logged in and have entered a message."
        );
        return;
      }
  
      // Cleanup any prior controller
      controllerRef.current?.abort();
      dispatch(setIsResponseStreaming(true));
  
      try {
        const controller = new AbortController();
        controllerRef.current = controller;
  
        // Store the current message content before clearing
        const currentMessageContent = userCurrentMessage.content;
        const currentMessageObject = { ...userCurrentMessage };
  
        // Clear the textarea input immediately
        dispatch(
          setUserCurrentMessage({
            role: "user",
            content: "",
          })
        );
  
        // Check if this is a new conversation (no messages yet)
        const isNewConversation = messages.length === 0;
  
        // If it's a new conversation, create the conversation metadata ONLY ONCE
        if (isNewConversation) {
          console.log("Creating new conversation:", currentConversationId);
          const success = await createNewConversation(
            loggedInUser.uid,
            currentConversationId,
            currentMessageContent
          );
  
          if (!success) {
            throw new Error("Failed to create conversation");
          }
        }
  
        // Save user message using the stored content
        await saveUserMessage(
          loggedInUser.uid,
          currentConversationId,
          currentMessageObject
        );
  
        // Create empty bot message
        const botMessageId = await createBotMessage(
          loggedInUser.uid,
          currentConversationId
        );
  
        // Call API with the stored message
        const response = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            model: userSelectedLLMModelId,
            messages: [...messages, currentMessageObject], // Use stored message
          }),
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
  
        let buffer = "";
        let fullResponse = "";
        let updateCount = 0;
  
        while (true) {
          const { done, value } = await reader?.read();
  
          if (done) {
            controllerRef.current = null;
  
            // Mark bot message as complete
            await updateBotMessage(
              loggedInUser.uid,
              currentConversationId,
              botMessageId,
              fullResponse,
              true
            );
  
            // Update conversation with bot's response (NOT creating new conversation)
            await updateConversationLastMessage(
              loggedInUser.uid,
              currentConversationId,
              fullResponse
            );
  
            dispatch(setIsResponseStreaming(false));
            break;
          }
  
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
  
          for (const line of lines) {
            const trimmedLine = line.trim();
  
            if (
              !trimmedLine ||
              trimmedLine === "data: [DONE]" ||
              trimmedLine === "[DONE]"
            ) {
              continue;
            }
  
            const jsonStr = trimmedLine.startsWith("data: ")
              ? trimmedLine.slice(6)
              : trimmedLine;
  
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || "";
  
              if (content) {
                fullResponse += content;
                updateCount++;
  
                await updateBotMessage(
                  loggedInUser.uid,
                  currentConversationId,
                  botMessageId,
                  fullResponse,
                  false
                );
  
                if (updateCount % 3 === 0) {
                  setTimeout(scrollToBottom, 50);
                }
              }
  
              if (parsed.choices?.[0]?.finish_reason === "stop") {
                await updateBotMessage(
                  loggedInUser.uid,
                  currentConversationId,
                  botMessageId,
                  fullResponse,
                  true
                );
  
                // Update conversation with final response (NOT creating new conversation)
                await updateConversationLastMessage(
                  loggedInUser.uid,
                  currentConversationId,
                  fullResponse
                );
  
                dispatch(setIsResponseStreaming(false));
                break;
              }
            } catch (parseError) {
              console.warn("Failed to parse JSON:", jsonStr, parseError);
            }
          }
        }
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (err: unknown) {
        if (err.name === "AbortError") {
          return;
        }
  
        dispatch(setIsResponseStreaming(false));
  
        if (err instanceof Error) {
          toast.error(
            `Error fetching answer. Please try again later. ${err.message}`
          );
        } else {
          toast.error("Error fetching answer. Please try again later.");
        }
      }
    };

    return {
        stopStream,
        handleQuerySubmit,
    }
}