import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [latestMessageSignal, setLatestMessageSignal] = useState(null);
  const [conversationSignal, setConversationSignal] = useState(null);

  // Initial notifications fetch
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data?.status === 'success') {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadNotifCount(notifs.length);
      }
    } catch (err) {
      console.error('Failed to fetch initial notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadNotifCount(0);
      setOnlineUsers(new Set());
      return;
    }

    fetchNotifications();

    // Connect socket to backend server port 5000
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-user', user._id || user.id);
    });

    newSocket.on('online-users', (userIds) => {
      setOnlineUsers(new Set(userIds || []));
    });

    // Real-time events
    newSocket.on('new-notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotifCount((prev) => prev + 1);
    });

    newSocket.on('receive-message', (message) => {
      setLatestMessageSignal(message);
    });

    newSocket.on('conversation-updated', (conversation) => {
      setConversationSignal(conversation);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const deleteNotification = async (notificationId) => {
    try {
      const res = await api.delete(`/notifications/${notificationId}`);
      if (res.data?.status === 'success') {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await api.delete('/notifications');
      if (res.data?.status === 'success') {
        setNotifications([]);
        setUnreadNotifCount(0);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        unreadNotifCount,
        setUnreadNotifCount,
        latestMessageSignal,
        conversationSignal,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
