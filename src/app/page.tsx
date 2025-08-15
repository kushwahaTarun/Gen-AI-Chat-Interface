"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { db } from "@/lib/firebase";
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
import { onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

import SignInPage from "@/app/Signin/page";
import user from "../../public/user.png";
import AI2 from "../../public/AI2.png";
import TextareaWithButtons from "./components/TextareaWithButtons";
import {
  setUserCurrentMessage,
  setMessages,
} from "@/features/chatInterfaceSlice";
import toast from "react-hot-toast";

// creating a new auth instance
const auth = getAuth();

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // accessing the state from redux
  const { userSelectedLLMModelId, userCurrentMessage, messages } = useSelector(
    (state: any) => state.chat
  );

  // creating a dispatch function to dispatch actions to the redux store
  const dispatch = useDispatch();

  // state that will store the details of the logged-in user
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // state to manage the response streaming
  const [isResponseStreaming, setIsResponseStreaming] =
    useState<boolean>(false);

  console.warn("messages", messages);

  // Current conversation ID - you might want to make this dynamic
  const [currentConversationId, setCurrentConversationId] =
    useState<string>("");

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
    setCurrentConversationId("chat-" + Date.now());
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

  // triggers when the user submits a query
  const handleQuerySubmit = async () => {
    if (!loggedInUser || !userCurrentMessage?.content) {
      toast.error(
        "Please make sure you're logged in and have entered a message."
      );
      return;
    }

    console.warn("userCurrentMessage", userCurrentMessage);

    // Set streaming state to true
    setIsResponseStreaming(true);

    try {
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

          setIsResponseStreaming(false);
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

              setIsResponseStreaming(false);
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
      // Set streaming state to false on error
      setIsResponseStreaming(false);

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

  // Function to start a new conversation
  const startNewConversation = () => {
    setCurrentConversationId("chat-" + Date.now());
    dispatch(setMessages([]));
    setIsResponseStreaming(false);
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
            radial-gradient(ellipse at top, rgba(30, 41, 59, 0.3) 0%, transparent 70%),
            linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)
          `,
        }}
      >
        {/* Profile icon on the page */}
        <Image
          id="dropdownUserAvatarButton"
          className="absolute top-2 right-2 cursor-pointer z-50"
          data-dropdown-toggle="dropdownAvatar"
          src={user}
          height={40}
          onClick={() => signOut(auth)}
          alt="profile icon"
        />

        {/* New conversation button */}
        <button
          onClick={startNewConversation}
          className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg z-50 transition-colors"
        >
          New Chat
        </button>

        {/* Animated overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              linear-gradient(
                45deg,
                #1e1b4b,
                #312e81,
                #1e293b,
                #0f172a,
                #1e1b4b
              )
            `,
            backgroundSize: "400% 400%",
            animation: "gradientShift 8s ease-in-out infinite",
          }}
        />

        {/* Stores the page content and also the textarea for the user query */}
        <section
          className={`flex transition flex-col items-center justify-around relative z-10 w-[70%]  ${
            messages.length ? "h-[85%]" : "h-[70%]"
          }`}
        >
          {/* Container that stores the icon, headings and the textarea field */}
          {!messages.length && (
            <div className="flex flex-col items-center justify-center">
              <Image className="border" src={AI2} alt="AI icon" />
              <h3 className="text-gray-400 text-xl mt-6">
                Welcome to Baangdu AI
              </h3>
              <h1 className="text-white text-5xl mt-4 font-semibold">
                How can I help?
              </h1>
            </div>
          )}

          {/* Display messages if there are any */}
          {messages.length > 0 && (
            <div className="w-full max-w-4xl flex-1 overflow-y-auto mb-4 p-4 rounded-lg">
              {/* Messages will show streaming automatically via Firestore listener */}
              {messages.map((message: any, index: number) => (
                <div
                  key={message.id || index}
                  className={`mb-4 ${
                    message.role === "assistant" ? "text-left" : "text-right"
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                      message.role === "assistant"
                        ? "bg-gray-700 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {message.content}
                    {message.role === "assistant" && !message.isComplete && (
                      <span className="animate-pulse ml-1">▋</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Invisible div for auto-scroll reference */}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Textarea for user input */}
          <TextareaWithButtons
            placeholder="Ask me anything..."
            onSubmit={handleQuerySubmit}
            className="max-w-2xl"
            disabled={isResponseStreaming}
          />
        </section>
      </section>
    </>
  );
}
