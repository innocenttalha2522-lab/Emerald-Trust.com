import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserAccount } from '../../types';

interface OwnerChatTabProps {
  allUsers: UserAccount[];
}

export const OwnerChatTab: React.FC<OwnerChatTabProps> = ({ allUsers }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'msg-seed-1',
        senderEmail: 'admin@emeraldtrust.com',
        senderName: 'Admin',
        senderRole: 'support',
        message: 'Customer Service Live Desk initialized. Client inquiries regarding account activation, deposit verification, daily tasks, and referral plans will appear here live.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true
      }
    ];
  });

  const [inputReply, setInputReply] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('emerald_trust_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Real-time polling from server + BroadcastChannel
  useEffect(() => {
    const fetchServerChat = async () => {
      try {
        const res = await fetch('/api/chat/messages?isOwner=true');
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
      } catch (err) {}
    };

    fetchServerChat();
    const interval = setInterval(fetchServerChat, 2500);

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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendOwnerReply = async (text?: string) => {
    const toSend = (text || inputReply).trim();
    if (!toSend) return;

    // Send as Admin to respect the prompt requirement: "dont meantioned i am the owner talha ahmed just mentioned i am the admin"
    const adminMsg: ChatMessage = {
      id: `admin-msg-${Date.now()}`,
      senderEmail: 'admin@emeraldtrust.com',
      senderName: 'Admin',
      senderRole: 'support',
      message: toSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    setMessages(prev => [...prev, adminMsg]);
    setInputReply('');

    // Broadcast across tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('emerald_trust_chat_channel');
        bc.postMessage({ type: 'NEW_CHAT_MESSAGE', message: adminMsg });
        bc.close();
      }
    } catch (e) {}

    // Post to server backend
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: 'admin@emeraldtrust.com',
          senderName: 'Admin',
          senderRole: 'admin',
          targetUserEmail: selectedUserFilter === 'all' ? undefined : selectedUserFilter,
          message: toSend
        })
      });
    } catch (err) {
      console.warn('Failed to sync reply to server');
    }
  };

  const quickReplies = [
    'Hello! I am the admin. How are you doing and how can I help you today?',
    'Your deposit transaction reference has been verified and your package is now active! Daily tasks are unlocked.',
    'Your task screenshot proof has been approved and reward credited to your wallet balance.',
    'For Pakistani accounts, minimum withdrawal is 500 PKR with 10 active referrals who have activated a package tier.',
    'Please upload your deposit receipt screenshot or transaction reference number so I can verify your account immediately.'
  ];

  const uniqueSenderEmails = Array.from(
    new Set(messages.filter(m => m.senderRole === 'user').map(m => m.senderEmail))
  );

  const displayMessages = messages.filter(m => {
    if (selectedUserFilter === 'all') return true;
    return m.senderEmail === selectedUserFilter || (m as any).targetUserEmail === selectedUserFilter || m.senderRole === 'owner' || m.senderRole === 'support' || m.senderRole === 'admin';
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Live Customer Service Desk</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Live two-way real-time communications with clients. You reply as <strong>Admin</strong>.
            </p>
          </div>
        </div>

        {/* Sender Filter */}
        {uniqueSenderEmails.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[10px]">Filter by user:</span>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-300 text-[11px] outline-none"
            >
              <option value="all">All Conversations ({messages.length} msgs)</option>
              {uniqueSenderEmails.map(email => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-black/60 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {displayMessages.map((msg) => {
            const isAdminReply = msg.senderRole === 'owner' || msg.senderRole === 'support' || msg.senderRole === 'admin';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAdminReply ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-zinc-500 mb-1 px-1 flex items-center gap-1.5">
                  <span className="font-bold text-zinc-400">{isAdminReply ? 'Admin (You)' : msg.senderName}</span>
                  <span>({msg.senderEmail})</span>
                  <span>• {msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    isAdminReply
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-br-none shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Response Templates */}
        <div className="p-2.5 bg-zinc-950 border-t border-zinc-800/80 overflow-x-auto flex gap-2 scrollbar-none">
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendOwnerReply(qr)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 rounded-lg whitespace-nowrap text-[10px] transition-all cursor-pointer"
            >
              {qr.substring(0, 42)}...
            </button>
          ))}
        </div>

        {/* Reply Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendOwnerReply();
          }}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              selectedUserFilter !== 'all'
                ? `Reply to ${selectedUserFilter} as Admin...`
                : 'Type reply to client as Admin...'
            }
            value={inputReply}
            onChange={(e) => setInputReply(e.target.value)}
            className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputReply.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Send as Admin</span>
          </button>
        </form>
      </div>
    </div>
  );
};
