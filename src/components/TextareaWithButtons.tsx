"use client";

import React, { useRef, useEffect, useState } from "react";
import { HiCpuChip } from "react-icons/hi2";
import { MdMic, MdMicOff } from "react-icons/md";
import { IoAttach } from "react-icons/io5";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { getAllLLMModels } from "../services";
import {
  setUserSelectedModel,
  setUserSelectedLLMModelId,
  setUserCurrentMessage,
  setLLMModelDropdownOpen,
  setAllLLMModels,
} from "../features/chatInterfaceSlice";

// interface for the props of TextareaWithButtons component
interface TextareaWithButtonsProps {
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
  isResponseStreaming: boolean;
  stopStream: () => void; // function to stop streaming response
}

const TextareaWithButtons: React.FC<TextareaWithButtonsProps> = ({
  placeholder = "Ask me anything...",
  onSubmit,
  className = "",
  isResponseStreaming,
  stopStream,
}) => {
  // using dispatch from redux to manage state
  const dispatch = useDispatch();

  // accessing the state from redux
  const {
    userSelectedLLMModel,
    allLLMModels,
    userCurrentMessage,
    llmModelDropdownOpen,
  } = useSelector((state: any) => state.chat);

  // state to manage the speech-to-text functionality
  const [isListening, setIsListening] = useState(false);

  // refs for textarea, dropdown menu and the speech recognition instance
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef(null);

  useEffect(() => {
    (async function () {
      try {
        // Fetching all **LLM models** when the component mounts
        const response = await getAllLLMModels();

        if (response && response.data && response.data.data) {
          // Setting the fetched models to state
          dispatch(setAllLLMModels(response.data.data));
        }
      } catch (error) {
        // Displaying error toast if fetching models fails
        toast.error("Failed to fetch models. Please try again later.");
        console.error("Error fetching LLM models:", error);
      }
    })();
  }, []);

  // triggers when the component mounts to initialize speech recognition
  useEffect(() => {
    const speechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (speechRecognition) {
      // initializing the speech recognition instance
      speechRecognitionRef.current = new speechRecognition();
      // setting the language
      speechRecognitionRef.current.lang = "en-US";
      // enabling continuous recognition and interim results
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;

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

      speechRecognitionRef.current.onend = () => setIsListening(false);

      speechRecognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Speech recognition failed. Please try again.");
      };
    }
  }, []);

  /* auto-height */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [userCurrentMessage.content]);

  /* close on click-outside / Esc */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        dispatch(setLLMModelDropdownOpen(false));
    };
    const esc = (e: KeyboardEvent) =>
      e.key === "Escape" && dispatch(setLLMModelDropdownOpen(false));
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, []);

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

  // triggers when a model is selected from the dropdown
  const handleModelChange = (m: any) => {
    dispatch(setUserSelectedModel(m.name));
    dispatch(setUserSelectedLLMModelId(m.id));
    dispatch(setLLMModelDropdownOpen(false));
  };

  // triggers when the user clicks on the stop streaming button
  const stopStreaming = () => {
    // stop the streaming response
    stopStream();
  };

  // handles the submission of the user query
  const handleSubmit = () => {
    if (userCurrentMessage.content.trim() && onSubmit) {
      const userMessage = {
        ...userCurrentMessage,
        isComplete: true,
      };
      dispatch(setUserCurrentMessage(userMessage));
      onSubmit();
      // stop listening the voice recognition once user sends the query
      stopListening();
    }
  };

  // Helper function to check if model is free
  const isModelFree = (model: any) => {
    return model.pricing?.prompt === "0" || model.pricing?.prompt === 0;
  };

  // Helper function to format pricing info for tooltip
  const getPricingTooltip = (model: any) => {
    const pricing = model.pricing;
    if (!pricing) return "Pricing not available";

    const prompt = parseFloat(pricing.prompt || 0);
    const completion = parseFloat(pricing.completion || 0);

    if (prompt === 0 && completion === 0) {
      return "Free to use";
    }

    let tooltip = "Pricing:\n";
    if (prompt > 0) tooltip += `Prompt: $${prompt}/token\n`;
    if (completion > 0) tooltip += `Completion: $${completion}/token`;

    return tooltip.trim();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
        {/* TEXTAREA */}
        <textarea
          ref={textareaRef}
          value={userCurrentMessage.content}
          onChange={(e) =>
            // updating the current message in the state
            dispatch(
              setUserCurrentMessage({
                ...userCurrentMessage,
                content: e.target.value,
              })
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-white placeholder-gray-400 p-4 pb-12 pr-4 text-base outline-none"
          style={{ minHeight: "60px", maxHeight: "250px", lineHeight: "1.5" }}
          rows={2}
        />

        {/* ATTACHMENT – bottom-left */}
        <button
          type="button"
          className="absolute bottom-3 left-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          title="Attach file"
        >
          <IoAttach className="text-2xl" />
          {/* your svg here */}
        </button>

        {/* RIGHT ICON GROUP */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          {/* MODEL PICKER */}
          <div className="relative" ref={menuRef}>
            <HiCpuChip
              className={`text-lg cursor-pointer ${
                userSelectedLLMModel != "openai/gpt-3.5-turbo"
                  ? "text-cyan-500"
                  : "text-gray-300 hover:text-white"
              } transition`}
              title={
                userSelectedLLMModel != "openai/gpt-3.5-turbo"
                  ? userSelectedLLMModel
                  : "Choose model"
              }
              onClick={() =>
                dispatch(setLLMModelDropdownOpen(!llmModelDropdownOpen))
              }
            />

            {llmModelDropdownOpen && (
              <div
                /* 1️⃣  wider   2️⃣ positioned above & centered */
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2
                 w-72 bg-gray-800 text-sm text-gray-200 rounded-xl
                 shadow-lg border border-gray-700/60 custom-scrollbar z-50 max-h-72 overflow-y-auto"
              >
                {allLLMModels.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => handleModelChange(m)}
                    title={getPricingTooltip(m)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700/60 transition ${
                      userSelectedLLMModel == m.name ? "bg-gray-700/40" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`font-medium truncate ${
                            userSelectedLLMModel === m.name
                              ? "text-cyan-400"
                              : ""
                          }`}
                        >
                          {m.name}
                        </span>
                        {isModelFree(m) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                            FREE
                          </span>
                        )}
                      </div>
                      {userSelectedLLMModel === m.name && (
                        <span className="text-cyan-400 flex-shrink-0">✔</span>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-gray-400 line-clamp-1">
                      {m.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MIC / STOP RECORDING BUTTON */}
          {!isListening ? (
            <MdMic
              className="text-lg cursor-pointer text-gray-400 hover:text-white transition"
              title="Start voice recording"
              onClick={startListening}
            />
          ) : (
            <div className="relative">
              {/* Subtle pulsing ring around icon area */}
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>

              {/* Stop button - same size as mic icon */}
              <MdMicOff
                className="relative text-lg cursor-pointer text-red-400 hover:text-red-300 transition z-10"
                title="Stop recording"
                onClick={stopListening}
              />

              {/* Small recording dot indicator */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}

          {/* SEND OR STOP QUERY RESPONSE BUTTON*/}
          <button
            type="button"
            onClick={isResponseStreaming ? stopStreaming : handleSubmit}
            disabled={
              isResponseStreaming ? false : !userCurrentMessage.content.trim()
            }
            className={`cursor-pointer p-2.5 rounded-xl transition ${
              isResponseStreaming
                ? "bg-white text-blue-600"
                : userCurrentMessage.content.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            }`}
            title={isResponseStreaming ? "Stop" : "Send"}
          >
            {isResponseStreaming ? (
              // stop query response icon
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="5" y="5" width="14" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              // send query icon
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={userCurrentMessage.content.trim() ? 2.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22 11 13 2 9 22 2Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextareaWithButtons;
