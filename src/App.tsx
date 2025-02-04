import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Send } from "lucide-react";

interface Message {
  text: string;
  timestamp: string;
  action?: string;
  message?: string;
  [key: string]: any; // For any additional fields in the message
}

interface WebSocketMessage {
  action: string;
  message: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    wsRef.current = new WebSocket(
      "wss://bskiixhsfl.execute-api.ap-southeast-2.amazonaws.com/dev"
    );

    const handleOpen = (event: Event): void => {
      console.log("Connected to WebSocket server");
      setConnected(true);
    };

    const handleMessage = (event: MessageEvent): void => {
      console.log("Message from server:", event.data);
      try {
        const parsedMessage: Message = JSON.parse(event.data).message;
        setMessages((prev) => [...prev, parsedMessage]);
      } catch (e) {
        console.error("Error parsing message:", e);
        const fallbackMessage: Message = {
          text: event.data?.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      }
    };

    const handleClose = (event: CloseEvent): void => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
    };

    const handleError = (error: Event): void => {
      console.error("WebSocket error:", error);
    };

    // Add event listeners with proper TypeScript types
    wsRef.current.addEventListener("open", handleOpen);
    wsRef.current.addEventListener("message", handleMessage);
    wsRef.current.addEventListener("close", handleClose);
    wsRef.current.addEventListener("error", handleError);

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener("open", handleOpen);
        wsRef.current.removeEventListener("message", handleMessage);
        wsRef.current.removeEventListener("close", handleClose);
        wsRef.current.removeEventListener("error", handleError);
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = (): void => {
    if (inputMessage.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      const messageToSend: WebSocketMessage = {
        action: "sendMessage",
        message: inputMessage,
      };
      wsRef.current.send(JSON.stringify(messageToSend));
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputMessage(e.target.value);
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp || Date.now()).toLocaleTimeString();
  };

  const renderMessage = (msg: Message, index: number): JSX.Element => {
    const displayText =
      typeof msg === "string" ? msg : msg.text || JSON.stringify(msg);

    return (
      <div key={index} className="mb-2">
        <div className="bg-slate-100 rounded-lg p-2 break-words">
          {displayText}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatTimestamp(msg.timestamp)}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Chat Application
          <span
            className={`h-3 w-3 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 h-[400px] mb-4 p-4 border rounded-md">
          {messages.map((msg, index) => renderMessage(msg, index))}
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!connected}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default App;
