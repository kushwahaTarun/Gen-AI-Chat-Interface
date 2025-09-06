export async function POST(request) {
  try {
    const body = await request.json();

    const { model, messages } = body;
    console.warn("Received messages:", messages);

    if (!messages && !messages.length) {
      return Response.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (!model) {
      return Response.json(
        { error: "Please select the LLM Model" },
        { status: 400 }
      );
    }

    // Make request to OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "My Next.js App",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true,
        }),
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
