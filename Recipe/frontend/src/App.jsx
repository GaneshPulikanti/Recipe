import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Send, Trash2 } from 'lucide-react';
import './index.css';
import logo from './assets/logo.jpg';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // Recent chats loaded from DB
  const [recentChats, setRecentChats] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/history');
      if (response.ok) {
        const data = await response.json();
        setRecentChats(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  const deleteChat = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/delete/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchHistory();
        if (currentChatId === id) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const loadChat = async (id) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chat/load?chat_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setCurrentChatId(data.chat_id);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
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
        body: JSON.stringify({ 
          message: userMessage,
          chat_id: currentChatId
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      setCurrentChatId(data.chat_id);
      fetchHistory();
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
    <div className={`app-container ${messages.length > 0 ? 'chat-active' : ''} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      
      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand" onClick={startNewChat} style={{ cursor: 'pointer' }}>
            <div className="brand-icon" style={{ overflow: 'hidden', padding: 0 }}>
              <img src={logo} alt="RecipeGPT Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          {recentChats.length > 0 ? (
            recentChats.map(chat => (
              <div 
                key={chat.id} 
                className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => loadChat(chat.id)}
              >
                <span className="truncate">{chat.title}</span>
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.85rem', opacity: 0.6, padding: '0.5rem 1rem' }}>No recent chats</div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        
        {/* Toggle Menu Button */}
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>

        {/* HERO TEXT: R E C I P E with COOKIES BACKGROUND */}
        <div className="hero-center">
          <div className="hero-cookies-container">
            <img 
              src="/cookies-clean.png"
              alt="Floating Cookies" 
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
                <div className={`avatar ${msg.role}-avatar`} style={msg.role === 'assistant' ? { overflow: 'hidden', padding: 0 } : {}}>
                  {msg.role === 'user' ? 'U' : (
                    <img src={logo} alt="AI Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div className="message-content">
                  {formatText(msg.content)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant">
                <div className="avatar assistant-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src={logo} alt="AI Loading Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="message-content">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <form className="input-container" onSubmit={sendMessage} onClick={() => setIsSidebarOpen(false)}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsSidebarOpen(false)}
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
