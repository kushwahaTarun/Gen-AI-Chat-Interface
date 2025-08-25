"use client";
import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LuCopy } from "react-icons/lu";
import { TbFileExport, TbRepeat } from "react-icons/tb";
import { FaCirclePause, FaCheck } from "react-icons/fa6";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RxSpeakerLoud } from "react-icons/rx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import type { User } from "firebase/auth";

import SignInPage from "@/app/Signin/page";
import user from "../../public/user.png";
import AI2 from "../../public/AI2.png";
import RotatingIcon from "../components/RotatingIcon";
import TextareaWithButtons from "../components/TextareaWithButtons";
import { useSpeechSynthesis } from "@/hooks/useTextToSpeech";
import {
  setUserCurrentMessage,
  setIsResponseStreaming,
  setCurrentConversationId,
  setMessages,
} from "@/features/chatInterfaceSlice";

// creating a new auth instance
const auth = getAuth();

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // creating a reference to the AbortController
  const controllerRef = useRef<AbortController | null>(null);

  // destructuring the functions from the custom hook
  const { handleSpeak, handleTextToSpeechPause } = useSpeechSynthesis();

  // accessing the state from redux
  const {
    userSelectedLLMModelId,
    userCurrentMessage,
    isResponseStreaming,
    currentConversationId,
    messages,
  } = useSelector((state: any) => state.chat);

  console.warn("messages", messages);

  // creating a dispatch function to dispatch actions to the redux store
  const dispatch = useDispatch();

  // state that will store the details of the logged-in user
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // state to manage the icons and the text to speech response behaviour
  const [pauseTextToSpeech, setPauseTextToSpeech] = useState(false);

  // state to display the user a notification for the copied message status
  const [copyStatus, setCopyStatus] = useState("Copy");

  // Scroll to the bottom of the messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  // Auto-scroll when streaming starts
  useEffect(() => {
    if (isResponseStreaming) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isResponseStreaming]);

  // Generate new conversation ID when component mounts or when starting new chat
  useEffect(() => {
    dispatch(setCurrentConversationId("chat-" + Date.now()));
  }, []);

  // triggers once the component is mounted on the screen
  useEffect(() => {
    // checking the authentication state of the user
    try {
      // function that will be triggered when the authentication state changes
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, set the logged-in user state
          setLoggedInUser(user);

          // Load messages for current conversation when user logs in
          if (currentConversationId) {
            loadConversationMessages(user.uid, currentConversationId);
          }
        } else {
          setLoggedInUser(null);
          dispatch(setMessages([]));
        }
      });
    } catch {
      // handling any errors that occur during the authentication state check
      toast.error(
        "Error checking authentication state. Please try again later."
      );
      setLoggedInUser(null);
    }
  }, [currentConversationId]);

  // Load conversation messages in real-time
  const loadConversationMessages = (
    userUid: string,
    conversationId: string
  ) => {
    const messagesRef = collection(
      db,
      "users",
      userUid,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
      const loadedMessages: any[] = [];
      snapshot.forEach((doc) => {
        const messageData = doc.data();
        loadedMessages.push({
          id: doc.id,
          role: messageData.isBot ? "assistant" : messageData.role,
          content: messageData.content,
          isComplete: messageData.isComplete,
          timestamp: messageData.timestamp,
        });
      });
      dispatch(setMessages(loadedMessages));
    });
  };

  // Create or update conversation metadata
  async function updateConversationInfo(
    userUid: string,
    conversationId: string,
    lastMessage: string,
    title?: string
  ) {
    const conversationRef = doc(
      db,
      "users",
      userUid,
      "conversations",
      conversationId
    );

    const updateData: any = {
      lastMessage: lastMessage,
      lastActivity: serverTimestamp(),
    };

    // Set title only for first message
    if (title) {
      updateData.title =
        title.length > 50 ? title.substring(0, 50) + "..." : title;
      updateData.createdAt = serverTimestamp();
    }

    await setDoc(conversationRef, updateData, { merge: true });
  }

  // triggers when the user submits a query and this will save the user message
  // to the Firestore database
  async function saveUserMessage(
    userUid: string,
    conversationId: string,
    userCurrentMessage: {
      [key: string]: string;
    }
  ) {
    try {
      const messageRef = await addDoc(
        collection(
          db,
          "users",
          userUid,
          "conversations",
          conversationId,
          "messages"
        ),
        {
          content: userCurrentMessage.content,
          role: userCurrentMessage.role,
          isBot: false,
          isComplete: true,
          timestamp: serverTimestamp(),
        }
      );
      return messageRef.id;
    } catch (error) {
      console.error("Error saving user message:", error);
      throw error;
    }
  }

  async function createBotMessage(userUid: string, conversationId: string) {
    try {
      // Create an empty bot message first
      const messageRef = await addDoc(
        collection(
          db,
          "users",
          userUid,
          "conversations",
          conversationId,
          "messages"
        ),
        {
          content: "", // Start empty
          role: "assistant",
          isBot: true,
          isComplete: false, // Not complete yet
          timestamp: serverTimestamp(),
        }
      );
      return messageRef.id; // Return message ID to update later
    } catch (error) {
      console.error("Error creating bot message:", error);
      throw error;
    }
  }

  // Update bot message during streaming
  async function updateBotMessage(
    userUid: string,
    conversationId: string,
    messageId: string,
    content: string,
    isComplete: boolean = false
  ) {
    try {
      await updateDoc(
        doc(
          db,
          "users",
          userUid,
          "conversations",
          conversationId,
          "messages",
          messageId
        ),
        {
          content: content,
          isComplete: isComplete,
        }
      );
    } catch (error) {
      console.error("Error updating bot message:", error);
    }
  }

  // triggers when the user clicks on the stop streaming button
  const stopStream = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch(setIsResponseStreaming(false));
  };

  // triggers and copy the message
  const handleMessageCopy = async (messageContent: string) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      // updating the status to display user a status
      setCopyStatus("Copied");

      // clearing the state to remove the copied status after 2 second
      setTimeout(() => {
        setCopyStatus("Copy");
      }, 2000);
    } catch (err) {
      console.error("Error copying the message content", err);

      // updating the status to display user a status
      setCopyStatus("Failed to copy the message");

      // clearing the state to remove the copied status after 2 second
      setTimeout(() => {
        setCopyStatus("Copy");
      }, 2000);
    }
  };

  // triggers when the user submits a query
  const handleQuerySubmit = async () => {
    if (!loggedInUser || !userCurrentMessage?.content) {
      toast.error(
        "Please make sure you're logged in and have entered a message."
      );
      return;
    }

    // Cleanup any prior controller
    controllerRef.current?.abort();

    // Set streaming state to true
    dispatch(setIsResponseStreaming(true));

    try {
      // creating a new AbortController instance
      const controller = new AbortController();
      controllerRef.current = controller; // Store the controller reference

      // clearing the current textarea input
      dispatch(
        setUserCurrentMessage({
          role: "user",
          content: "", // stores the current message from the user
        })
      );

      // 1. Save user message to Firestore
      await saveUserMessage(
        loggedInUser.uid,
        currentConversationId,
        userCurrentMessage
      );

      // 2. Update conversation metadata (set title for first message)
      const isFirstMessage = messages.length === 0;
      await updateConversationInfo(
        loggedInUser.uid,
        currentConversationId,
        userCurrentMessage.content,
        isFirstMessage ? userCurrentMessage.content : undefined
      );

      // 3. Create empty bot message in Firestore
      const botMessageId = await createBotMessage(
        loggedInUser.uid,
        currentConversationId
      );

      // 4. Call OpenAI API
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          model: userSelectedLLMModelId, // passing the selected model id to an api
          messages: [...messages, userCurrentMessage],
        }),
        signal: controller.signal, // attach signal
        headers: {
          "Content-Type": "application/json",
        },
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let fullResponse = "";
      let updateCount = 0;

      while (true) {
        const { done, value } = await reader?.read();

        if (done) {
          // Stream ended normally
          controllerRef.current = null;

          // Mark bot message as complete in Firestore
          await updateBotMessage(
            loggedInUser.uid,
            currentConversationId,
            botMessageId,
            fullResponse,
            true
          );

          // Update conversation with bot's response
          await updateConversationInfo(
            loggedInUser.uid,
            currentConversationId,
            fullResponse
          );

          dispatch(setIsResponseStreaming(false));
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });

        buffer += chunk;

        // Split by lines to handle multiple JSON objects
        const lines = buffer.split("\n");

        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();

          // Skip empty lines and "data: " prefix if present
          if (
            !trimmedLine ||
            trimmedLine === "data: [DONE]" ||
            trimmedLine === "[DONE]"
          ) {
            continue;
          }

          // Remove "data: " prefix if present
          const jsonStr = trimmedLine.startsWith("data: ")
            ? trimmedLine.slice(6)
            : trimmedLine;

          try {
            const parsed = JSON.parse(jsonStr);

            // Extract content from the delta
            const content = parsed.choices?.[0]?.delta?.content || "";

            if (content) {
              fullResponse += content;
              updateCount++;

              // Update bot message in Firestore with partial response
              await updateBotMessage(
                loggedInUser.uid,
                currentConversationId,
                botMessageId,
                fullResponse,
                false
              );

              // Auto-scroll during streaming (every few updates to avoid too frequent scrolling)
              if (updateCount % 3 === 0) {
                setTimeout(scrollToBottom, 50);
              }
            }

            // Check if streaming is complete
            if (parsed.choices?.[0]?.finish_reason === "stop") {
              // Mark as complete in Firestore
              await updateBotMessage(
                loggedInUser.uid,
                currentConversationId,
                botMessageId,
                fullResponse,
                true
              );

              // Update conversation metadata
              await updateConversationInfo(
                loggedInUser.uid,
                currentConversationId,
                fullResponse
              );

              dispatch(setIsResponseStreaming(false));
              break;
            }
          } catch (parseError) {
            console.warn("Failed to parse JSON:", jsonStr, parseError);
          }
        }
      }

      // checking if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err: unknown) {
      // If the error is an AbortError, we can ignore it
      if (err.name === "AbortError") {
        return;
      }

      // Set streaming state to false on error
      dispatch(setIsResponseStreaming(false));

      // handling any errors that occur during the API call
      if (err instanceof Error) {
        toast.error(
          `Error fetching answer. Please try again later. ${err.message}`
        );
      } else {
        toast.error("Error fetching answer. Please try again later.");
      }
    }
  };

  // if the user is not logged in, return the SignInPage component
  // which will render the sign-in form
  if (loggedInUser === null) {
    return <SignInPage />;
  }

  return (
    <>
      <section
        className="w-full h-screen flex justify-center items-center relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0a0a0a 0%, #111111 25%, #1a1a1a 50%, #0f0f0f 100%)
          `,
        }}
      >
        {/* Animated floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-25 animate-pulse delay-2000"></div>
        </div>

        {/* Stores the page content and also the textarea for the user query */}
        <section
          className={`flex transition-all duration-500 flex-col items-center justify-around relative z-10 w-full ${
            messages.length ? "h-[85%]" : "h-[70%]"
          }`}
        >
          {/* Container that stores the icon, headings and the textarea field */}
          {!messages.length && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative">
                <Image
                  className="border-2 border-gray-700 rounded-full shadow-2xl"
                  src={AI2}
                  alt="AI icon"
                  width={120}
                  height={120}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20"></div>
              </div>
              <h3 className="text-gray-300 text-xl mt-8 font-light">
                Welcome to Baangdu AI
              </h3>
              <h1 className="text-white text-5xl mt-4 font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                How can I help?
              </h1>
            </div>
          )}

          {/* Display messages if there are any */}
          {messages.length ? (
            <div className="w-full flex-1 overflow-y-auto mb-6 p-4 rounded-xl custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {/* Messages will show streaming automatically via Firestore listener */}
                {messages.map((message: any, index: number) => (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className={`mb-6 w-full flex flex-col items-center`}
                  >
                    <div
                      className={`flex items-end gap-3 max-w-[60%] w-full ${
                        message.role === "user"
                          ? "flex-row-reverse justify-start" // User: avatar on right, message on left
                          : "flex-row justify-start" // Assistant: avatar on left, message on right
                      }`}
                    >
                      {/* Avatar */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                          delay: 0.1,
                        }}
                        className="flex-shrink-0 mb-1"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === "assistant"
                              ? "bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-500/50"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/50"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <Image
                              src={AI2}
                              alt="AI"
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          ) : (
                            <Image
                              src={user}
                              alt="User"
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          )}
                        </div>
                      </motion.div>

                      {/* Message Bubble */}
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.3,
                          x: message.role === "user" ? 30 : -30,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: 0,
                        }}
                        whileHover={{
                          scale: 1.02,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 1,
                        }}
                        className={`inline-block p-4 rounded-2xl shadow-lg transition-all duration-300 cursor-pointer ${
                          message.role === "assistant"
                            ? "bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-sm border border-slate-600/30 text-slate-100 shadow-slate-900/50 rounded-bl-md"
                            : "bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-sm border border-blue-400/20 text-white shadow-blue-500/30 rounded-br-md"
                        }`}
                      >
                        <motion.div
                          className="whitespace-pre-wrap break-words"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.2,
                            duration: 0.3,
                          }}
                        >
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                              }) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    language={match[1]}
                                    style={coldarkDark}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </Markdown>
                        </motion.div>
                        {message.role === "assistant" &&
                          !message.isComplete && (
                            <motion.span
                              className="ml-2 inline-block"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: 0.3,
                              }}
                            >
                              <RotatingIcon
                                isRotating={true}
                                variant="matrix"
                              />
                            </motion.span>
                          )}
                      </motion.div>
                    </div>

                    {/* Action buttons positioned below the message */}
                    {message.isComplete && (
                      <section
                        className={`flex mt-2 max-w-[60%] w-full ${
                          message.role == "user"
                            ? "justify-end pr-12"
                            : "justify-start pl-12"
                        }`}
                      >
                        {/* Icons on the left side of the response */}
                        <div className="flex justify-start w-1/2 space-x-4">
                          {/* Export option */}
                          <div className="text-gray-400 hover:text-white flex items-center cursor-pointer rounded-xl px-2 hover:bg-gray-800">
                            <TbFileExport />
                            <span className="ml-1 text-xs">Export</span>
                          </div>
                          {/* Rewrite option */}
                          <div className="text-gray-400 hover:text-white flex items-center cursor-pointer rounded-xl px-2 hover:bg-gray-800">
                            <TbRepeat />
                            <span className="ml-1 text-xs">Rewrite</span>
                          </div>
                        </div>

                        {/* Icons on the right of the response */}
                        <div className="flex items-center justify-end space-x-0.5 w-1/2">
                          <span
                            title={copyStatus}
                            className={`hover:bg-gray-800 text-gray-400 hover:text-white p-1.5 rounded`}
                          >
                            {copyStatus == "Copy" ? (
                              <LuCopy
                                className="cursor-pointer text-base"
                                onClick={() =>
                                  handleMessageCopy(message.content)
                                }
                              />
                            ) : (
                              <FaCheck className="text-base" />
                            )}
                          </span>
                          <span
                            title="Read Aloud"
                            className="hover:bg-gray-800 text-gray-400 hover:text-white p-1.5 rounded"
                          >
                            {!pauseTextToSpeech ? (
                              <RxSpeakerLoud
                                className="cursor-pointer text-base"
                                onClick={() =>
                                  handleSpeak(
                                    message.content,
                                    setPauseTextToSpeech
                                  )
                                }
                              />
                            ) : (
                              <FaCirclePause
                                className="cursor-pointer text-base"
                                onClick={() =>
                                  handleTextToSpeechPause(setPauseTextToSpeech)
                                }
                              />
                            )}
                          </span>
                        </div>
                      </section>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Invisible div for auto-scroll reference */}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            ""
          )}

          {/* Textarea for user input */}
          <div className="w-full max-w-2xl">
            <TextareaWithButtons
              placeholder="Ask me anything..."
              onSubmit={handleQuerySubmit}
              className="max-w-2xl"
              disabled={isResponseStreaming}
              isResponseStreaming={isResponseStreaming}
              stopStream={stopStream}
            />
          </div>
        </section>
      </section>
    </>
  );
}
