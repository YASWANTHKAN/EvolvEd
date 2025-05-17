import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import config from "../config";

function Chatbot() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${config.API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      const botMessage = { text: data.reply, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMsg = {
        text: "⚠️ Error: Couldn't get a reply.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
  };

  return (
    <div className="p-4 h-screen max-h-[80vh] bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Student Helper Chatbot 🤖
        </h1>
        <button
          onClick={handleClearChat}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
        >
          Clear Chat
        </button>
      </div>

      <div className="border rounded-lg p-4 flex-1 h-full overflow-y-auto bg-white dark:bg-gray-800 shadow">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            {msg.sender === "bot" ? (
              <div className="prose prose-sm dark:prose-invert max-w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-xl shadow text-left">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : (
              <div className="bg-blue-500 text-white px-4 py-2 rounded-xl shadow max-w-[75%] whitespace-pre-wrap break-words">
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="mb-2 flex justify-start">
            <span className="inline-block px-3 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-sm text-gray-700 dark:text-white animate-pulse">
              Bot is typing...
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex mt-4">
        <input
          type="text"
          className="flex-grow border rounded-l-lg p-2 dark:bg-gray-700 dark:text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask something..."
        />
        <button
          onClick={handleSend}
          className="bg-black hover:bg-gray-800 text-white px-4 rounded-r-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
