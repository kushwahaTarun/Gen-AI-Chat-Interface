export const useSpeechSynthesis = () => {

    // function to handle text to speech once user click on the speaker button this function will be triggerd and generate an AI speech
      const handleSpeak = (message: string, setPauseTextToSpeech: (state: boolean) => void) => {
        
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
            setPauseTextToSpeech(true);
          };
    
          speech.onend = () => {
            setPauseTextToSpeech(false);
          };
    
          speech.onerror = () => {
            setPauseTextToSpeech(false);
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

      // function to stop the text to speech response
        const handleTextToSpeechPause = (setPauseTextToSpeech: (state: boolean) => void) => {
            window.speechSynthesis.cancel();
            setPauseTextToSpeech(false);
        };

      return {
        handleSpeak,
        handleTextToSpeechPause,
      }
}