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
} from "react-icons/io5";
import { motion, AnimatePresence, Variants } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { ModelArchitecture, architecture } from "../interfaces/chat";
import { getAllLLMModels } from "../services";
import {
  setUserSelectedModel,
  setUserSelectedLLMModelId,
  setUserCurrentMessage,
  setLLMModelDropdownOpen,
  setAllLLMModels,
} from "../features/chatInterfaceSlice";
import useChat from "@/hooks/useChat";
import { RootState } from "@/store/store";
import Image from "next/image";
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "../interfaces/chat";

// interface for the props of TextareaWithButtons component
interface TextareaWithButtonsProps {
  placeholder?: string;
  className?: string;
  isResponseStreaming: boolean;
  supportedMediaTypes?: string;
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

// Helper functions for model processing
const parseCapabilities = (architecture: architecture) => {
  const capabilities = ["text"]; // All models support text
  if (architecture?.input_modalities?.includes("image"))
    capabilities.push("image");
  if (architecture?.input_modalities?.includes("audio"))
    capabilities.push("audio");
  if (architecture?.input_modalities?.includes("file"))
    capabilities.push("file");
  return capabilities;
};

const getModelPurpose = (model: ModelArchitecture) => {
  const desc = model.description?.toLowerCase() || "";
  const name = model.name.toLowerCase();
  const specialties = model.specialties || [];

  // Check for specific model types first
  if (
    name.includes("coder") ||
    name.includes("codestral") ||
    name.includes("devstral")
  ) {
    return {
      label: "Code Generation",
      color: "text-green-400",
      bg: "bg-green-500/20",
    };
  }

  if (
    name.includes("r1") ||
    name.includes("reasoning") ||
    name.includes("thinking") ||
    desc.includes("reasoning") ||
    desc.includes("thinking")
  ) {
    return {
      label: "Advanced Reasoning",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    };
  }

  if (
    name.includes("vision") ||
    name.includes("vl") ||
    name.includes("multimodal") ||
    specialties.includes("vision") ||
    specialties.includes("multimodal")
  ) {
    return {
      label: "Vision & Images",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    };
  }

  if (name.includes("search") || desc.includes("search")) {
    return {
      label: "Web Search",
      color: "text-orange-400",
      bg: "bg-orange-500/20",
    };
  }

  if (
    name.includes("creative") ||
    desc.includes("creative") ||
    desc.includes("story")
  ) {
    return {
      label: "Creative Writing",
      color: "text-pink-400",
      bg: "bg-pink-500/20",
    };
  }

  if (
    name.includes("math") ||
    desc.includes("mathematical") ||
    desc.includes("math")
  ) {
    return {
      label: "Mathematics",
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
    };
  }

  if (
    name.includes("agent") ||
    desc.includes("agent") ||
    desc.includes("tool")
  ) {
    return { label: "AI Agents", color: "text-cyan-400", bg: "bg-cyan-500/20" };
  }

  if (
    name.includes("mini") ||
    name.includes("nano") ||
    name.includes("lite") ||
    name.includes("fast")
  ) {
    return {
      label: "Fast & Efficient",
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    };
  }

  if (name.includes("pro") || name.includes("opus") || name.includes("ultra")) {
    return {
      label: "Premium Quality",
      color: "text-indigo-400",
      bg: "bg-indigo-500/20",
    };
  }

  // Default based on general capabilities
  if (specialties.includes("coding")) {
    return {
      label: "Code Generation",
      color: "text-green-400",
      bg: "bg-green-500/20",
    };
  }

  if (specialties.includes("creative")) {
    return {
      label: "Creative Writing",
      color: "text-pink-400",
      bg: "bg-pink-500/20",
    };
  }

  return {
    label: "General Purpose",
    color: "text-gray-400",
    bg: "bg-gray-500/20",
  };
};

const extractSpecialties = (description: string) => {
  const specialties = [];
  const desc = description.toLowerCase();

  if (desc.includes("reasoning") || desc.includes("thinking"))
    specialties.push("reasoning");
  if (desc.includes("code") || desc.includes("coding"))
    specialties.push("coding");
  if (desc.includes("vision") || desc.includes("image"))
    specialties.push("vision");
  if (desc.includes("creative") || desc.includes("story"))
    specialties.push("creative");
  if (desc.includes("agent") || desc.includes("tool"))
    specialties.push("agents");
  if (desc.includes("multimodal")) specialties.push("multimodal");
  if (desc.includes("open") && desc.includes("source"))
    specialties.push("open-source");

  if (specialties.length === 0) specialties.push("general");
  return specialties;
};

const determineSpeed = (model: ModelArchitecture) => {
  if (model.context_length > 500000) return "slow";
  if (
    model.context_length < 50000 ||
    model.name.includes("nano") ||
    model.name.includes("fast")
  )
    return "fast";
  return "medium";
};

const determineQuality = (
  model: ModelArchitecture
): "premium" | "high" | "good" => {
  const prompt = parseFloat(String(model.pricing?.prompt || 0));
  if (prompt > 0.000005) return "premium";
  if (prompt > 0.0000005) return "high";
  return "good";
};

const isPopularModel = (id: string) => {
  const popularIds = [
    "openai/gpt-5",
    "deepseek/deepseek-chat-v3.1",
    "anthropic/claude-opus-4.1",
    "openai/gpt-oss-20b:free",
    "qwen/qwen3-coder:free",
  ];
  return popularIds.includes(id);
};

const processModelData = (model: ModelArchitecture) => ({
  ...model,
  capabilities: parseCapabilities(model.architecture),
  specialties: extractSpecialties(model.description || ""),
  speed: determineSpeed(model),
  quality: determineQuality(model),
  popular: isPopularModel(model.id),
});

// Simplified ModelCard Component
const ModelCard = ({
  model,
  index,
  selected,
  onSelect,
}: {
  model: ModelArchitecture;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) => {
  const [showHoverDetails, setShowHoverDetails] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const isModelFree = (model: ModelArchitecture) => {
    return (
      (!model.pricing?.prompt ||
        parseFloat(String(model.pricing.prompt)) === 0) &&
      (!model.pricing?.completion || parseFloat(model.pricing.completion) === 0)
    );
  };

  const formatContextLength = (length: number) => {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M tokens`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K tokens`;
    return `${length} tokens`;
  };

  const getInputOutputDetails = (model: ModelArchitecture) => {
    const inputs = [];
    const outputs = [];

    // Determine inputs
    if (model.capabilities?.includes("text")) inputs.push("Text");
    if (model.capabilities?.includes("image")) inputs.push("Images");
    if (model.capabilities?.includes("audio")) inputs.push("Audio");
    if (model.capabilities?.includes("file")) inputs.push("Documents");

    // Most models output text, some can generate images
    outputs.push("Text");
    if (
      model.specialties?.includes("creative") ||
      model.name.toLowerCase().includes("dall-e") ||
      model.name.toLowerCase().includes("imagen")
    ) {
      outputs.push("Images");
    }

    return {
      input: inputs.length > 0 ? inputs.join(", ") : "Text",
      output: outputs.join(", "),
    };
  };

  const getDataProcessingCapabilities = (model: ModelArchitecture) => {
    const capabilities = [];

    if (model.specialties?.includes("coding"))
      capabilities.push("Code Generation & Debugging");
    if (model.specialties?.includes("reasoning"))
      capabilities.push("Complex Problem Solving");
    if (model.specialties?.includes("creative"))
      capabilities.push("Creative Writing & Content");
    if (model.specialties?.includes("vision"))
      capabilities.push("Image Analysis & Description");
    if (model.capabilities?.includes("file"))
      capabilities.push("Document Processing");
    if (model.specialties?.includes("agents"))
      capabilities.push("Tool Usage & Function Calls");
    if (model.specialties?.includes("multimodal"))
      capabilities.push("Multi-format Data Processing");

    // Default capabilities for all models
    if (capabilities.length === 0) {
      capabilities.push(
        "Text Generation",
        "Question Answering",
        "Content Summarization"
      );
    }

    return capabilities;
  };

  const getPricingDetails = (model: ModelArchitecture) => {
    if (isModelFree(model)) {
      return {
        type: "Free",
        inputCost: "No cost",
        outputCost: "No cost",
        note: "Completely free to use with no usage limits",
      };
    } else {
      const inputPrice = model.pricing?.prompt
        ? parseFloat(String(model.pricing.prompt))
        : 0;
      const outputPrice = model.pricing?.completion
        ? parseFloat(model.pricing.completion)
        : 0;

      return {
        type: "Paid",
        inputCost:
          inputPrice > 0 ? `$${inputPrice.toFixed(6)} per token` : "No cost",
        outputCost:
          outputPrice > 0 ? `$${outputPrice.toFixed(6)} per token` : "No cost",
        note: "Pay per token usage with transparent pricing",
      };
    }
  };

  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (!description) return "Advanced AI model";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Get card position for tooltip placement
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: rect.right + 8,
        y: rect.top + rect.height / 2,
      });
    }

    const timeout = setTimeout(() => {
      setShowHoverDetails(true);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowHoverDetails(false);
  };

  const ioDetails = getInputOutputDetails(model);
  const pricingDetails = getPricingDetails(model);
  const dataCapabilities = getDataProcessingCapabilities(model);

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.01 }}
        className="mb-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative p-2.5 rounded-lg hover:bg-gray-700/60 transition cursor-pointer border ${
            selected
              ? "bg-gray-700/40 border-cyan-500/30"
              : "border-transparent hover:border-gray-600/50"
          }`}
          onClick={onSelect}
        >
          {/* Main Content - Compact Layout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center ${
                    isModelFree(model) ? "bg-green-500/20" : "bg-blue-500/20"
                  }`}
                >
                  <HiCpuChip
                    className={`w-2.5 h-2.5 ${
                      isModelFree(model) ? "text-green-400" : "text-blue-400"
                    }`}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {/* Model Name with Badges - Same Line */}
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3
                    className={`font-medium text-xs ${
                      selected ? "text-cyan-400" : "text-white"
                    }`}
                  >
                    {model.name}
                  </h3>

                  {/* Purpose Label */}
                  {(() => {
                    const purpose = getModelPurpose(model);
                    return (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${purpose.bg} ${purpose.color}`}
                        title={`Best for: ${purpose.label}`}
                      >
                        {purpose.label}
                      </span>
                    );
                  })()}

                  {/* Existing badges */}
                  {isModelFree(model) && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                      FREE
                    </span>
                  )}
                  {model.popular && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      ⭐ HOT
                    </span>
                  )}
                </div>

                {/* Description - Single Line Only */}
                <p className="text-xs text-gray-500 truncate leading-tight">
                  {truncateDescription(model.description)}
                </p>
              </div>
            </div>

            {/* Selection Indicator */}
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center ml-2"
              >
                <svg
                  className="w-2 h-2 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Citation-Style Information Panel */}
      <AnimatePresence>
        {showHoverDetails && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed z-[9999] w-80 bg-gray-900/98 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/60 overflow-hidden"
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
              transform: "translateY(-50%)",
            }}
            onMouseEnter={() => {
              if (hoverTimeout) clearTimeout(hoverTimeout);
              setShowHoverDetails(true);
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header with Model Info */}
            <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 p-4 border-b border-gray-600/30">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isModelFree(model) ? "bg-green-500/20" : "bg-blue-500/20"
                  }`}
                >
                  <HiCpuChip
                    className={`w-4 h-4 ${
                      isModelFree(model) ? "text-green-400" : "text-blue-400"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white text-sm">
                      {model.name}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isModelFree(model)
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {pricingDetails.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {model.description || "Advanced AI model for various tasks"}
                  </p>
                </div>
              </div>
            </div>

            {/* Input/Output Section */}
            <div className="p-4 border-b border-gray-700/30">
              <h5 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8"
                  />
                </svg>
                Input/Output Capabilities
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Input Types</div>
                  <div className="text-sm font-medium text-white">
                    {ioDetails.input}
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Output Types</div>
                  <div className="text-sm font-medium text-white">
                    {ioDetails.output}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Details Section */}
            <div className="p-4 border-b border-gray-700/30">
              <h5 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Pricing Information
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Input Cost:</span>
                  <span className="text-xs font-medium text-white">
                    {pricingDetails.inputCost}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Output Cost:</span>
                  <span className="text-xs font-medium text-white">
                    {pricingDetails.outputCost}
                  </span>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-2 mt-2">
                  <p className="text-xs text-gray-300">{pricingDetails.note}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="p-4 border-b border-gray-700/30">
              <h5 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Technical Specs
              </h5>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">Context</div>
                  <div className="text-xs font-medium text-white">
                    {formatContextLength(model.context_length)}
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">Speed</div>
                  <div
                    className={`text-xs font-medium ${
                      model.speed === "fast"
                        ? "text-green-400"
                        : model.speed === "medium"
                        ? "text-yellow-400"
                        : "text-orange-400"
                    }`}
                  >
                    {model.speed}
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">Quality</div>
                  <div
                    className={`text-xs font-medium ${
                      model.quality === "premium"
                        ? "text-purple-400"
                        : model.quality === "high"
                        ? "text-blue-400"
                        : "text-gray-400"
                    }`}
                  >
                    {model.quality}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Processing Capabilities */}
            <div className="p-4 border-b border-gray-700/30">
              <h5 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                Processing Capabilities
              </h5>
              <div className="space-y-1.5">
                {dataCapabilities.map((capability, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialties & Use Cases */}
            <div className="p-4">
              <h5 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Best Use Cases
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {model.specialties?.map((specialty: string) => (
                  <span
                    key={specialty}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs capitalize font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {/* Provider Info */}
              <div className="mt-3 pt-3 border-t border-gray-700/30">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400">Provider: </span>
                    <span className="text-white font-medium">
                      {model.name.split("/")[0] || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">ID: </span>
                    <span className="text-gray-300 font-mono">{model.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow pointing to the model card */}
            <div className="absolute left-0 top-1/2 -ml-2 w-4 h-4 bg-gray-900/98 border-l border-t border-gray-700/60 rotate-45 -translate-y-1/2"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const PriceDisplay = ({ label, price }: { label: string; price: string }) => {
  const formatPrice = (price: string) => {
    if (!price || parseFloat(price) === 0) return "Free";
    const num = parseFloat(price);
    if (num < 0.000001) return `$${(num * 1000000).toFixed(2)}/M`;
    if (num < 0.001) return `$${(num * 1000).toFixed(3)}/K`;
    return `$${num.toFixed(6)}`;
  };

  const isFree = !price || parseFloat(price) === 0;

  return (
    <div>
      <span className="text-gray-500">{label}:</span>
      <span
        className={`ml-1 font-medium ${
          isFree ? "text-green-400" : "text-white"
        }`}
      >
        {formatPrice(price)}
      </span>
    </div>
  );
};

const TextareaWithButtons: React.FC<TextareaWithButtonsProps> = ({
  placeholder = "Ask me anything...",
  className = "",
  isResponseStreaming,
  supportedMediaTypes = "images,videos,documents",
}) => {
  // using dispatch from redux to manage state
  const dispatch = useDispatch();

  // Add these state variables with your other useState declarations
  const [modelSearchQuery, setModelSearchQuery] = useState("");

  const { stopStream, handleQuerySubmit } = useChat();

  // accessing the state from redux
  const {
    userSelectedLLMModel,
    allLLMModels,
    userCurrentMessage,
    llmModelDropdownOpen,
  } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    if (!llmModelDropdownOpen) {
      setModelSearchQuery("");
    }
  }, [llmModelDropdownOpen]);

  // Add this function to filter models based on search
  const getFilteredModels = () => {
    if (!modelSearchQuery.trim()) {
      return processedModels;
    }

    const query = modelSearchQuery.toLowerCase();
    return processedModels.filter((model) => {
      const name = model.name.toLowerCase();
      const description = (model.description || "").toLowerCase();
      const provider = model.name.split("/")[0].toLowerCase();
      const purpose = getModelPurpose(model).label.toLowerCase();
      const specialties = (model.specialties || []).join(" ").toLowerCase();

      return (
        name.includes(query) ||
        description.includes(query) ||
        provider.includes(query) ||
        purpose.includes(query) ||
        specialties.includes(query)
      );
    });
  };

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
    const acceptedTypes = [];
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
  const speechRecognitionRef = useRef<null | SpeechRecognition>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process models when they're fetched
  const processedModels = allLLMModels.map(processModelData);

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
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

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
        speechRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
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

      speechRecognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Speech recognition failed. Please try again.");
      };
    }
  }, [dispatch, userCurrentMessage]);

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
  const handleModelChange = (model: ModelArchitecture) => {
    console.warn("Selected model:", model);

    dispatch(setUserSelectedModel(model.name));
    dispatch(setUserSelectedLLMModelId(model.id));
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

  // Helper function to check if model is free
  const isModelFree = (model: ModelArchitecture) => {
    return (
      (!model.pricing?.prompt ||
        parseFloat(String(model.pricing.prompt)) === 0) &&
      (!model.pricing?.completion || parseFloat(model.pricing.completion) === 0)
    );
  };

  // Animation variants
  const uploadOptionsVariants: Variants = {
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

  const optionItemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    },
  };

  const dragOverlayVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  const filesContainerVariants: Variants = {
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
