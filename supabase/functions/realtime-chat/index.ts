import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  console.log('🚀 WebSocket connection established for OpenAI Realtime API');
  
  // Connect to OpenAI Realtime API
  let openAISocket: WebSocket | null = null;
  
  const connectToOpenAI = () => {
    console.log('🔌 Connecting to OpenAI Realtime API...');
    
    openAISocket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      { headers: { 
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }}
    );

    openAISocket.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API');
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 OpenAI message:', data.type);
        
        // Forward all messages from OpenAI to client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      } catch (error) {
        console.error('❌ Error processing OpenAI message:', error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error('❌ OpenAI WebSocket error:', error);
    };

    openAISocket.onclose = (event) => {
      console.log('🔌 OpenAI WebSocket closed:', event.code, event.reason);
    };
  };

  socket.onopen = () => {
    console.log('👤 Client connected');
    connectToOpenAI();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('📨 Client message:', message.type);
      
      // Forward client messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      } else {
        console.warn('⚠️ OpenAI socket not ready, buffering message');
      }
    } catch (error) {
      console.error('❌ Error processing client message:', error);
    }
  };

  socket.onclose = () => {
    console.log('👤 Client disconnected');
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error('❌ Client WebSocket error:', error);
  };

  return response;
});