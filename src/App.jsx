import { useState, useEffect, useRef } from 'react';
import { useSocket } from './context/SocketContext';
import { useAuth } from './context/AuthContext';
import { ticketService } from './services/api';
import Login from './pages/Login';
import ChatWidget from './components/ChatWidget'; // ◄--- IMPORT WIDGET

function App() {
  const { isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Track loading states safely
  
  const messagesEndRef = useRef(null);

  // Auto-scroll the chat panel down when new messages stream in
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /*
  // 📡 BOOTUP EFFECT: Load all actual active tickets from your Postgres DB
  useEffect(() => {
    
    const loadInitialWorkspaceData = async () => {
      try {
        setIsLoading(true);
        const liveTickets = await ticketService.getAllTickets();
        setTickets(liveTickets);
        
        // If the database has tickets, automatically select the first one to display
        if (liveTickets.length > 0) {
          setActiveTicket(liveTickets[0]);
        }
      } catch (error) {
        console.error("❌ Failed to pull live ticket queues from Postgres:", error);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialWorkspaceData();
  }, []);

  */

  // 📂 TICKET SWITCH EFFECT: Load older historical log messages when active ticket shifts
  const handleActiveTicket = async (ticket) => {
  if (!ticket) return;
  
  setActiveTicket(ticket);

  try {
    const historicalLog = await ticketService.getTicketMessages(ticket.id);
    const actualMessages = historicalLog?.data?.messages || [];
    
    // Set it cleanly as a flat array
    setMessages(actualMessages); 
  } catch (error) {
    console.error("❌ Failed to fetch history logs:", error);
    setMessages([]);
  }
};

// 📡 MASTER WORKSPACE INITIALIZATION STREAM
  useEffect(() => {
    // Safety Lock: If they aren't signed in, don't execute any network logs
    if (!isAuthenticated) return;

    const initializeWorkspaceQueue = async () => {
      try {
        setIsLoading(true);
        
        // 1. Await the direct array response from your backend API router
        const liveTickets = await ticketService.getAllTickets();
 
        const cleanTicketsArray = liveTickets || [];
        setTickets(cleanTicketsArray);
        // 2. AUTO-SELECT TARGET: Lock onto the first ticket immediately in the same cycle!
        if (cleanTicketsArray.data.length > 0) {          
          // Call the handler directly with the freshly downloaded array data
          await handleActiveTicket(cleanTicketsArray.data[0]);
        }
      } catch (error) {
        console.error("❌ Failed to pull live ticket queues:", error);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkspaceQueue();
  }, [isAuthenticated]); // ◄--- Triggers reliably the exact millisecond you pass the Login gate!


  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTicket]);

  // Handle Room Switching & Live Message Events
  useEffect(() => {
    if (!socket || !activeTicket) return;

    // 1. Immediately tell the server we want to sit inside this ticket room channel
    socket.emit('join_ticket_room', { ticketId: activeTicket.id });

    // 2. Set up a listener for real-time streams (Customer, Agent, or Gemini Bot replies)
    const handleIncomingMessage = (newMessage) => {
      if (newMessage.ticketId === activeTicket.id) {
     // Append the live incoming packet directly onto the historical array stream
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on('receive_message', handleIncomingMessage);

    // Cleanup listeners when switching between tickets
    return () => {
      socket.off('receive_message', handleIncomingMessage);
    };
  }, [socket, activeTicket]);

  // Handle Emitting messages from Human Agent Input
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !socket) return;

    const payload = {
      ticketId: activeTicket.id,
      body: typedMessage,
      senderType: 'AGENT',
      senderId: 'HUMAN_AGENT_ANKUR' // Simulating your logged in agent identity string
    };

    // Emit live packet across the socket line
    socket.emit('send_message', payload);
    setTypedMessage("");
  };

    // 🛡️ GATEKEEPER CHECK: If token doesn't exist, halt and show Login screen
  if (!isAuthenticated) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center text-slate-400 font-medium">
        Loading operational workspace files...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* 🏢 LEFT PANEL: Live DB Ticket List Queue */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h1 className="font-bold text-lg tracking-wide">Workspace Queue</h1>
          <span className={`h-25. w-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} title={isConnected ? "WebSocket Online" : "Disconnected"}></span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tickets.length === 0 ? (
            <p className="text-xs text-slate-500 text-center mt-8">No tickets assigned to this instance.</p>
          ):(tickets.data.map((ticket) => {
            const isSelected = activeTicket && ticket.id === activeTicket.id;
            return (
              <button
                key={ticket.id}
                onClick={() => handleActiveTicket(ticket)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 block border ${
                  isSelected ? 'bg-blue-600/10 border-blue-500/50 shadow-md' : 'border-transparent hover:bg-slate-800/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {ticket.status}
                  </span>
                  <span className="text-[10px] text-slate-500">
                      {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                  {ticket.subject}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Client ID: {ticket.customerId}</p>
              </button>
            );
          }))}
        </div>
      </div>

      {/* ✉️ MAIN CENTER PANEL: Real-time Message Timeline Stream */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {activeTicket ? (
          <>
        {/* Active Ticket Header metadata banner */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex flex-col justify-center">
          <h2 className="text-base font-semibold text-slate-200">{activeTicket.title || "Active Discussion"}</h2>
          <p className="text-xs text-slate-500 mt-0.5">ID: {activeTicket.id}</p>
        </div>

        {/* Message Stream Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(Array.isArray(messages) ? messages : []).map((msg, idx) => {
            const isCustomer = msg.senderType === 'CUSTOMER';
            const isAI = msg.senderType === 'AI';

            return (
              <div key={msg.id || idx} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xl rounded-xl px-4 py-2.5 shadow-sm border text-sm transition-all ${
                  isCustomer 
                    ? 'bg-slate-800 text-slate-100 border-slate-700 rounded-bl-none' 
                    : isAI
                      ? 'bg-purple-600/10 text-purple-200 border-purple-500/30 rounded-br-none ring-1 ring-purple-500/20'
                      : 'bg-blue-600 text-white border-blue-500 rounded-br-none'
                }`}>
                  <div className="flex items-center space-x-1.5 mb-1 text-[10px] tracking-wider opacity-60 font-semibold uppercase">
                    {isAI && <span>🤖 Gemini Bot</span>}
                    {isCustomer && <span>👤 Customer </span>}
                    {!isCustomer && !isAI && <span>👨‍💻 You (Agent)</span>}
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">{msg.body}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Chat Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/20">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:border-blue-500/50 transition">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder={`Send a reply to.....`}
              className="flex-1 bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition"
            >
              Send Stream
            </button>
          </div>
        </form>
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a ticket from the workspace queue to view dialogue histories.
          </div>
        )}

      </div>

      {/* 💬 THE CUSTOMER DEMO EMBED */}
      <ChatWidget />
    </div>

    
  );
}

export default App;