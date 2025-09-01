"use client";
import Image from "next/image";
import { MdOutlineAddCircle } from "react-icons/md";
import { HiOutlineTrash } from "react-icons/hi";
import { signOut, getAuth } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import toast from "react-hot-toast";

import user from "../../public/user.png";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "./Sidebar";
import {
  setCurrentConversationId,
  setMessages,
} from "@/features/chatInterfaceSlice";

export default function AppSidebar() {
  // Get the current user from Firebase authentication
  const auth = getAuth();
  const dispatch = useDispatch();

  // Get state from Redux
  const { loggedInUser, currentConversationId } = useSelector(
    (state: RootState) => state.chat
  );

  // Get conversation history using the custom hook
  const { conversations, loading, error, deleteConversation } =
    useConversationHistory(loggedInUser);

  const data = useSidebar();

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    if (conversationId !== currentConversationId) {
      console.log("Switching to conversation:", conversationId);
      dispatch(setCurrentConversationId(conversationId));
      // Messages will be loaded automatically by the existing useEffect in your Home component
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent switching to conversation when deleting

    const success = await deleteConversation(conversationId);

    if (success) {
      toast.success("Conversation deleted");

      // If we deleted the current conversation, start a new one
      if (conversationId === currentConversationId) {
        // Generate a unique conversation ID
        const newConversationId =
          "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);

        console.log("Starting new chat after delete:", newConversationId);
        dispatch(setMessages([]));
        dispatch(setCurrentConversationId(newConversationId));
      }
    } else {
      toast.error("Failed to delete conversation");
    }
  };

  // Format date for display
  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return "";

    // Parse ISO string to Date object
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  // Define the links for the sidebar - using string for clickEvent as expected by your SidebarLink
  const links = [
    {
      label: "New chat",
      clickEvent: "handleNewChat", // String that matches the function name in your Sidebar component
      icon: (
        <MdOutlineAddCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
  ];

  // if user is not logged into the platform we will not be displaying the sidebar
  if (loggedInUser === null) {
    return;
  }

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <span className="font-medium text-black text-lg dark:text-white whitespace-pre">
              Baangdu AI
            </span>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {/* Section that will display the conversation history of the user */}
          {data.open && (
            <AnimatePresence>
              <motion.section
                className="mt-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 px-2">
                  Recent Conversations
                </div>

                {/* Conversation History */}
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-xs text-neutral-500 px-2">
                      Loading conversations...
                    </div>
                  ) : error ? (
                    <div className="text-xs text-red-500 px-2">{error}</div>
                  ) : conversations.length === 0 ? (
                    <div className="text-xs text-neutral-500 px-2">
                      No conversations yet
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={`group relative p-2 hover:bg-black rounded-lg cursor-pointer transition-all duration-200 ${
                          conversation.id === currentConversationId
                            ? "bg-blue-500/20 border border-blue-500/30"
                            : "hover:bg-neutral-100 dark:hover:bg-black"
                        }`}
                        onClick={() =>
                          handleConversationSelect(conversation.id)
                        }
                      >
                        <div className="flex items-between justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {conversation.title}
                              </h3>
                              {/* Display message count */}
                              <span className="text-xs text-neutral-400 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full ml-2">
                                {conversation.messages?.length || 0}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                              {conversation.lastMessage}
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                              {formatDate(conversation.lastActivity)}
                            </p>
                          </div>

                          <button
                            onClick={(e) =>
                              handleDeleteConversation(conversation.id, e)
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all ml-2 cursor-pointer"
                            title="Delete conversation"
                          >
                            <HiOutlineTrash className="text-base text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.section>
            </AnimatePresence>
          )}

          {/* Section that will display the user profile and the settings option */}
          <section className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-x-2">
              {/* Profile icon */}
              <Image
                id="dropdownUserAvatarButton"
                className="cursor-pointer hover:opacity-80 transition-opacity rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500"
                src={loggedInUser?.photoURL || user}
                height={40}
                width={40}
                onClick={() => {
                  if (window.confirm("Are you sure you want to sign out?")) {
                    signOut(auth);
                  }
                }}
                alt="profile icon"
                title="Click to sign out"
              />

              {/* User info when sidebar is open */}
              {data.open && loggedInUser && (
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {loggedInUser.displayName || "User"}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {loggedInUser.email}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
