import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// interfaces for the chat state
export interface ChatState {
  userSelectedLLMModel: string;
  userSelectedLLMModelId: string;
  userCurrentMessage:{
    role: string,
    content: string,
  },
  messages: any[];
  llmModelDropdownOpen: boolean;
  allLLMModels: any[];
}

// initial state for the chat slice
const initialState: ChatState = {
  userSelectedLLMModel: "openai/gpt-3.5-turbo",  // stores the user selected LLM model from the dropdown
  userSelectedLLMModelId: "openai/gpt-3.5-turbo", // stores the user selected LLM model ID
  userCurrentMessage:{
    role: "user",
    content: "", // stores the current message from the user
  },
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
    setUserCurrentMessage: (state, action: PayloadAction<{ role: string; content: string }>) => {
        state.userCurrentMessage = action.payload;
    },
    // action to set the messages in the chat
    setMessages: (state, action: PayloadAction<any[]>) => {
      state.messages = action.payload; 
    },
    // action to toggle the dropdown menu for LLM models
    setLLMModelDropdownOpen: (state, action: PayloadAction<boolean>) => {
        state.llmModelDropdownOpen = action.payload;
    },
    // action to set all LLM models fetched from the API
    setAllLLMModels: (state, action: PayloadAction<any[]>) => {
        state.allLLMModels = action.payload;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setUserSelectedModel, setUserSelectedLLMModelId, setUserCurrentMessage, setMessages, setLLMModelDropdownOpen, setAllLLMModels } = chatSlice.actions

export default chatSlice.reducer