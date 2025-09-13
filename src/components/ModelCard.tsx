import { useState, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HiCpuChip } from "react-icons/hi2";

import { ModelArchitecture } from "../interfaces/chat";
import useModelManagement from "../hooks/useModelManagement";

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

  // Importing the helper function from useModelManagement
  const { getModelPurpose } = useModelManagement();

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

export default ModelCard;
