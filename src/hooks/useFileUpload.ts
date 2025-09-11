import {useState} from "react";
import {toast} from "react-hot-toast";

import {SupportedMedia, UploadedFile} from "@/interfaces/chat";

export default function useFileUpload() {

const [supportedMedia] = useState<SupportedMedia>(
    parseSupportedMedia("images,videos,documents")
  );

  // Media upload states
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);

    // Parse supported media types from ConfigCat string
function parseSupportedMedia(supportedTypes: string): SupportedMedia {
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
  }

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };
  
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
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
    return {
parseSupportedMedia,handleDragOver, handleDragLeave, handleDrop, supportedMedia, isDragOver, handleFileUpload, uploadedFiles, setUploadedFiles, isUploading, showUploadOptions, setShowUploadOptions
    }
}