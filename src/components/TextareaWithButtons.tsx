"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import {
  MdMic,
  MdMicOff,
  MdClose,
  MdExpandLess,
  MdExpandMore,
} from "react-icons/md";
import {
  IoAttach,
  IoImage,
  IoVideocam,
  IoDocument,
  IoCamera,
} from "react-icons/io5";
import { HiCpuChip } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import ModelCard from "./ModelCard";
import { getAllLLMModels } from "../services";
import {
  setUserCurrentMessage,
  setLLMModelDropdownOpen,
  setAllLLMModels,
} from "../features/chatInterfaceSlice";
import { RootState } from "@/store/store";
import useModelManagement from "@/hooks/useModelManagement";
import useFileUpload from "@/hooks/useFileUpload";
import useMotionVariants from "@/hooks/useMotionVariants";
import useTextareaOperations from "@/hooks/useTextareaOperations";

// interface for the props of TextareaWithButtons component
interface TextareaWithButtonsProps {
  placeholder?: string;
  className?: string;
  isResponseStreaming: boolean;
  supportedMediaTypes?: string;
}

const TextareaWithButtons: React.FC<TextareaWithButtonsProps> = ({
  placeholder = "Ask me anything...",
  className = "",
  isResponseStreaming,
}) => {
  // using dispatch from redux to manage state
  const dispatch = useDispatch();

  // utility functions and state variables from custom hooks
  const {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    supportedMedia,
    isDragOver,
    handleFileUpload,
    uploadedFiles,
    isUploading,
    showUploadOptions,
    setShowUploadOptions,
    removeFile,
    clearAllFiles,
    getFileIcon,
    filesCollapsed,
    setFilesCollapsed,
  } = useFileUpload();

  // importing the helper functions from useModelManagement
  const {
    processedModels,
    getFilteredModels,
    modelSearchQuery,
    setModelSearchQuery,
    handleModelChange,
    isModelFree,
  } = useModelManagement();

  const { handleSubmit, isListening, startListening, stopListening, stopStreaming } = useTextareaOperations();

  // framer-motion variants
  const {
    uploadOptionsVariants,
    optionItemVariants,
    dragOverlayVariants,
    filesContainerVariants,
  } = useMotionVariants();

  // accessing the state from redux
  const { userSelectedLLMModel, userCurrentMessage, llmModelDropdownOpen } =
    useSelector((state: RootState) => state.chat);

  // refs for textarea, dropdown menu and the speech recognition instance
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  // const speechRecognitionRef = useRef<null | SpeechRecognition>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async function () {
      try {
        // Fetching all LLM models when the component mounts
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
  }, [dispatch]);

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
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(e.target as Node)
      )
        setShowUploadOptions(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch(setLLMModelDropdownOpen(false));
        setShowUploadOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [dispatch]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={supportedMedia.acceptedTypes}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            handleFileUpload(files);
          }
        }}
        className="hidden"
      />

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            variants={dragOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center z-50 backdrop-blur-sm"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center"
            >
              <IoCamera className="text-5xl text-blue-400 mx-auto mb-3" />
              <p className="text-blue-400 font-semibold text-lg">
                Drop files here to upload
              </p>
              <p className="text-blue-300/80 text-sm mt-1">
                {[
                  supportedMedia.images && "Images",
                  supportedMedia.videos && "Videos",
                  supportedMedia.audio && "Audio",
                  supportedMedia.documents && "Documents",
                ]
                  .filter(Boolean)
                  .join(", ")}{" "}
                supported
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact File previews - Fixed position above textarea */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            variants={filesContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden"
          >
            {/* Header with file count and controls */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <IoAttach className="text-gray-400 text-sm" />
                <span className="text-xs text-gray-300 font-medium">
                  {uploadedFiles.length}/10 file
                  {uploadedFiles.length > 1 ? "s" : ""} attached
                </span>
              </div>

              <div className="flex items-center gap-1">
                {uploadedFiles.length > 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilesCollapsed(!filesCollapsed)}
                    className="p-1 rounded hover:bg-white/10 transition text-gray-400 hover:text-white"
                  >
                    {filesCollapsed ? (
                      <MdExpandMore className="text-sm" />
                    ) : (
                      <MdExpandLess className="text-sm" />
                    )}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllFiles}
                  className="p-1 rounded hover:bg-red-500/20 transition text-gray-400 hover:text-red-400"
                >
                  <MdClose className="text-sm" />
                </motion.button>
              </div>
            </div>

            {/* Files grid - collapsible */}
            <AnimatePresence>
              {!filesCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3"
                >
                  <div className="flex flex-wrap gap-1.5 max-w-full">
                    {uploadedFiles.map((file, index) => {
                      const { icon: Icon, color } = getFileIcon(file.type);
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group flex-shrink-0"
                        >
                          {/* Compact preview similar to your reference */}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative w-16 h-12 rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-all bg-white/5"
                          >
                            {file.type === "image" ? (
                              <Image
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : file.type === "video" ? (
                              <div className="relative w-full h-full">
                                <video
                                  src={file.url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <IoVideocam className="text-white text-lg" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-white/10">
                                <Icon className={`text-lg ${color} mb-0.5`} />
                                <div className="text-xs text-white/80 font-medium px-1 text-center leading-tight">
                                  {file.name.split(".").pop()?.toUpperCase() ||
                                    "FILE"}
                                </div>
                              </div>
                            )}

                            {/* Enhanced delete button - better visibility with dark background */}
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFile(file.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 transition-all duration-200 z-10"
                              title={`Remove ${file.name}`}
                            >
                              <MdClose className="text-sm text-white font-bold drop-shadow-sm" />
                            </motion.button>

                            {/* File name tooltip on hover */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                              {file.name}
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Show collapsed preview - horizontal layout without scrollbar */}
            {filesCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 pb-3"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {uploadedFiles.map((file, index) => {
                    const { icon: Icon, color } = getFileIcon(file.type);
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative group flex-shrink-0"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="relative w-12 h-9 rounded-md overflow-hidden border border-white/20 hover:border-white/40 transition-all bg-white/5"
                        >
                          {file.type === "image" ? (
                            <Image
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type === "video" ? (
                            <div className="relative w-full h-full">
                              <video
                                src={file.url}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <IoVideocam className="text-white text-xs" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/10">
                              <Icon className={`text-sm ${color}`} />
                            </div>
                          )}

                          {/* Enhanced delete button - better visibility for collapsed view */}
                          <motion.button
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 transition-all duration-200 z-10"
                            title={`Remove ${file.name}`}
                          >
                            <MdClose className="text-xs text-white font-bold drop-shadow-sm" />
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
          className="w-full resize-none bg-transparent text-white placeholder-gray-400 p-4 pb-12 pr-4 text-md md:text-base outline-none"
          style={{ minHeight: "60px", maxHeight: "250px", lineHeight: "1.5" }}
          rows={2}
        />

        {/* ATTACHMENT – bottom-left */}
        <div className="absolute bottom-3 left-4" ref={uploadMenuRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            className={`text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition p-1.5 relative ${
              uploadedFiles.length > 0 ? "text-blue-400" : ""
            }`}
            title="Attach media"
          >
            <motion.div
              animate={showUploadOptions ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <IoAttach className="text-lg md:text-xl" />
            </motion.div>

            {/* File count badge */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">
                    {uploadedFiles.length > 9 ? "9+" : uploadedFiles.length}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Upload options dropdown */}
          <AnimatePresence>
            {showUploadOptions && (
              <motion.div
                variants={uploadOptionsVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute bottom-full mb-2 left-0 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-700/60 py-2 min-w-52 z-50"
              >
                {supportedMedia.images && (
                  <motion.button
                    variants={optionItemVariants}
                    onClick={() => {
                      fileInputRef.current?.setAttribute("accept", "image/*");
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/60 transition text-left text-sm text-gray-200 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="text-green-400"
                    >
                      <IoImage className="text-lg" />
                    </motion.div>
                    <div>
                      <p className="font-medium">Images</p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, GIF, WebP
                      </p>
                    </div>
                  </motion.button>
                )}

                {supportedMedia.videos && (
                  <motion.button
                    variants={optionItemVariants}
                    onClick={() => {
                      fileInputRef.current?.setAttribute("accept", "video/*");
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/60 transition text-left text-sm text-gray-200 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="text-red-400"
                    >
                      <IoVideocam className="text-lg" />
                    </motion.div>
                    <div>
                      <p className="font-medium">Videos</p>
                      <p className="text-xs text-gray-400">MP4, WebM, MOV</p>
                    </div>
                  </motion.button>
                )}

                {supportedMedia.audio && (
                  <motion.button
                    variants={optionItemVariants}
                    onClick={() => {
                      fileInputRef.current?.setAttribute("accept", "audio/*");
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/60 transition text-left text-sm text-gray-200 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="text-purple-400"
                    >
                      <MdMic className="text-lg" />
                    </motion.div>
                    <div>
                      <p className="font-medium">Audio</p>
                      <p className="text-xs text-gray-400">MP3, WAV, M4A</p>
                    </div>
                  </motion.button>
                )}

                {supportedMedia.documents && (
                  <motion.button
                    variants={optionItemVariants}
                    onClick={() => {
                      fileInputRef.current?.setAttribute(
                        "accept",
                        ".pdf,.doc,.docx,.txt,.csv,.json,.xlsx,.pptx"
                      );
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/60 transition text-left text-sm text-gray-200 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="text-blue-400"
                    >
                      <IoDocument className="text-lg" />
                    </motion.div>
                    <div>
                      <p className="font-medium">Documents</p>
                      <p className="text-xs text-gray-400">
                        PDF, DOC, TXT, CSV
                      </p>
                    </div>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT ICON GROUP */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          {/* Upload loading indicator */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                />
                <span className="text-xs text-blue-400 font-medium">
                  Uploading...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ENHANCED MODEL PICKER */}
          <div className="relative" ref={menuRef}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-xl transition ${
                userSelectedLLMModel !== "openai/gpt-3.5-turbo"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              onClick={() =>
                dispatch(setLLMModelDropdownOpen(!llmModelDropdownOpen))
              }
            >
              <HiCpuChip className="text-lg" />

              {/* Show selected model info */}
              {userSelectedLLMModel !== "openai/gpt-3.5-turbo" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate max-w-24">
                    {userSelectedLLMModel.split("/").pop()}
                  </span>

                  {/* Show if it's free */}
                  {(() => {
                    const model = processedModels.find(
                      (m) => m.name === userSelectedLLMModel
                    );
                    return model && isModelFree(model) ? (
                      <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                        FREE
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </motion.div>

            {/* SIMPLIFIED DROPDOWN */}
            <AnimatePresence>
              {llmModelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/60 z-50 max-h-96 overflow-hidden"
                >
                  {/* Header */}
                  <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm p-3 border-b border-gray-700/40">
                    <h3 className="text-white font-medium text-sm mb-2">
                      Choose AI Model
                    </h3>

                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent pr-8"
                        autoFocus
                      />
                      {/* Search Icon */}
                      <svg
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>

                      {/* Clear Search Button */}
                      {modelSearchQuery && (
                        <button
                          onClick={() => setModelSearchQuery("")}
                          className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-white transition"
                        >
                          <MdClose />
                        </button>
                      )}
                    </div>

                    {/* Results Count */}
                    <p className="text-gray-400 text-xs mt-2">
                      {getFilteredModels().length} model
                      {getFilteredModels().length !== 1 ? "s" : ""}
                      {modelSearchQuery
                        ? ` matching "${modelSearchQuery}"`
                        : " available"}
                    </p>
                  </div>

                  {/* Model List with custom scrollbar */}
                  <div className="overflow-y-auto max-h-72 custom-scrollbar">
                    <div className="p-2">
                      {getFilteredModels().length > 0 ? (
                        getFilteredModels().map((model, index) => (
                          <ModelCard
                            key={model.id}
                            model={model}
                            index={index}
                            selected={userSelectedLLMModel === model.name}
                            onSelect={() => handleModelChange(model)}
                          />
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <div className="text-gray-400 text-sm mb-2">
                            No models found
                          </div>
                          <div className="text-gray-500 text-xs">
                            Try searching for different terms like
                            &ldquo;free&rdquo;, &ldquo;reasoning&rdquo;,
                            &ldquo;vision&rdquo;, or &ldquo;code&rdquo;
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Filter Chips (Optional Enhancement) */}
                  {!modelSearchQuery && (
                    <div className="border-t border-gray-700/40 p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "free",
                          "reasoning",
                          "vision",
                          "code",
                          "creative",
                        ].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setModelSearchQuery(filter)}
                            className="px-2 py-1 bg-gray-700/40 hover:bg-gray-600/60 text-gray-300 hover:text-white text-xs rounded-md transition capitalize"
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MIC / STOP RECORDING BUTTON */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {!isListening ? (
              <MdMic
                className="text-lg cursor-pointer text-gray-400 hover:text-white transition"
                title="Start voice recording"
                onClick={startListening}
              />
            ) : (
              <div className="relative">
                {/* Subtle pulsing ring around icon area */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-red-500/20 rounded-full"
                />

                {/* Stop button - same size as mic icon */}
                <MdMicOff
                  className="relative text-lg cursor-pointer text-red-400 hover:text-red-300 transition z-10"
                  title="Stop recording"
                  onClick={stopListening}
                />

                {/* Small recording dot indicator */}
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                />
              </div>
            )}
          </motion.div>

          {/* SEND OR STOP QUERY RESPONSE BUTTON*/}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={isResponseStreaming ? stopStreaming : handleSubmit}
            disabled={
              isResponseStreaming
                ? false
                : !userCurrentMessage.content.trim() &&
                  uploadedFiles.length === 0
            }
            className={`cursor-pointer p-2.5 rounded-xl transition ${
              isResponseStreaming
                ? "bg-white text-blue-600"
                : userCurrentMessage.content.trim() || uploadedFiles.length > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            }`}
            title={isResponseStreaming ? "Stop" : "Send"}
          >
            <motion.div
              animate={
                isResponseStreaming ? { rotate: [0, 90, 180, 270, 360] } : {}
              }
              transition={
                isResponseStreaming
                  ? { duration: 1, repeat: Infinity, ease: "linear" }
                  : {}
              }
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22 11 13 2 9 22 2Z" />
                </svg>
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TextareaWithButtons;
