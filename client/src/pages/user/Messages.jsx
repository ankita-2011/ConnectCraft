import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { 
  Send, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  Search,
  Plus,
  X,
  Users,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import '../../styles/user/profile.css';
import '../../styles/user/dashboard.css';
import '../../styles/user/chat.css';
import '../../styles/user/auth.css';

const Messages = () => {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers, latestMessageSignal, conversationSignal } = useSocket();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const targetUserId = searchParams.get('userId');
  const targetUsername = searchParams.get('username');

  const isPeerOnline = (peer) => {
    if (!peer || !peer._id) return false;
    if (peer.showOnlineStatus === false) return false;
    return onlineUsers ? onlineUsers.has(peer._id.toString()) : false;
  };

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [mobileView, setMobileView] = useState(targetUserId || targetUsername ? 'chat' : 'list');

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  // Sidebar conversations search
  const [convSearch, setConvSearch] = useState('');

  // Start New Chat Modal States
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [myConnections, setMyConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionSearch, setConnectionSearch] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await api.get('/conversations');
      if (response.data?.status === 'success') {
        const convs = response.data.conversations || [];
        setConversations(convs);

        const targetIdOrName = targetUserId || targetUsername;

        if (targetIdOrName) {
          const match = convs.find((c) => 
            c.peer && (
              (targetUserId && c.peer._id?.toString() === targetUserId.toString()) ||
              (targetUsername && c.peer.username === targetUsername) ||
              (targetUserId && c.peer.username === targetUserId)
            )
          );

          if (match) {
            setSelectedConversation(match);
          } else {
            let peerUserId = targetUserId;
            let peerName = 'Connected Partner';
            let peerUsername = targetUsername || '';
            let peerEmail = '';
            let peerHeadline = '';
            let peerPhoto = '';

            const searchIdentifier = targetUsername || targetUserId;
            const peerRes = await api.get(`/profile/${searchIdentifier}`).catch(() => null);
            if (peerRes?.data?.status === 'success' && peerRes.data.profile) {
              const pProf = peerRes.data.profile;
              peerUserId = typeof pProf.userId === 'object' ? (pProf.userId?._id || targetUserId) : (pProf.userId || targetUserId);
              peerName = (typeof pProf.userId === 'object' ? pProf.userId?.name : '') || pProf.username || 'Connected Partner';
              peerEmail = (typeof pProf.userId === 'object' ? pProf.userId?.email : '') || '';
              peerUsername = pProf.username || targetUsername || '';
              peerHeadline = pProf.headline || '';
              peerPhoto = pProf.profilePhoto || '';
            } else {
              // Fallback: Fetch user's connections list to locate peer details
              const connRes = await api.get('/connections').catch(() => null);
              if (connRes?.data?.status === 'success' && connRes.data.connections) {
                const conn = connRes.data.connections.find((c) => {
                  const uId = c.userId?._id || c.userId;
                  return (
                    (targetUserId && uId?.toString() === targetUserId?.toString()) ||
                    (targetUsername && c.username === targetUsername) ||
                    c.username === targetUserId ||
                    c.connectionId === targetUserId
                  );
                });
                if (conn) {
                  peerUserId = conn.userId?._id || conn.userId || targetUserId;
                  peerName = conn.userId?.name || conn.username || 'Connected Partner';
                  peerEmail = conn.userId?.email || '';
                  peerUsername = conn.username || targetUsername || '';
                  peerHeadline = conn.headline || '';
                  peerPhoto = conn.profilePhoto || '';
                }
              }
            }

            const fakeConv = {
              _id: 'new',
              peer: {
                _id: peerUserId,
                name: peerName,
                email: peerEmail,
                username: peerUsername,
                headline: peerHeadline,
                profilePhoto: peerPhoto,
              },
              lastMessage: '',
              lastMessageTime: new Date(),
            };

            setConversations((prev) => [fakeConv, ...prev.filter((c) => c._id !== 'new')]);
            setSelectedConversation(fakeConv);
            setMobileView('chat');
          }
        } else if (convs.length > 0 && !selectedConversation) {
          setSelectedConversation(convs[0]);
        }
      }
    } catch  {
      setError('Failed to retrieve chat conversations.');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [targetUserId, targetUsername]);

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId) => {
    if (!conversationId || conversationId === 'new') {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await api.get(`/messages/${conversationId}`);
      if (response.data?.status === 'success') {
        setMessages(response.data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  // Real-time socket message listener
  useEffect(() => {
    if (!latestMessageSignal) return;

    if (
      selectedConversation &&
      (latestMessageSignal.conversation === selectedConversation._id ||
        latestMessageSignal.sender._id === selectedConversation.peer?._id)
    ) {
      setMessages((prev) => [...prev, latestMessageSignal]);
      setTimeout(scrollToBottom, 100);
    }

    fetchConversations();
  }, [latestMessageSignal]);

  useEffect(() => {
    if (conversationSignal) {
      fetchConversations();
    }
  }, [conversationSignal]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation?.peer) return;

    const peerId = selectedConversation.peer._id;
    const text = messageInput.trim();
    setMessageInput('');

    try {
      const response = await api.post('/messages', {
        receiverId: peerId,
        message: text,
      });

      if (response.data?.status === 'success') {
        const newMsg = response.data.message;
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);
        fetchConversations();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send private message.');
    }
  };

  // Open "Start New Chat" modal & fetch user connections
  const handleOpenNewChatModal = async () => {
    setNewChatModalOpen(true);
    setLoadingConnections(true);
    try {
      const res = await api.get('/connections');
      if (res.data?.status === 'success') {
        setMyConnections(res.data.connections || []);
      }
    } catch (err) {
      console.error('Failed to load connections for chat:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Select a connection from the modal to start chat
  const handleSelectConnectionForChat = (conn) => {
    const peerUser = conn.userId || {};
    const peerUserId = peerUser._id || peerUser;
    const existingConv = conversations.find(
      (c) => c.peer && (c.peer._id?.toString() === peerUserId?.toString() || c.peer.username === conn.username)
    );

    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      const fakeConv = {
        _id: 'new',
        peer: {
          _id: peerUserId,
          name: peerUser.name || conn.username || 'User',
          email: peerUser.email || '',
          username: conn.username,
          headline: conn.headline,
          profilePhoto: conn.profilePhoto,
        },
        lastMessage: '',
        lastMessageTime: new Date(),
      };
      setConversations((prev) => [fakeConv, ...prev.filter((c) => c._id !== 'new')]);
      setSelectedConversation(fakeConv);
    }

    setMobileView('chat');
    setNewChatModalOpen(false);
  };

  // Filter conversation list by search input
  const filteredConversations = conversations.filter((c) => {
    const query = convSearch.toLowerCase().trim();
    if (!query) return true;
    const name = c.peer?.name || '';
    const username = c.peer?.username || '';
    const lastMsg = c.lastMessage || '';
    return (
      name.toLowerCase().includes(query) ||
      username.toLowerCase().includes(query) ||
      lastMsg.toLowerCase().includes(query)
    );
  });

  const filteredConnections = myConnections.filter((c) => {
    const search = connectionSearch.toLowerCase().trim();
    if (!search) return true;
    const name = c.userId?.name || '';
    const username = c.username || '';
    const headline = c.headline || '';
    return (
      name.toLowerCase().includes(search) ||
      username.toLowerCase().includes(search) ||
      headline.toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Section */}
      <div
        className="glass"
        style={{
          padding: '1.5rem 2rem',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #0F766E',
          boxShadow: '0 8px 32px rgba(28,25,23,0.06)',
        }}
      >
        <div>
          <h1 className="text-gradient" style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>
            Private Messages
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Real-time chat with your connected ConnectCraft learning partners.
          </p>
        </div>

        <button
          onClick={handleOpenNewChatModal}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '12px',
          }}
        >
          <Plus size={18} /> Start New Chat
        </button>
      </div>

      {error && <div className="alert-message error">{error}</div>}

      {/* Main Chat Workspace */}
      <div className={`chat-container ${mobileView === 'chat' ? 'mobile-show-chat' : 'mobile-show-list'}`}>
        
        {/* SIDEBAR: Conversation List */}
        <div className="conversation-sidebar">
          <div className="conversation-sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1C1917' }}>
                  Conversations
                </h3>
                <span style={{ fontSize: '0.725rem', color: '#78716C', fontWeight: 600 }}>
                  {conversations.length} Active Chats
                </span>
              </div>

              <button
                onClick={handleOpenNewChatModal}
                style={{
                  background: '#F0FDFA',
                  border: '1px solid #CCFBF1',
                  color: '#0F766E',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                title="Start a new chat"
              >
                <Plus size={14} /> New
              </button>
            </div>

            {/* Sidebar Search Input */}
            <div className="conversation-search-wrapper">
              <input
                type="text"
                className="conversation-search-input"
                placeholder="Filter chats..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
              />
              <Search size={14} className="conversation-search-icon" />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="conversation-list">
            {loadingConversations ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                <div
                  className="spinner"
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '3px solid var(--bg-tertiary)',
                    borderTop: '3px solid #0F766E',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#78716C', fontSize: '0.85rem' }}>
                <MessageSquare style={{ width: '28px', height: '28px', marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ marginBottom: '1rem', fontWeight: 600 }}>No conversations found</p>
                <button
                  onClick={handleOpenNewChatModal}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '10px' }}
                >
                  <Plus size={14} /> Start a Chat
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation && selectedConversation._id === conv._id;
                const peerName = conv.peer?.name || 'Connected Peer';
                const initials = peerName.split(' ').map((n) => n[0]).join('').toUpperCase();

                return (
                  <div
                    key={conv._id}
                    className={`conversation-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMobileView('chat');
                    }}
                  >
                    <div className="conversation-avatar">
                      {conv.peer?.profilePhoto ? (
                        <img src={conv.peer.profilePhoto} alt={peerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initials
                      )}
                      {isPeerOnline(conv.peer) && <div className="online-indicator" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1C1917', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {peerName}
                        </h4>
                        <span style={{ fontSize: '0.65rem', color: '#A8A29E', fontWeight: 500 }}>
                          {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: '#78716C', margin: '0.2rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.lastMessage || 'Start conversation...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT WINDOW: Header, Message History & Input */}
        <div className="chat-window">
          {selectedConversation ? (
            <>
              {/* Chat Window Header */}
              <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    className="chat-back-btn"
                    onClick={() => setMobileView('list')}
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="conversation-avatar" style={{ width: '42px', height: '42px' }}>
                    {selectedConversation.peer?.profilePhoto ? (
                      <img src={selectedConversation.peer.profilePhoto} alt={selectedConversation.peer?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (selectedConversation.peer?.name || 'P').split(' ').map((n) => n[0]).join('').toUpperCase()
                    )}
                    {isPeerOnline(selectedConversation.peer) && <div className="online-indicator" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#1C1917' }}>
                      {selectedConversation.peer?.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#78716C', margin: '0.15rem 0 0' }}>
                      @{selectedConversation.peer?.username || 'peer'} • {isPeerOnline(selectedConversation.peer) ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>

                {selectedConversation.peer?.username && (
                  <Link
                    to={`/profile/${selectedConversation.peer.username}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#0F766E',
                      background: '#F0FDFA',
                      border: '1px solid #CCFBF1',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '10px',
                      textDecoration: 'none',
                    }}
                  >
                    View Profile <ExternalLink size={13} />
                  </Link>
                )}
              </div>

              {/* Message History List */}
              <div className="message-history">
                <div className="date-separator">
                  <span className="date-separator-badge">Today</span>
                </div>

                {loadingMessages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                    <div
                      className="spinner"
                      style={{
                        width: '26px',
                        height: '26px',
                        border: '2px solid #E7E5E4',
                        borderTop: '2px solid #0F766E',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 0', color: '#78716C', fontSize: '0.85rem' }}>
                    <MessageSquare style={{ width: '36px', height: '36px', marginBottom: '0.6rem', color: '#0F766E', opacity: 0.6 }} />
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1C1917', margin: 0 }}>No messages yet</p>
                    <p style={{ fontSize: '0.8rem', color: '#78716C', margin: '0.25rem 0 0' }}>
                      Send your first message to start collaborating with {selectedConversation.peer?.name}!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender._id === currentUser._id;
                    return (
                      <div key={msg._id} className={`message-bubble-wrapper ${isOwn ? 'own' : 'peer'}`}>
                        <div className={`message-bubble ${isOwn ? 'own' : 'peer'}`}>
                          <p style={{ margin: 0 }}>{msg.message}</p>
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Industry-Standard Message Input Bar */}
              <form onSubmit={handleSendMessage} className="message-input-form">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    className="chat-message-input"
                    placeholder={`Write a message to ${selectedConversation.peer?.name || 'connection'}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="send-message-btn"
                  disabled={!messageInput.trim()}
                  title="Send message (Enter)"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            /* Empty Chat Window Placeholder */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem', textAlign: 'center', color: '#78716C' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0F766E',
                  marginBottom: '1.25rem',
                  boxShadow: '0 8px 24px rgba(15, 118, 110, 0.15)',
                }}
              >
                <MessageSquare style={{ width: '34px', height: '34px' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>
                Your Messaging Center
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#78716C', maxWidth: '340px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Select an active conversation from the left sidebar or click Start New Chat to pick a connection.
              </p>
              <button
                onClick={handleOpenNewChatModal}
                className="btn-primary"
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px' }}
              >
                <Plus size={16} /> Start New Chat
              </button>
            </div>
          )}
        </div>

      </div>

      {/* START NEW CHAT MODAL */}
      {newChatModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px', width: '90%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E7E5E4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#0F766E" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1C1917' }}>Start New Conversation</h3>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#78716C', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Connection Search Bar */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type="text"
                className="nav-search-input"
                placeholder="Search connections..."
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.85rem', height: '42px', borderRadius: '12px' }}
                autoFocus
              />
              <Search style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#A8A29E', width: '16px', height: '16px' }} />
            </div>

            {/* Connection List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {loadingConnections ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                  <div
                    className="spinner"
                    style={{
                      width: '28px',
                      height: '28px',
                      border: '3px solid #E7E5E4',
                      borderTop: '3px solid #0F766E',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              ) : filteredConnections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#78716C', fontSize: '0.85rem' }}>
                  <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  {myConnections.length === 0 ? (
                    <>
                      <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1C1917' }}>No connections found</p>
                      <p style={{ fontSize: '0.8rem', color: '#78716C', marginBottom: '1rem' }}>
                        You need to connect with peers first to send them direct messages.
                      </p>
                      <Link
                        to="/discover"
                        onClick={() => setNewChatModalOpen(false)}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '10px' }}
                      >
                        Explore & Find Partners →
                      </Link>
                    </>
                  ) : (
                    <p>No connections match your search query.</p>
                  )}
                </div>
              ) : (
                filteredConnections.map((conn) => {
                  const peerUser = conn.userId || {};
                  const name = peerUser.name || 'Connected Peer';
                  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase();

                  return (
                    <div
                      key={conn._id}
                      onClick={() => handleSelectConnectionForChat(conn)}
                      className="conversation-item"
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.35rem',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div className="conversation-avatar" style={{ width: '40px', height: '40px' }}>
                        {conn.profilePhoto ? (
                          <img src={conn.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initials
                        )}
                        <div className="online-indicator" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: '#1C1917' }}>{name}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#78716C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conn.headline || `@${conn.username}`}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#0F766E', fontWeight: 600 }}>Chat →</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Messages;
