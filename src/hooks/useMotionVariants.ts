import { Variants } from "framer-motion";

export default function useMotionVariants() {

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

    return {
uploadOptionsVariants, optionItemVariants, dragOverlayVariants, filesContainerVariants
    }
}