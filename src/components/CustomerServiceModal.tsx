import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, ChatMessage, CurrencyType } from '../types';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserAccount;
  currentUser?: UserAccount;
  currency?: CurrencyType;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome-0',
  senderEmail: 'admin@emeraldtrust.com',
  senderName: 'Admin',
  senderRole: 'support',
  message: 'Hello! I am the admin. How are you doing and how can I help you today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isRead: true
};

export const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({
  isOpen,
  onClose,
  user: passedUser,
  currentUser,
  currency = 'USD'
}) => {
  const user = passedUser || currentUser || {
    isRegistered: false,
    uid: 'guest-usr',
    name: 'Investor',
    email: '',
    role: 'client',
    currency: 'USD',
    country: 'Global',
    tierId: 'gold',
    depositStatus: 'none',
    depositAmount: 0,
    balance: 0,
    totalEarned: 0,
    pendingYield: 0,
    referralCode: '',
    referralCount: 0,
    referralEarnings: 0,
    completedAdsCount: 0,
    kycVerified: true,
    createdAt: new Date().toISOString()
  };
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any old cached initial messages to the required admin greeting
          return parsed.map((m: any) => {
            if (m.id === 'msg-welcome-0' || m.message?.includes('Talha Ahmed, Owner')) {
              return INITIAL_GREETING;
            }
            return m;
          });
        }
      }
    } catch (e) {}
    return [INITIAL_GREETING];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('emerald_trust_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Real-time backend sync and BroadcastChannel listener
  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial chat messages from backend
    const fetchServerMessages = async () => {
      try {
        const userEmail = user.email || '';
        const res = await fetch(`/api/chat/messages?userEmail=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newMsgs = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
              if (newMsgs.length > 0) {
                return [...prev, ...newMsgs];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchServerMessages();
    const interval = setInterval(fetchServerMessages, 2500);

    // Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('emerald_trust_chat_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_CHAT_MESSAGE' && event.data.message) {
            setMessages(prev => {
              if (prev.some(m => m.id === event.data.message.id)) return prev;
              return [...prev, event.data.message];
            });
          }
        };
      }
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [isOpen, user?.email]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      senderEmail: user.email || 'guest@emeraldtrust.com',
      senderName: user.name || (user.email ? user.email.split('@')[0] : 'Client'),
      senderRole: 'user',
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    // 1. Immediately append to UI
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // 2. Broadcast via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('emerald_trust_chat_channel');
        bc.postMessage({ type: 'NEW_CHAT_MESSAGE', message: userMsg });
        bc.close();
      }
    } catch (e) {}

    // 3. Post to backend server
    setIsTyping(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: user.email || 'guest@emeraldtrust.com',
          senderName: user.name || (user.email ? user.email.split('@')[0] : 'Client'),
          senderRole: 'user',
          message: text,
          currency
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message && data.message.id !== userMsg.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      }
    } catch (err) {
      console.warn('Network chat message queued locally');
    }
  };

  const quickQuestions = [
    'How do I activate my account to unlock tasks?',
    'How do I unlock my withdrawal with 10 referrals?',
    'How to submit task screenshot proof for 10 PKR?',
    'What is the minimum withdrawal for Pakistani users?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e0e11] border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[640px] max-h-[92vh]">
        {/* Chat Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold font-mono">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-900"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-bold font-mono">Admin</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                  Live Support
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Online • Live Admin Desk</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Quick Help Chips */}
        <div className="p-2.5 bg-zinc-950/80 border-b border-zinc-800/80 overflow-x-auto flex gap-2 scrollbar-none text-[11px] font-mono">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-emerald-500/40 rounded-lg whitespace-nowrap transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Conversation Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
          {messages.map((msg) => {
            const isMe = msg.senderRole === 'user';
            const isAdm = msg.senderRole === 'admin' || msg.senderRole === 'support' || msg.senderRole === 'owner';
            const displayName = isMe ? (user.name || 'You') : 'Admin';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-zinc-500 mb-1 px-1 flex items-center gap-1.5">
                  <span className={isAdm ? 'font-bold text-emerald-400' : 'text-zinc-400'}>{displayName}</span>
                  <span>• {msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
              <span>Admin is typing a reply...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your message to Admin (Press Enter to send)..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-zinc-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Send Message"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
