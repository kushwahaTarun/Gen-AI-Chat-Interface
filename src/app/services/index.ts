import axios from "axios";
import toast from "react-hot-toast";

const applicationBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://openrouter.ai/api/v1";

// header configuration for the request
const config = {
    headers: {
        'Content-Type': 'application/json',
    }
};

// Function to *QUERY ANSWER STREAM* from OpenRouter API
export async function queryAnswerStream(body: any) {

    try{
        // making a POST request to the OpenRouter API to get the answer stream
        const response = await axios.post(`/api/chat`, body, config);
        return response;
    }
    catch(error) {
        toast.error("Failed to fetch models. Please try again later.");
    }

}

// Function to get all LLM models from OpenRouter API
export async function getAllLLMModels() {
    
        const response = await axios.get(`${applicationBaseUrl}/models`);
        return response;
    
}