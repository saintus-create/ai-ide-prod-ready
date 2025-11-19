import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { useToast } from '@/hooks/useToast';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import ProviderSelect from './ProviderSelect';
import { AIProvider } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<AIProvider>('chatgpt-oss'); // default for chat
  const [isLoading, setIsLoading] = useState(false);
  const { chat } = useAI();
  const { error } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { 
      role: 'user', 
      content: input, 
      timestamp: Date.now() 
    };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await chat(
        {
          messages: [{ role: 'user', content: input }],
        },
        provider
      );
      
      const aiMessage: Message = { 
        role: 'assistant', 
        content: reply, 
        timestamp: Date.now() 
      };
      setMessages((m) => [...m, aiMessage]);
    } catch (err) {
      error(`Chat failed: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <aside className="w-80 bg-overlay text-gray-100 flex flex-col border-l border-surface/30">
      <div className="p-2 flex items-center gap-2 border-b border-surface/50">
        <span className="font-medium text-sm">🤖 Model:</span>
        <ProviderSelect value={provider} onChange={setProvider} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Start a conversation with the AI...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs p-2 rounded ${
                  msg.role === 'user' ? 'bg-primary text-white' : 'bg-black/20 text-gray-100'
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className="text-xs opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/20 p-2 rounded">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 flex">
        <input
          className="flex-1 bg-black/20 text-gray-100 rounded-l px-3 py-2 focus:outline-none border border-surface/30"
          placeholder="Ask the model..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={isLoading}
        />
        <button
          className="bg-primary text-white rounded-r px-3 flex items-center disabled:opacity-50"
          onClick={send}
          disabled={isLoading || !input.trim()}
        >
          <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
        </button>
      </div>
    </aside>
  );
}