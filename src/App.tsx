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
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Generate a detailed packing list based on this trip description: "${input}". 
        Format the response as a JSON object with this structure:
        {
          "categories": [
            {
              "name": "Category Name",
              "items": ["Item 1", "Item 2", ...]
            }
          ]
        }
        Include common categories like Clothing, Toiletries, Electronics, etc.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const parsedList = JSON.parse(text);
      setPackingList(parsedList);

      setMessages(prev => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: "I've generated a packing list based on your trip details. You can find it below!" }
      ]);
      
      setInput('');
    } catch (error) {
      console.error('Error generating packing list:', error);
      const errorMessage = error instanceof Error && error.message.includes('API_KEY_INVALID')
        ? "Error: Invalid API key. Please check your Gemini API key configuration."
        : "I'm sorry, I encountered an error while generating your packing list. Please try again.";
      
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
      <header className="bg-white shadow-lg border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {apiKeyError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">API Key Not Configured</p>
              <p className="text-sm mt-1">Please add your Gemini API key to the .env file to use this application.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {messages.length === 0 && !packingList && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
              <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                <Plane className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to start packing?</h2>
              <p className="text-gray-600">
                Describe your trip below and I'll help you create the perfect packing list.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md border border-gray-100">
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