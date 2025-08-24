"use client";

import React, { useRef, useEffect, useState } from "react";
import { HiCpuChip } from "react-icons/hi2";
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
  IoAdd,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
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
  stopStream: () => void;
  supportedMediaTypes?: string; // New prop for supported media types from ConfigCat
}

// Interface for uploaded files
interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "video" | "document" | "audio" | "other";
  url: string;
  name: string;
  size: string;
}

// Interface for supported media configuration
interface SupportedMedia {
  images: boolean;
  videos: boolean;
  documents: boolean;
  audio: boolean;
  acceptedTypes: string;
}

const TextareaWithButtons: React.FC<TextareaWithButtonsProps> = ({
  placeholder = "Ask me anything...",
  onSubmit,
  className = "",
  isResponseStreaming,
  stopStream,
  supportedMediaTypes = "images,videos,documents", // Default supported types
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

  // Parse supported media types from ConfigCat string
  const parseSupportedMedia = (supportedTypes: string): SupportedMedia => {
    const types = supportedTypes
      .toLowerCase()
      .split(",")
      .map((t) => t.trim());

    const config: SupportedMedia = {
      images: types.includes("images") || types.includes("image"),
      videos: types.includes("videos") || types.includes("video"),
      documents:
        types.includes("documents") ||
        types.includes("document") ||
        types.includes("docs"),
      audio: types.includes("audio") || types.includes("sound"),
      acceptedTypes: "",
    };

    // Build accepted types string
    let acceptedTypes = [];
    if (config.images) acceptedTypes.push("image/*");
    if (config.videos) acceptedTypes.push("video/*");
    if (config.audio) acceptedTypes.push("audio/*");
    if (config.documents)
      acceptedTypes.push(".pdf,.doc,.docx,.txt,.csv,.json,.xlsx,.pptx");

    config.acceptedTypes = acceptedTypes.join(",");
    return config;
  };

  const [supportedMedia] = useState<SupportedMedia>(
    parseSupportedMedia(supportedMediaTypes)
  );

  // state to manage the speech-to-text functionality
  const [isListening, setIsListening] = useState(false);

  // Media upload states
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filesCollapsed, setFilesCollapsed] = useState(false);

  // refs for textarea, dropdown menu and the speech recognition instance
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-collapse files when there are more than 4
  useEffect(() => {
    if (uploadedFiles.length > 4) {
      setFilesCollapsed(true);
    } else if (uploadedFiles.length <= 2) {
      setFilesCollapsed(false);
    }
  }, [uploadedFiles.length]);

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
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  // File type detection
  const getFileType = (
    file: File
  ): "image" | "video" | "document" | "audio" | "other" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text") ||
      file.type.includes("spreadsheet") ||
      file.type.includes("presentation") ||
      file.name.match(/\.(pdf|doc|docx|txt|csv|json|xlsx|pptx)$/i)
    )
      return "document";
    return "other";
  };

  // Check if file type is supported
  const isFileTypeSupported = (file: File): boolean => {
    const fileType = getFileType(file);

    switch (fileType) {
      case "image":
        return supportedMedia.images;
      case "video":
        return supportedMedia.videos;
      case "audio":
        return supportedMedia.audio;
      case "document":
        return supportedMedia.documents;
      default:
        return false;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit of 10
    if (uploadedFiles.length + files.length > 10) {
      toast.error(
        `Maximum 10 files allowed. You can upload ${
          10 - uploadedFiles.length
        } more file(s).`
      );
      return;
    }

    // Filter supported files
    const supportedFiles = files.filter((file) => isFileTypeSupported(file));
    const unsupportedFiles = files.filter((file) => !isFileTypeSupported(file));

    if (unsupportedFiles.length > 0) {
      toast.error(
        `${unsupportedFiles.length} file(s) not supported. Check allowed file types.`
      );
    }

    if (supportedFiles.length === 0) return;

    // Final check after filtering supported files
    if (uploadedFiles.length + supportedFiles.length > 10) {
      const allowedCount = 10 - uploadedFiles.length;
      toast.error(
        `Can only upload ${allowedCount} more file(s) to stay within the 10-file limit.`
      );
      return;
    }

    setIsUploading(true);

    try {
      const newFiles: UploadedFile[] = [];

      for (const file of supportedFiles) {
        // Simulate upload delay for animation
        await new Promise((resolve) => setTimeout(resolve, 200));

        const fileType = getFileType(file);
        const fileUrl = URL.createObjectURL(file);

        const uploadedFile: UploadedFile = {
          id: Date.now() + Math.random().toString(),
          file,
          type: fileType,
          url: fileUrl,
          name: file.name,
          size: formatFileSize(file.size),
        };

        newFiles.push(uploadedFile);
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      toast.error("Failed to upload files");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setShowUploadOptions(false);
    }
  };

  // Remove uploaded file
  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // Clear all files
  const clearAllFiles = () => {
    uploadedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setUploadedFiles([]);
  };

  // Get file type icon and color
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return { icon: IoImage, color: "text-green-400" };
      case "video":
        return { icon: IoVideocam, color: "text-red-400" };
      case "audio":
        return { icon: MdMic, color: "text-purple-400" };
      case "document":
        return { icon: IoDocument, color: "text-blue-400" };
      default:
        return { icon: IoDocument, color: "text-gray-400" };
    }
  };

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
    if (
      (userCurrentMessage.content.trim() || uploadedFiles.length > 0) &&
      onSubmit
    ) {
      const userMessage = {
        ...userCurrentMessage,
        isComplete: true,
        attachments: uploadedFiles, // Include uploaded files
      };
      dispatch(setUserCurrentMessage(userMessage));
      onSubmit();
      // stop listening the voice recognition once user sends the query
      stopListening();
      // Clear uploaded files after sending
      uploadedFiles.forEach((file) => URL.revokeObjectURL(file.url));
      setUploadedFiles([]);
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

  // Animation variants
  const uploadOptionsVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
  };

  const optionItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    },
  };

  const dragOverlayVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  const filesContainerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 },
    },
  };

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
                              <img
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
                            <img
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
          className="w-full resize-none bg-transparent text-white placeholder-gray-400 p-4 pb-12 pr-4 text-base outline-none"
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
              <IoAttach className="text-xl" />
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

          {/* MODEL PICKER */}
          <div className="relative" ref={menuRef}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            </motion.div>

            <AnimatePresence>
              {llmModelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2
                   w-72 bg-gray-800 text-sm text-gray-200 rounded-xl
                   shadow-lg border border-gray-700/60 custom-scrollbar z-50 max-h-72 overflow-y-auto"
                >
                  {allLLMModels.map((m: any, index: number) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
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
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-cyan-400 flex-shrink-0"
                          >
                            ✔
                          </motion.span>
                        )}
                      </div>
                      <p className="text-xs mt-1 text-gray-400 line-clamp-1">
                        {m.description}
                      </p>
                    </motion.button>
                  ))}
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
                  strokeWidth={
                    userCurrentMessage.content.trim() ||
                    uploadedFiles.length > 0
                      ? 2.5
                      : 2
                  }
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
