import { useSelector } from "react-redux";
import toast from "react-hot-toast";

export const useExportChat = () => {
  // accessing the state from redux
  const { messages } = useSelector((state: any) => state.chat);

  const getUserAndAIMsgToExport = (currentAiResponse: any) => {
    return messages.length
        ? messages.flatMap((botMessage: any, index: number) => {
            return (
              botMessage.id == currentAiResponse.id &&
              [messages[index - 1], botMessage].filter(Boolean)
            );
          }).filter(Boolean)
        : []
  }

  // triggers once user click on the export button to **export the pdf**
  const exportToPDF = async (currentAiResponse: any) => {
    try {  
      // loading state
       const loadingToastId = toast.loading("Exporting thread...")

      // Dynamic import to reduce bundle size
      const jsPDF = (await import("jspdf")).default;

      // creating a new pdf instance
      const pdf = new jsPDF();

      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("Inter", "bold");
      pdf.text("Chat Export", margin, 25);

      let yPosition = 50;
      const lineHeight = 6;
      const messageSpacing = 15;

      // filtering out the user asked question and the AI answer on the entire conversation
      // for the exporting
      const messagesToExport = getUserAndAIMsgToExport(currentAiResponse);

      // looping over the user and the AI response
      messagesToExport.forEach((message, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 25;
        }

        // Message header (sender and timestamp)
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");

        const sender = message.role === "user" ? "User" : "AI Assistant";

        pdf.text(`${sender}`, margin, yPosition);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        yPosition += 18;

        // Message content
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");

        // Handle long text by splitting into lines
        const lines = pdf.splitTextToSize(message.content, maxWidth);

        lines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 25;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        yPosition += messageSpacing;

        // Add a separator line between messages
        if (index < messagesToExport.length - 1) { // ✅ Fix: use messagesToExport.length instead of messages.length
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition - 8, pageWidth - margin, yPosition - 8);
        }
      });

      // Save the PDF
      const filename = `chat-export-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      pdf.save(filename);

      // removing the loading toast if present
      toast.dismiss(loadingToastId);

      // success pdf export toast
      toast.success("Export succeeded!", {
        duration: 2000,
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error("Failed! Try again");
    }
  };

  // triggers when user click on the **export as a markdown** button
  const exportToMarkdown = (currentAiResponse: any) => {
  try{

      // converting the message to export in the markdown format
      const markdownData = getUserAndAIMsgToExport(currentAiResponse).map((message: any) => {
        return message.role == "user" ? `**User**: ${message.content}` : `**AI**: ${message.content}`
    }).join("\n\n");

    const blob = new Blob([markdownData], {type: "text/markdown"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href=url;
    a.download="chat.md"
    a.click();
    
    URL.revokeObjectURL(url);

    // toast with the success message
    toast.success("Export succeeded!")
}
catch(err) {
console.error("error while downloading markdown", err);

// toast with the error
toast.error("Error while downloading markdown")
}
}

  // return statement
  return { 
    exportToPDF, 
    exportToMarkdown
  };
};