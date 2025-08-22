import axios from "axios";
import toast from "react-hot-toast";

const applicationBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://openrouter.ai/api/v1";

// Function to *QUERY ANSWER STREAM* from OpenRouter API
interface ChatRequestBody {
    model: string;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        isComplete?: boolean;
    }>;
}

export async function queryAnswerStream(body: ChatRequestBody, onChunk: (content: string, isComplete: boolean) => void) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is null');
        }

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                onChunk('', true); // Signal completion
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.slice(6);
                    if (jsonString === '[DONE]') {
                        onChunk('', true);
                        continue;
                    }

                    try {
                        const json = JSON.parse(jsonString);
                        const content = json.choices?.[0]?.delta?.content || '';
                        onChunk(content, false);
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                }
            }
        }
    } catch (error) {
        toast.error("Failed to get response. Please try again later.");
        throw error;
    }
}

// Function to get all LLM models from OpenRouter API
export async function getAllLLMModels() {
    
        const response = await axios.get(`${applicationBaseUrl}/models`);
        return response;
    
}