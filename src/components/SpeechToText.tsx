// import { useState, useEffect, useRef } from "react";

// export default function SpeechToText() {
//   // state to store the transcript of the speech
//   const [transcript, setTranscript] = useState("");

//   // state to manage the listening status
//   const [isListening, setIsListening] = useState(false);

//   // reference to the SpeechRecognition instance
//   const recognitionRef = useRef(null);
//   console.warn("recognitionRef:", recognitionRef);

//   console.warn("transcript:", transcript);

//   // triggers when the component mounts
//   useEffect(() => {
//     // check if the browser supports SpeechRecognition
//     const speechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (speechRecognition) {
//       recognitionRef.current = new speechRecognition();
//       recognitionRef.current.continuous = true; // keep recognizing speech continuously
//       recognitionRef.current.interimResults = true; // get interim results
//       recognitionRef.current.lang = "en-US"; // set the language

//       recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
//         let text = "";
//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           text += event.results[i][0].transcript;
//         }
//         setTranscript(text); // update the transcript state
//       };

//       recognitionRef.current.onend = () => setIsListening(false);
//     }

//     console.warn("SpeechRecognition:", speechRecognition);
//   }, []);

//   const startListening = () => {
//     if (recognitionRef.current && !isListening) {
//       recognitionRef.current.start();
//       setIsListening(true);
//     }
//   };

//   const stopListening = () => {
//     if (recognitionRef.current && isListening) {
//       recognitionRef.current.stop();
//       setIsListening(false);
//     }
//   };

//   return (
//     <>
//       <button onClick={startListening}>Start listening</button>
//       <button onClick={stopListening}>Stop listening</button>
//     </>
//   );
// }
