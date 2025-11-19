import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import ProviderSelect from './ProviderSelect';
import { AIProvider } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<AIProvider>('chatgpt-oss'); // default for chat
  const { chat } = useAI();
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim()) return;
    const user: Message = { role: 'user', content: input };
    setMessages((m) => [...m, user]);
    setInput('');

    const reply = await chat(
      {
        messages: [{ role: 'user', content: input }],
      },
      provider
    );
    const ai: Message = { role: 'assistant', content: reply };
    setMessages((m) => [...m, ai]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <aside className="w-80 bg-overlay text-gray-100 flex flex-col">
      <div className="p-2 flex items-center gap-2 border-b border-surface/50">
        <span className="font-medium">🤖 Model:</span>
        <ProviderSelect value={provider} onChange={setProvider} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs p-2 rounded ${
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-surface/70'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 flex">
        <input
          className="flex-1 bg-surface/30 text-gray-100 rounded-l px-2 py-1 focus:outline-none"
          placeholder="Ask the model…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button
          className="bg-primary text-white rounded-r px-3 flex items-center"
          onClick={send}
        >
          <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
        </button>
      </div>
    </aside>
  );
}