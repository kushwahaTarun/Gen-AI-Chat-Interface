// components/BuyMeACoffeeButton.tsx
import { useEffect } from "react";

const BuyMeACoffeeButton = () => {
  useEffect(() => {
    // Ensure the script has loaded before trying to initialize
    const script = document.createElement("script");
    script.setAttribute("data-name", "bmc-button");
    script.setAttribute("data-slug", "tarunkushwaha");
    script.setAttribute("data-color", "#FFDD00");
    script.setAttribute("data-emoji", "");
    script.setAttribute("data-font", "Bree");
    script.setAttribute("data-text", "Buy me a coffee");
    script.setAttribute("data-outline-color", "#000000");
    script.setAttribute("data-font-color", "#000000");
    script.setAttribute("data-coffee-color", "#ffffff");
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js";

    const container = document.getElementById("bmc-button-container");
    if (container) {
      container.appendChild(script);
    }
  }, []);

  return <div id="bmc-button-container"></div>;
};

export default BuyMeACoffeeButton;
