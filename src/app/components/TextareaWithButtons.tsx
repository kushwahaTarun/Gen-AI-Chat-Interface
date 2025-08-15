"use client";

import React, { useRef, useEffect } from "react";
import { HiCpuChip } from "react-icons/hi2";
import { MdMic } from "react-icons/md";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { getAllLLMModels } from "../../app/services";
import {
  setUserSelectedModel,
  setUserSelectedLLMModelId,
  setUserCurrentMessage,
  setLLMModelDropdownOpen,
  setAllLLMModels,
} from "../../features/chatInterfaceSlice";

// interface for the props of TextareaWithButtons component
interface TextareaWithButtonsProps {
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
}

const TextareaWithButtons: React.FC<TextareaWithButtonsProps> = ({
  placeholder = "Ask me anything...",
  onSubmit,
  className = "",
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

  console.warn("allLLMModels:", allLLMModels);

  // refs for textarea and dropdown menu
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // triggers when a model is selected from the dropdown
  const handleModelChange = (m: any) => {
    dispatch(setUserSelectedModel(m.name));
    dispatch(setUserSelectedLLMModelId(m.id));
    dispatch(setLLMModelDropdownOpen(false));
  };

  // handles the submission of the user query
  const handleSubmit = () => {
    if (userCurrentMessage.content.trim() && onSubmit) {
      onSubmit();
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
          className="absolute bottom-3 left-4 p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          title="Attach file"
        >
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
                            userSelectedLLMModel === m.name ? "text-cyan-400" : ""
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

          {/* MIC */}
          <MdMic
            className="text-lg cursor-pointer text-gray-400 hover:text-white transition"
            title="Speak"
          />

          {/* SEND */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!userCurrentMessage.content.trim()}
            className={`p-2.5 rounded-xl transition ${
              userCurrentMessage.content.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            }`}
            title="Send"
          >
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextareaWithButtons;