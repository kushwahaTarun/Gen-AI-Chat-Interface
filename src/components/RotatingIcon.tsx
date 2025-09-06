import React from "react";

interface RotatingIconProps {
  isRotating: boolean;
}

const RotatingIcon: React.FC<RotatingIconProps> = ({ isRotating }) => {
  return (
    <div className="inline-block w-5 h-5">
      <svg
        className={`${isRotating ? "animate-spin" : ""}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        {/* Gradient arc */}
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </path>
        {/* Inner dots */}
        {[0, 120, 240].map((angle, i) => (
          <circle
            key={i}
            cx={12 + 5 * Math.cos((angle * Math.PI) / 180)}
            cy={12 + 5 * Math.sin((angle * Math.PI) / 180)}
            r="1"
            fill="currentColor"
            className="opacity-75"
          >
            <animate
              attributeName="opacity"
              values="0.75;0.25;0.75"
              dur="1s"
              begin={`${i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default RotatingIcon;
