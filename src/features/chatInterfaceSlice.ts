// Update your Redux slice to store only serializable user data

import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Message } from '@/interfaces/chat';

// Create a serializable user interface
export interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// interfaces for the chat state
export interface ChatState {
  isSidebarOpen: boolean;
  userSelectedLLMModel: string;
  userSelectedLLMModelId: string;
  userCurrentMessage: Message;
  isResponseStreaming: boolean;
  currentConversationId: string;
  messages: Message[];
  loggedInUser: SerializableUser | null; // Changed to serializable user
  llmModelDropdownOpen: boolean;
  allLLMModels: Array<{ id: string; name: string; }>;
}

// initial state for the chat slice
const initialState: ChatState = {
  isSidebarOpen: false,
  userSelectedLLMModel: "openai/gpt-3.5-turbo",
  userSelectedLLMModelId: "openai/gpt-3.5-turbo",
  userCurrentMessage: {
    role: "user",
    content: "",
    isComplete: true
  },
  isResponseStreaming: false,
  currentConversationId: "",
  messages: [],
  loggedInUser: null, // Now stores serializable user data
  llmModelDropdownOpen: false,
  allLLMModels: [],
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // action to toggle the sidebar visibility
    setIsSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    // action to set the user selected LLM model
    setUserSelectedModel: (state, action: PayloadAction<string>) => {
      state.userSelectedLLMModel = action.payload;
    },
    // action to set the user selected LLM model
    setUserSelectedLLMModelId: (state, action: PayloadAction<string>) => {
      state.userSelectedLLMModelId = action.payload;
    },
    // action to set the user's query input
    setUserCurrentMessage: (state, action: PayloadAction<Message>) => {
      state.userCurrentMessage = action.payload;
    },
    // action to set if the AI response is still streaming
    setIsResponseStreaming: (state, action) => {
      state.isResponseStreaming = action.payload;
    },
    // action to set the current conversation ID
    setCurrentConversationId: (state, action) => {
      state.currentConversationId = action.payload;
    },
    // action to update the state of the **loggedInUser**
    setLoggedInUser: (state, action: PayloadAction<SerializableUser | null>) => {
      state.loggedInUser = action.payload;
    },
    // action to set the messages in the chat
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    // action to toggle the dropdown menu for LLM models
    setLLMModelDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.llmModelDropdownOpen = action.payload;
    },
    // action to set all LLM models fetched from the API
    setAllLLMModels: (state, action: PayloadAction<Array<{ id: string; name: string; }>>)=> {
      state.allLLMModels = action.payload;
    }
  },
})

// Action creators are generated for each case reducer function
export const { 
  setIsSidebarOpen, 
  setUserSelectedModel, 
  setUserSelectedLLMModelId, 
  setUserCurrentMessage, 
  setIsResponseStreaming, 
  setCurrentConversationId, 
  setLoggedInUser, 
  setMessages, 
  setLLMModelDropdownOpen, 
  setAllLLMModels 
} = chatSlice.actions

export default chatSlice.reducer