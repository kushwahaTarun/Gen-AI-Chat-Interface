import { useRef, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from "../interfaces/chat";
import useChat from "@/hooks/useChat";
import {
  setUserCurrentMessage,
} from "../features/chatInterfaceSlice";
import useFileUpload from "@/hooks/useFileUpload";
import type { RootState } from "@/store/store";

export default function useTextareaOperations() {

    // dispatch function to trigger actions
    const dispatch = useDispatch();

    // accessing the state from redux
      const { userCurrentMessage } =
        useSelector((state: RootState) => state.chat);

    // useRef to store the SpeechRecognition instance
    const speechRecognitionRef = useRef<null | SpeechRecognition>(null);

      // state to manage the speech-to-text functionality
  const [isListening, setIsListening] = useState(false);

  // Utility functions and state variable
    const { stopStream, handleQuerySubmit } = useChat();

    const {
        uploadedFiles,
        setUploadedFiles,
      } = useFileUpload();

        // triggers when the component mounts to initialize speech recognition
        useEffect(() => {
          const speechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
      
          if (speechRecognition) {
            // initializing the speech recognition instance
            const recognition = new speechRecognition();
            // setting the language
            recognition.lang = "en-US";
            // enabling continuous recognition and interim results
            recognition.continuous = true;
            recognition.interimResults = true;
            // assign the configured recognition instance to the ref
            speechRecognitionRef.current = recognition;
      
            if (speechRecognitionRef.current) {
              speechRecognitionRef.current.onresult = (
                event: SpeechRecognitionEvent
              ) => {
                let text = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  text += event.results[i][0].transcript;
                }
                dispatch(
                  setUserCurrentMessage({
                    ...userCurrentMessage,
                    content: text,
                  })
                ); // update the current message in the state
              };
            }
      
            speechRecognitionRef.current.onend = () => setIsListening(false);
      
            speechRecognitionRef.current.onerror = (
              event: SpeechRecognitionErrorEvent
            ) => {
              console.error("Speech recognition error:", event.error);
              setIsListening(false);
              toast.error("Speech recognition failed. Please try again.");
            };
          }
        }, [dispatch, userCurrentMessage]);
    
      // triggers when user clicks on the mic icon
      const startListening = () => {
        if (speechRecognitionRef.current && !isListening) {
          try {
            speechRecognitionRef.current.start();
            setIsListening(true);
          } catch (error) {
            console.error("Error starting speech recognition:", error);
            toast.error("Failed to start speech recognition");
          }
        }
      };
    
      // triggers when user clicks on the stop mic icon
      const stopListening = () => {
        if (speechRecognitionRef.current && isListening) {
          speechRecognitionRef.current.stop();
          setIsListening(false);
        }
      };
    
      // triggers when the user clicks on the stop streaming button
      const stopStreaming = () => {
        // stop the streaming response
        stopStream();
      };
    
      // handles the submission of the user query
      const handleSubmit = () => {
        if (
          (userCurrentMessage.content.trim() || uploadedFiles.length > 0) &&
          handleQuerySubmit
        ) {
          const userMessage = {
            ...userCurrentMessage,
            isComplete: true,
            attachments: uploadedFiles, // Include uploaded files
          };
          dispatch(setUserCurrentMessage(userMessage));
          handleQuerySubmit();
          // stop listening the voice recognition once user sends the query
          stopListening();
          // Clear uploaded files after sending
          uploadedFiles.forEach((file) => URL.revokeObjectURL(file.url));
          setUploadedFiles([]);
        }
      };

    return {
startListening, stopListening, stopStreaming, handleSubmit, isListening
    };
}