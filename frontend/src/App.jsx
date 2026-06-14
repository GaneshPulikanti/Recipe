import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Send, Trash2 } from 'lucide-react';
import './index.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dummy recent chats for UI
  const [recentChats, setRecentChats] = useState([
    { id: 1, title: "How to prepare dal" }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const startNewChat = () => {
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const deleteChat = (id) => {
    setRecentChats(recentChats.filter(chat => chat.id !== id));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I am having trouble connecting to my recipe brain right now!' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format text with basic markdown bolding (e.g., **text**)
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      // Basic bold replacement
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return <p key={i}>{parts}</p>;
    });
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''} ${messages.length > 0 ? 'chat-active' : ''}`}>
      
      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand" onClick={startNewChat} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                <line x1="6" y1="17" x2="18" y2="17"></line>
              </svg>
            </div>
            RecipeGPT
          </div>
          <button className="close-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          + New Chat
        </button>

        <div className="recent-chats-title">Recent Chats</div>
        <div className="chat-history-list">
          {recentChats.map(chat => (
            <div key={chat.id} className="history-item">
              <span className="truncate">{chat.title}</span>
              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        
        {/* Toggle Menu Button */}
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>

        {/* HERO TEXT: R E C I P E with COOKIE BACKGROUND */}
        <div className="hero-center">
          <div className="hero-cookies-container">
            <img 
              src="/cookies-clean.png"
              alt="Chocolate Chip Cookie" 
              className="hero-cookies-image"
            />
          </div>
          <span className="hero-letter">R</span>
          <span className="hero-letter">E</span>
          <span className="hero-letter">C</span>
          <span className="hero-letter">I</span>
          <span className="hero-letter">P</span>
          <span className="hero-letter">E</span>
        </div>

        {/* CHAT OVERLAY */}
        <div className="chat-overlay">
          <div className="chat-messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className={`avatar ${msg.role}-avatar`}>
                  {msg.role === 'user' ? 'U' : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                      <line x1="6" y1="17" x2="18" y2="17"></line>
                    </svg>
                  )}
                </div>
                <div className="message-content">
                  {formatText(msg.content)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant">
                <div className="avatar assistant-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                    <line x1="6" y1="17" x2="18" y2="17"></line>
                  </svg>
                </div>
                <div className="message-content">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <form className="input-container" onSubmit={sendMessage}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a recipe, ingredient swap, or meal plan..."
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
              <Send size={20} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;
