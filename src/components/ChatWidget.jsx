import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
// import axios from 'axios';

export default function ChatWidget() {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");
  
  // Hardcoded for your live demo synchronization loop
  const DEMO_TICKET_ID = "4c3943b4-e4b0-43be-afd2-4b6bbbb7cc2f";
  const DEMO_CUSTOMER_ID = "07157e6b-f87e-41e2-8de9-773ee229bedb";
  const widgetEndRef = useRef(null);

  // Auto-scroll inside the widget viewport
  useEffect(() => {
    widgetEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Hook directly into the active socket channel stream
  useEffect(() => {
    if (!socket) return;

    // Join the exact same ticket room so client and agent hear each other
    socket.emit('join_ticket_room', { ticketId: DEMO_TICKET_ID });

    const handleLiveStream = (newMessage) => {
      if (newMessage.ticketId === DEMO_TICKET_ID) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on('receive_message', handleLiveStream);
    return () => socket.off('receive_message', handleLiveStream);
  }, [socket]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !socket) return;

    const payload = {
      ticketId: DEMO_TICKET_ID,
      body: typedMessage,
      senderType: 'CUSTOMER', // Spawns as a customer payload packet
      senderId: DEMO_CUSTOMER_ID
    };

    socket.emit('send_message', payload);
    setTypedMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-slate-100">
      
      {/* 🛑 STATE A: CLOSED STATE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer border border-blue-400/20"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* 🟢 STATE B: OPENED STATE WIDGET WINDOW */}
      {isOpen && (
        <div className="w-80 h-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header section */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Gemini Live Assistant</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300 transition text-sm">✕</button>
          </div>

          {/* Chat message history box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center mt-12">Ask our automated AI engineering portal anything to spin up a ticket loop!</p>
            )}
            {messages.map((msg, idx) => {
              const isMe = msg.senderType === 'CUSTOMER';
              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs border ${
                    isMe 
                      ? 'bg-blue-600 border-blue-500 text-white rounded-br-none' 
                      : msg.senderType === 'AI'
                        ? 'bg-purple-950/40 border-purple-500/30 text-purple-200 rounded-bl-none'
                        : 'bg-slate-800 border-slate-700 text-slate-200 rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.body}</p>
                  </div>
                </div>
              );
            })}
            <div ref={widgetEndRef} />
          </div>

          {/* Chat input footer form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/60">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-blue-500/50 transition">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button type="submit" disabled={!typedMessage.trim()} className="text-blue-500 hover:text-blue-400 disabled:opacity-30 transition">
                ➔
              </button>
            </div>
          </form>

        </div>
      )}

    </div>
  );
}