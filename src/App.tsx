import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Loader2, AlertCircle, Luggage, Plane } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { PackingListDisplay } from './components/PackingListDisplay';
import { Message, PackingList } from './types';

// Initialize Gemini AI with API key validation
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [apiKeyError, setApiKeyError] = useState(!API_KEY);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generatePackingList = async () => {
    if (!API_KEY) {
      setApiKeyError(true);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: "Error: Gemini API key is not configured. Please add your API key to the .env file." }
      ]);
      setInput('');
      return;
    }

    try {
      setIsLoading(true);
      setApiKeyError(false);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Updated model name

      const prompt = `Generate a detailed packing list based on this trip description: "${input}". 
        Return ONLY a JSON object (no markdown, no backticks) with this structure:
        {
          "categories": [
            {
              "name": "Category Name",
              "items": ["Item 1", "Item 2"]
            }
          ]
        }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean the response text
      text = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedList = JSON.parse(text);
        setPackingList(parsedList);
        setMessages(prev => [
          ...prev,
          { role: 'user', content: input },
          { role: 'assistant', content: "I've generated a packing list based on your trip details. You can find it below!" }
        ]);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        setMessages(prev => [
          ...prev,
          { role: 'user', content: input },
          { role: 'assistant', content: "Sorry, I received an invalid response format. Please try again." }
        ]);
      }
      
      setInput('');
    } catch (error) {
      console.error('Error generating packing list:', error);
      const errorMessage = error instanceof Error 
        ? error.message.includes('API_KEY_INVALID')
          ? "Error: Invalid API key. Please check your Gemini API key configuration."
          : error.message.includes('RATE_LIMIT_EXCEEDED')
            ? "Rate limit exceeded. Please try again in a few moments."
            : "I'm sorry, I encountered an error while generating your packing list. Please try again."
        : "An unexpected error occurred";
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: errorMessage }
      ]);
      setApiKeyError(true);
      setInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    generatePackingList();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-blue-100 shadow-lg">
        <div className="max-w-4xl px-4 py-6 mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-full">
              <Luggage className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Packing List Generator</h1>
              <p className="mt-1 text-gray-600">Let AI help you pack for your next adventure</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl px-4 py-8 mx-auto">
        {apiKeyError && (
          <div className="flex items-center gap-3 p-4 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle className="flex-shrink-0 w-5 h-5" />
            <div>
              <p className="font-medium">API Key Not Configured</p>
              <p className="mt-1 text-sm">Please add your Gemini API key to the .env file to use this application.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {messages.length === 0 && !packingList && (
            <div className="p-6 text-center border border-blue-100 rounded-lg bg-blue-50">
              <div className="inline-block p-3 mb-4 bg-blue-100 rounded-full">
                <Plane className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Ready to start packing?</h2>
              <p className="text-gray-600">
                Describe your trip below and I'll help you create the perfect packing list.
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-100 shadow-md rounded-xl">
            <div ref={chatContainerRef} className="space-y-4 p-4 max-h-[400px] overflow-y-auto">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your trip (e.g., 'Weekend beach trip to Hawaii in summer')"
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading || apiKeyError}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || apiKeyError}
                  className="bg-blue-500 text-white rounded-lg px-6 py-2.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {packingList && <PackingListDisplay list={packingList} />}
        </div>
      </main>
    </div>
  );
}

export default App;