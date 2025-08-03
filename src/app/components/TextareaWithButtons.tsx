"use client";

import React, { useState, useRef, useEffect } from "react";

// interface for the component props
interface TextareaWithButtonsProps {
  placeholder?: string;
  onSubmit?: (text: string) => void;
  className?: string;
}

// Component that renders a textarea with buttons for user input
const TextareaWithButtons: React.FC<TextareaWithButtonsProps> = ({
  placeholder = "Ask me anything...",
  onSubmit,
  className = "",
}) => {

  // state to manage the user input in the textarea
  const [userQuery, setUserQuery] = useState<string>("");

  // reference to the textarea element for dynamic height adjustment
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // triggers when the textarea height needs to be adjusted
  const adjustHeight = () => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // triggers when user starts typing on the query textarea
  useEffect(() => {
    adjustHeight();
  }, [userQuery]);

  // triggers when user submits the query
  const handleSubmit = () => {
    if (userQuery.trim() && onSubmit) {
      onSubmit(userQuery.trim());
      setUserQuery("");
    }
  };

  // triggers when user presses Enter key and Shift key is not pressed this will submit the text
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 hover:bg-white/8 focus-within:border-white/20 focus-within:bg-white/10">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full resize-none border-none outline-none bg-transparent text-white placeholder-gray-400 text-base p-4 pb-16 pr-4 rounded-2xl"
          style={{
            minHeight: "60px",
            maxHeight: "250px",
            lineHeight: "1.5",
          }}
          rows={1}
        />

        {/* Buttons container - positioned at bottom right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {/* Attachment button */}
          <button
            type="button"
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
            onClick={() => {
              console.log("Attachment clicked");
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!userQuery.trim()}
            className={`p-2.5 rounded-xl transition-all duration-300 transform ${
              userQuery.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-600/30 hover:scale-105 active:scale-95"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={userQuery.trim() ? "2.5" : "2"}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextareaWithButtons;
