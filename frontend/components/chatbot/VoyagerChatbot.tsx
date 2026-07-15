'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api/client';

export default function VoyagerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Hi! I am **Voyager**, your quirky tour guide for WorkforceOS. Ask me anything about our features, attendance, tasks, or payroll!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide popup after 8 seconds
    const timer = setTimeout(() => setShowPopup(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const parseMarkdown = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/^### (.*?)$/gm, '<h5 class="font-extrabold text-[12px] text-slate-800 mt-2 mb-1">$1</h5>');
    html = html.replace(/^## (.*?)$/gm, '<h4 class="font-extrabold text-[13px] text-slate-800 mt-2 mb-1">$1</h4>');
    html = html.replace(/^# (.*?)$/gm, '<h3 class="font-black text-[14px] text-slate-900 mt-2 mb-1">$1</h3>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-red-650 px-1 py-0.5 rounded font-mono text-[10px]">$1</code>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/^[ \t]*[*+-][ \t]+(.*?)$/gm, '<li class="ml-4 list-disc text-slate-705 my-0.5">$1</li>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');
    html = html.replace(/\n/g, '<br/>');
    html = html.replace(/(<\/li>|<h[345]>)\s*<br\/>/g, '$1');
    return html;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    setShowPopup(false);

    try {
      const data = await api.chatbot.public(userMsg);
      
      let botResponse = '';
      if (data?.success && data?.data?.response) {
        botResponse = data.data.response;
      } else {
        botResponse = 'Oops, I encountered an issue. Please contact the administrator at **paramkhodiyar1008@gmail.com**.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am unable to connect to the server right now. Feel free to contact **paramkhodiyar1008@gmail.com** directly!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {/* Pop-up tip */}
      {showPopup && !isOpen && (
        <div className="absolute bottom-16 left-2 bg-slate-900 text-white text-[11px] font-medium py-2 px-3 rounded-xl shadow-lg whitespace-nowrap animate-bounce flex items-center gap-1.5 border border-slate-800">
          <span>Hey, I can help you...</span>
          <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-white ml-1">
            <span className="material-symbols-outlined text-[12px] block">close</span>
          </button>
        </div>
      )}

      {/* Floating Bubble */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setShowPopup(false); }}
          className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-150 relative cursor-pointer border border-slate-800"
        >
          <span className="material-symbols-outlined text-[24px]">explore</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-[320px] sm:w-[350px] h-[450px] flex flex-col overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-[14px]">
                <span className="material-symbols-outlined text-[16px]">explore</span>
              </div>
              <div>
                <h4 className="text-body-xs font-bold leading-none">Voyager</h4>
                <span className="text-[9px] text-blue-300 font-medium">WorkforceOS Guide</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <span className="material-symbols-outlined text-[20px] block">close</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-body-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-850 rounded-tl-none'
                  }`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Voyager about features..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-body-xs outline-none bg-slate-50 focus:bg-white focus:border-slate-800 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-8 w-8 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] block">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
