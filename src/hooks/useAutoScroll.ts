import { RootState } from "@/store/store";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

export default function useAutoScroll() {

    // destructuring the states from the redux slice
    const {messages, isResponseStreaming} = useSelector((state: RootState) => state.chat);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // function that will scroll towards the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        })
    };

    // Autoscroll when message changes
    useEffect(() => {
        if(messages.length) {
            setTimeout(scrollToBottom, 100)
        }
    }, [messages]);

    // Autoscroll if the response is streaming
    useEffect(() => {
        if(isResponseStreaming) {
            setTimeout(scrollToBottom, 100)
        }
    }, [isResponseStreaming])

    return {
        messagesEndRef,
        scrollToBottom,
    }
}