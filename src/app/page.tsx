"use client";
import Image from "next/image";

import AI2 from "../../public/AI2.png";
import TextareaWithButtons from "./components/TextareaWithButtons";

export default function Home() {
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
        <section className="flex flex-col items-center justify-around relative z-10 w-[70%] h-[70%]">

          {/* Container that stores the icon, headings and the textarea field */}
          <div className="flex flex-col items-center justify-center">
            <Image className="border" src={AI2} alt="AI icon" />
            <h3 className="text-gray-400 text-xl mt-6">Welcome to Baangdu AI</h3>
            <h1 className="text-white text-5xl mt-4 font-semibold">
              How can I help?
            </h1>
          </div>
          <TextareaWithButtons
            placeholder="Ask me anything..."
            onSubmit={() => {}}
            className="max-w-2xl"
          />
        </section>
      </section>
    </>
  );
}
