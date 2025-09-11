import { useState } from "react";
import { useSelector } from "react-redux";

import type { RootState } from "@/store/store";
import {Architecture, ModelArchitecture} from "../interfaces/chat";

export default function useModelManagement() {

    // Add these state variables with your other useState declarations
    const [modelSearchQuery, setModelSearchQuery] = useState("");

    const {allLLMModels} = useSelector((state: RootState) => state.chat);

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

    // function that filters models based on the search query
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

// Helper functions for model processing
const parseCapabilities = (architecture: Architecture) => {
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

const processModelData = (model: ModelArchitecture) => ({
  ...model,
  capabilities: parseCapabilities(model.architecture),
  specialties: extractSpecialties(model.description || ""),
  speed: determineSpeed(model),
  quality: determineQuality(model),
  popular: isPopularModel(model.id),
});

// Process models when they're fetched
  const processedModels = allLLMModels.map(processModelData);

    return {
parseCapabilities,
getModelPurpose,
getFilteredModels,
modelSearchQuery,
setModelSearchQuery,
processedModels,
}
}