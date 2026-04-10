import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, User, Bot, Sparkles,
  Zap, RefreshCw, Copy, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';
type ProviderName = 'auto' | 'openrouter' | 'github' | 'huggingface' | 'gemini';

interface Message {
  id: string;
  role: Role;
  content: string;
  provider?: ProviderName;
  model?: string;
  isError?: boolean;
}

interface ProviderInfo {
  id: ProviderName;
  label: string;
  description: string;
  model: string;
  icon: string;
  available: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_HISTORY_KEY = 'mg_portfolio_chat_v2';

// API base URL: uses Cloudflare Worker in production, local Express server in dev
const API_BASE = import.meta.env.VITE_CHAT_API_URL || '';

const PROVIDER_BADGES: Record<ProviderName, string> = {
  auto: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-500/20',
  openrouter: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-300 border-violet-100 dark:border-violet-500/20',
  github: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  huggingface: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-500/20',
  gemini: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-300 border-cyan-100 dark:border-cyan-500/20',
};

const getGreetingText = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getDefaultGreeting = (): Message => ({
  id: 'greeting',
  role: 'assistant',
  content: `${getGreetingText()}! I'm Mohamed Gharieb — Applied AI Engineer & Data Scientist. I'm here to tell you about my work, projects, and how I can help you. What would you like to know?`,
});

const getSuggestedPrompts = () => [
  { text: 'What kind of AI & data projects have you built?', emoji: '🛠️' },
  { text: 'What services do you offer and what are your rates?', emoji: '💼' },
  { text: 'What technologies and tools do you specialize in?', emoji: '🧠' },
  { text: 'I have a project idea — can you help me?', emoji: '🤝' },
  { text: 'Tell me about your background and education.', emoji: '🎓' },
  { text: 'How do I contact you or place an order?', emoji: '📩' },
];

// ─── CopyButton helper ────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
      title="Copy message"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Chatbot = React.memo(() => {
  const defaultGreeting = getDefaultGreeting();
  const suggestedPrompts = getSuggestedPrompts();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify if language changed, reset if the only message is the greeting
          if (parsed.length === 1 && parsed[0].id === 'greeting') {
            return [defaultGreeting];
          }
          return parsed;
        }
      }
    } catch { }
    return [defaultGreeting];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch provider list from server
  useEffect(() => {
    fetch(`${API_BASE}/api/chat/providers`)
      .then(r => r.json())
      .then((data: ProviderInfo[]) => setProviders(data))
      .catch(() => {
        // Fallback if server unreachable
        setProviders([
          { id: 'auto', label: 'Auto', description: 'Smart routing', model: 'dynamic', icon: '✨', available: true },
          { id: 'gemini', label: 'Gemini', description: 'Google Gemini', model: 'gemini-2.0-flash', icon: '💎', available: false },
          { id: 'openrouter', label: 'OpenRouter', description: 'Gemini 2.5 Flash', model: 'google/gemini-2.5-flash', icon: '🔀', available: false },
          { id: 'github', label: 'GitHub Models', description: 'GPT-4o Mini', model: 'openai/gpt-4o-mini', icon: '🐙', available: false },
          { id: 'huggingface', label: 'Hugging Face', description: 'Llama 3.3 70B', model: 'meta-llama/Llama-3.3-70B-Instruct', icon: '🤗', available: false },
        ]);
      });
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch { }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Show welcome tooltip after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 4000); // Show after 4 seconds
    return () => clearTimeout(timer);
  }, []);

  // Update greeting text if it's the only message in chat
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'greeting') {
      setMessages([getDefaultGreeting()]);
    }
  }, []);

  // New message notification
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessage(true);
      setShowTooltip(false); // hide tooltip if a new message arrives
    }
  }, [messages.length]);
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setShowTooltip(false); // hide tooltip when chat is opened
    }
  }, [isOpen]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    if (!textOverride) setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build conversation history for the API (exclude greeting)
    const history = [...messages, userMsg]
      .filter(m => m.id !== 'greeting')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, provider: 'auto' }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as {
        text: string;
        provider: ProviderName;
        model: string;
        error?: string;
      };

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        provider: data.provider,
        model: data.model,
        isError: !!data.error,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([defaultGreeting]);
    }
  };

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m: Message) => m.role === 'user');
    if (lastUser) {
      const idx = messages.map(m => m.id).lastIndexOf(lastUser.id);
      setMessages(prev => prev.slice(0, idx));
      handleSend(lastUser.content);
    }
  };

  return (
    <>
      {/* ── Welcome Tooltip ── */}
      <AnimatePresence>
        {!isOpen && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-[90px] right-6 z-40 w-64 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-indigo-500/10 rounded-2xl rounded-br-sm origin-bottom-right"
          >
            <div className="flex gap-3">
              <img src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`} alt="Mohamed Gharieb" className="w-10 h-10 rounded-full shadow-sm shrink-0 border border-zinc-100 dark:border-zinc-800" />
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                Hello! 👋 I'm Mohamed Gharieb. Have a question about my work or services? Ask me here!
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Action Button ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.5 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-[60px] h-[60px] rounded-full shadow-xl shadow-indigo-500/20
          bg-white dark:bg-zinc-900 border-2 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-500/50
          transition-all duration-300 hover:-translate-y-1 p-0.5 overflow-hidden
          ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Open AI chat"
      >
        <img src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`} alt="Mohamed Gharieb" className="w-full h-full object-cover rounded-full" />
        {hasNewMessage && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
        )}
      </motion.button>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] flex flex-col
              bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl
              border border-zinc-200 dark:border-white/10
              overflow-hidden"
            style={{ height: 'min(620px, 85vh)' }}
          >
            {/* ─ Header (Glassmorphism) ─ */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full shadow-sm flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <img src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`} alt="Mohamed Gharieb" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full"></span>
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-semibold text-sm leading-tight text-left">AI Assistant</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px] text-left">Ask me anything about Mohamed</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Intelligent Routing Badge */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md
                  bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold tracking-wide border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">Smart Routing</span>
                </div>

                {/* Clear + Close */}
                <div className="flex items-center ml-1 border-l border-zinc-200 dark:border-zinc-800 pl-1">
                  <button
                    onClick={handleClear}
                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                    title="Clear History"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                    title="Close chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─ Messages ─ */}
            <div className="relative flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm overflow-hidden
                    ${msg.role === 'user'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : msg.isError
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}
                  >
                    {msg.role === 'user'
                      ? <User className="w-4 h-4" />
                      : msg.isError ? <Bot className="w-4 h-4" /> : <img src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`} alt="Mohamed Gharieb" className="w-full h-full object-cover" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Provider badge on AI messages */}
                    {msg.role === 'assistant' && msg.provider && msg.id !== 'greeting' && (
                      <span className={`text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-sm border ${PROVIDER_BADGES[msg.provider]} opacity-80 mb-0.5`}>
                        {providers.find(p => p.id === msg.provider)?.icon} {providers.find(p => p.id === msg.provider)?.label ?? msg.provider}
                      </span>
                    )}

                    <div className={`relative group px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-indigo-500/20'
                        : msg.isError
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 rounded-tl-sm'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-tl-sm shadow-zinc-200/20 dark:shadow-none'}`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none
                          prose-p:my-1 prose-p:leading-relaxed
                          prose-ul:my-1 prose-li:my-0.5
                          prose-code:bg-zinc-200 dark:prose-code:bg-zinc-700 prose-code:px-1 prose-code:rounded prose-code:text-[0.8em]
                          prose-pre:bg-zinc-800 dark:prose-pre:bg-zinc-900 prose-pre:text-zinc-100
                          prose-strong:font-semibold
                          prose-headings:font-bold prose-headings:mt-2 prose-headings:mb-1"
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Copy button (appears on hover) */}
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <CopyButton text={msg.content} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Suggested prompts (only when at greeting) */}
              {messages.length === 1 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="ml-10"
                >
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3" /> Try asking:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(p.text)}
                        className="text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 shadow-sm dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <span className="opacity-90">{p.emoji}</span>
                        <span className="font-medium tracking-wide">{p.text}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Loading animation */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    <img src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`} alt="Mohamed Gharieb" className="w-full h-full object-cover opacity-70" />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(delay => (
                        <div
                          key={delay}
                          className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mx-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      Thinking
                    </span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ─ Retry button (last message is error) ─ */}
            {messages.at(-1)?.isError && !isLoading && (
              <div className="px-4 pb-1 flex justify-center">
                <button
                  onClick={handleRetry}
                  className="text-xs flex items-center gap-1.5 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Request
                </button>
              </div>
            )}

            {/* ─ Input Area ─ */}
            <div className="p-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200/80 dark:border-white/10 shrink-0">
              <div className="relative flex items-end gap-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/50 transition-all pr-2 pl-3 py-2">
                <textarea
                  id="chat-input"
                  name="chat-input"
                  autoComplete="off"
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none outline-none leading-relaxed py-1 min-h-[24px] max-h-[100px] text-left"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all shrink-0 self-end mb-0.5 shadow-md shadow-indigo-500/20 active:scale-95`}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Footer: tip */}
              <div className="flex items-center justify-center mt-2 px-1">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center font-medium opacity-80">
                  AI responses may be inaccurate. Verify important details.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Chatbot;
