export default function useSpeechSynthesis() {
  
  // Updated function to handle text to speech with message-specific callback
  const handleSpeak = (message: string, onSpeechStateChange: (isSpeaking: boolean) => void) => {
    
    // if there is no message we will just return
    if (!message) return;

    // Stop any current speech first
    window.speechSynthesis.cancel();

    // Create new speech instance
    const speech = new SpeechSynthesisUtterance(message);

    // Optional settings
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    // Handle voice loading - this is crucial
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speech.voice =
          voices.find((voice) => voice.lang === "en-US") || voices[0];
      }

      // Event listeners to manage state
      speech.onstart = () => {
        onSpeechStateChange(true);
      };

      speech.onend = () => {
        onSpeechStateChange(false);
      };

      speech.onerror = () => {
        onSpeechStateChange(false);
      };

      window.speechSynthesis.speak(speech);
    };

    // Check if voices are loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    }
  };

  // Updated function to stop the text to speech response
  const handleTextToSpeechPause = (onSpeechStateChange: (isSpeaking: boolean) => void) => {
    window.speechSynthesis.cancel();
    onSpeechStateChange(false);
  };

  return {
    handleSpeak,
    handleTextToSpeechPause,
  }
}