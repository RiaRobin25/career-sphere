import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../App';

function Chat() {
  const { user, token } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // States
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null); // active user object
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Socket ref
  const socketRef = useRef(null);

  // Read partnerId from query param
  const queryParams = new URLSearchParams(location.search);
  const partnerIdFromQuery = queryParams.get('partnerId');

  // Connect to Socket.io on load
  useEffect(() => {
    if (!user) return;

    // Connect socket
    socketRef.current = io('http://localhost:5000');
    
    // Join channel
    socketRef.current.emit('join', user.id);

    // Listen for online users updates
    socketRef.current.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    // Listen for incoming messages
    socketRef.current.on('receive-message', (newMsg) => {
      // If message is from or to the active partner, append to messages
      if (
        (newMsg.senderId === user.id && newMsg.receiverId === activePartner?.id) ||
        (newMsg.senderId === activePartner?.id && newMsg.receiverId === user.id)
      ) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Update conversations list summary
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === newMsg.senderId || conv.id === newMsg.receiverId) {
            return {
              ...conv,
              lastMessage: newMsg.content,
              lastTimestamp: newMsg.timestamp
            };
          }
          return conv;
        });
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, activePartner]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Conversations List
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch('/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        // Handle auto-selection of query partner or first conversation
        if (partnerIdFromQuery) {
          // Check if partner is already in conversations list
          const existing = data.find(c => c.id === partnerIdFromQuery);
          if (existing) {
            setActivePartner(existing);
          } else {
            // Fetch partner details from server (user details endpoint or search backend list)
            // For simplicity, fetch all users and look up details
            const usersRes = await fetch(`/api/users/${partnerIdFromQuery}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersRes.ok) {
              const partnerDetails = await usersRes.json();
              if (partnerDetails) {
                const tempPartner = {
                  id: partnerDetails.id,
                  name: partnerDetails.name,
                  email: partnerDetails.email,
                  role: partnerDetails.role,
                  lastMessage: '',
                  lastTimestamp: '',
                  online: onlineUsers.includes(partnerDetails.id)
                };
                setConversations(prev => [tempPartner, ...prev]);
                setActivePartner(tempPartner);
              }
            }
          }
        } else if (data.length > 0 && !activePartner) {
          setActivePartner(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [partnerIdFromQuery, token]);

  // Fetch Messages for active partner
  useEffect(() => {
    if (!activePartner) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await fetch(`/api/chat/messages/${activePartner.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error loading chat logs:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activePartner, token]);

  // Send Message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activePartner || !socketRef.current) return;

    const payload = {
      senderId: user.id,
      receiverId: activePartner.id,
      content: messageText
    };

    // Emit socket event
    socketRef.current.emit('send-message', payload);
    setMessageText('');
  };

  return (
    <div className="page-transition container" style={{ paddingTop: '40px', marginBottom: '40px' }}>
      
      <div className="chat-container">
        
        {/* Left Side: Conversations Sidebar */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Chat Contacts</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Connect directly with seekers &amp; managers
            </p>
          </div>

          <div className="chat-conversation-list">
            {loadingConversations ? (
              <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Loading contacts...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                No active conversations. Open a job details page or dashboard to message a candidate/employer.
              </div>
            ) : (
              conversations.map((conv) => {
                const isOnline = onlineUsers.includes(conv.id);
                const isActive = activePartner?.id === conv.id;
                
                return (
                  <div 
                    key={conv.id}
                    onClick={() => setActivePartner(conv)}
                    className={`chat-conversation-item ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: conv.role === 'employer' ? 'var(--accent-primary-glow)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: conv.role === 'employer' ? '#a78bfa' : 'var(--text-primary)'
                      }}>
                        {conv.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        border: '2px solid var(--bg-secondary)',
                        borderRadius: '50%'
                      }} className={isOnline ? "online-dot" : "offline-dot"}></div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.name}
                        </h4>
                        {conv.lastTimestamp && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Side: Message Room */}
        <section className="chat-main">
          {activePartner ? (
            <>
              {/* Chat Header details */}
              <div className="chat-header">
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activePartner.name}
                    <span className={onlineUsers.includes(activePartner.id) ? "online-dot" : "offline-dot"}></span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {activePartner.role === 'employer' ? '💼 Employer / Recruiter' : '👤 Candidate / Job Seeker'}
                  </span>
                </div>
              </div>

              {/* Message scroll log */}
              <div className="chat-messages">
                {loadingMessages ? (
                  <div style={{ margin: 'auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Loading message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '2.5rem' }}>💬</span>
                    <h4 style={{ marginTop: '12px' }}>Start of Conversation</h4>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Send a message to start chatting in real time.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSentByMe = msg.senderId === user.id;
                    return (
                      <div 
                        key={msg.id}
                        className={`chat-message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                      >
                        <div>{msg.content}</div>
                        <div style={{
                          fontSize: '0.65rem',
                          textAlign: 'right',
                          marginTop: '4px',
                          color: isSentByMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{ flex: 1, height: '46px' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ width: '90px', height: '46px' }}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3rem' }}>💬</span>
              <h3 style={{ marginTop: '16px', fontSize: '1.25rem' }}>Your Inbox</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '6px', maxWidth: '300px' }}>
                Select a contact from the sidebar list to view conversation history and chat in real-time.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default Chat;
