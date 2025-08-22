import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { Message } from '@/app/interfaces/chat';

// interfaces for the chat state
export interface ChatState {
  userSelectedLLMModel: string;
  userSelectedLLMModelId: string;
  userCurrentMessage: Message;
  isResponseStreaming: boolean;
  currentConversationId: string;
  messages: Message[];
  llmModelDropdownOpen: boolean;
  allLLMModels: Array<{ id: string; name: string; }>;
}

// initial state for the chat slice
const initialState: ChatState = {
  userSelectedLLMModel: "openai/gpt-3.5-turbo",  // stores the user selected LLM model from the dropdown
  userSelectedLLMModelId: "openai/gpt-3.5-turbo", // stores the user selected LLM model ID
  userCurrentMessage:{
    role: "user",
    content: "", // stores the current message from the user
    isComplete: true
  },
  isResponseStreaming: false, // indicates if the AI response is still streaming
  currentConversationId: "", // stores the current conversation ID
  messages: [], // stores the user and the AI messages in the chat
  llmModelDropdownOpen: false, // state to manage the dropdown menu for LLM models
  allLLMModels: [], // state variable to store all LLM models fetched from the API
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
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
export const { setUserSelectedModel, setUserSelectedLLMModelId, setUserCurrentMessage, setIsResponseStreaming, setCurrentConversationId, setMessages, setLLMModelDropdownOpen, setAllLLMModels } = chatSlice.actions

export default chatSlice.reducer