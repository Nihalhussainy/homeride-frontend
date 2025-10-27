import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Button from './Button';
import Input from './Input';
import { FiSend, FiUsers } from 'react-icons/fi';
import './ChatBox.css';
import { FaUserCircle } from 'react-icons/fa';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function ChatBox({ rideId, currentUser, participants }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const clientRef = useRef(null);

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/history/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(response.data || []);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (rideId) fetchChatHistory();
  }, [rideId]);

  // Setup SockJS + STOMP connection
  useEffect(() => {
    if (!rideId || !currentUser) return;

    const token = localStorage.getItem('token');
    const socket = new SockJS(`${import.meta.env.VITE_API_URL}/ws`);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('STOMP DEBUG:', str),
    });

    client.onConnect = () => {
      console.log('✅ Connected via STOMP + SockJS');
      clientRef.current = client;
      setIsConnected(true);

      // Subscribe to ride topic
      client.subscribe(`/topic/ride.${rideId}`, (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prev) => {
            const exists = prev.some(
              (msg) =>
                msg.id === receivedMessage.id ||
                (msg.content === receivedMessage.content &&
                  msg.senderEmail === receivedMessage.senderEmail &&
                  Math.abs(new Date(msg.timestamp) - new Date(receivedMessage.timestamp)) < 1500)
            );
            if (exists) return prev;
            return [...prev, receivedMessage];
          });
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame.headers['message']);
      setIsConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };

    client.onDisconnect = () => {
      console.log('⚠️ STOMP disconnected');
      setIsConnected(false);
    };

    client.activate();

    return () => {
      if (client && client.active) {
        client.deactivate();
        console.log('STOMP Client deactivated');
      }
    };
  }, [rideId, currentUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!clientRef.current || !clientRef.current.connected || !trimmed) return;

    const message = {
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      senderProfilePictureUrl: currentUser.profilePictureUrl,
      content: trimmed,
      rideId,
      type: 'GROUP',
    };

    try {
      clientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message),
      });
      setInputMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return (
      date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const getProfilePictureUrl = (senderEmail) => {
    const msg = messages.findLast((m) => m.senderEmail === senderEmail);
    if (msg && msg.senderProfilePictureUrl) return msg.senderProfilePictureUrl;
    const participant = participants.find((p) => p.email === senderEmail);
    return participant?.profilePictureUrl || null;
  };

  const getSenderName = (senderEmail) => {
    const participant = participants.find((p) => p.email === senderEmail);
    return participant?.name || 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className="chat-box-container">
        <div className="chat-header">
          <h3>Ride Chat</h3>
        </div>
        <div className="chat-loading">Loading chat...</div>
      </div>
    );
  }

  let lastSenderEmail = null;

  return (
    <div className="chat-box-container">
      <div className="chat-header">
        <h3>Ride Chat</h3>
        <div className="chat-status">
          {isConnected ? (
            <span className="status-connected">Connected</span>
          ) : (
            <span className="status-disconnected">Connecting...</span>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <FiUsers size={48} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.senderEmail === currentUser.email;
            const senderName = getSenderName(msg.senderEmail);
            const profileUrl = getProfilePictureUrl(msg.senderEmail);
            const showAvatar = !isMine && msg.senderEmail !== lastSenderEmail;

            if (!isMine) lastSenderEmail = msg.senderEmail;
            else lastSenderEmail = null;

            return (
              <div
                key={msg.id || `${msg.senderEmail}-${msg.timestamp}-${i}`}
                className={`message-bubble-wrapper ${isMine ? 'my-message' : 'other-message'}`}
              >
                <div className="message-content-box">
                  {!isMine && (
                    <div className={`message-avatar ${showAvatar ? '' : 'hidden-avatar'}`}>
                      {profileUrl ? (
                        <img
                          src={profileUrl}
                          alt={senderName}
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      ) : (
                        <FaUserCircle size={32} className="participant-icon" />
                      )}
                    </div>
                  )}

                  <div className="message-text-bubble">
                    {showAvatar && <span className="message-sender-name">{senderName}</span>}
                    <p>{msg.content}</p>
                    <span className="message-timestamp">{formatTimestamp(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <Input
          type="text"
          placeholder={isConnected ? 'Type your message...' : 'Connecting...'}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={!isConnected}
          maxLength={500}
        />
        <Button type="submit" disabled={!isConnected || !inputMessage.trim()}>
          <FiSend />
        </Button>
      </form>
    </div>
  );
}

export default ChatBox;
