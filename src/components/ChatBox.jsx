import React, { useState, useEffect, useRef } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import Button from './Button';
import Input from './Input';
import { FiSend, FiUsers } from 'react-icons/fi';
import './ChatBox.css';
import { FaUserCircle } from 'react-icons/fa';

function ChatBox({ rideId, currentUser, participants }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    
    // Fetch chat history on component mount
    useEffect(() => {
        const fetchChatHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                setIsLoading(true);
                const response = await axios.get(`http://localhost:8080/api/chat/history/${rideId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setMessages(response.data || []);
            } catch (error) {
                console.error('Failed to fetch chat history:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (rideId) {
            fetchChatHistory();
        }
    }, [rideId]);
    
    // Set up WebSocket connection with authentication
    useEffect(() => {
        if (!rideId || !currentUser) return;

        const connectWebSocket = () => {
            const token = localStorage.getItem('token');
            const socket = new SockJS('http://localhost:8080/ws');
            const client = Stomp.over(socket);

            // Add authentication header
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            client.connect(headers, 
                (frame) => {
                    console.log('Connected to WebSocket:', frame);
                    setStompClient(client);
                    setIsConnected(true);

                    // Subscribe to the ride's group chat topic
                    client.subscribe(`/topic/ride.${rideId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        
                        // Add message to state (backend handles deduplication by saving first)
                        setMessages(prev => {
                            // Check if message already exists to prevent duplicates
                            const messageExists = prev.some(msg => 
                                msg.id === receivedMessage.id || 
                                (msg.content === receivedMessage.content && 
                                 msg.senderEmail === receivedMessage.senderEmail &&
                                 Math.abs(new Date(msg.timestamp) - new Date(receivedMessage.timestamp)) < 1000)
                            );
                            
                            if (messageExists) {
                                return prev;
                            }
                            
                            return [...prev, receivedMessage];
                        });
                    });
                },
                (error) => {
                    console.error('WebSocket connection error:', error);
                    setIsConnected(false);
                    setStompClient(null);
                    
                    // Attempt to reconnect after 3 seconds
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                }
            );
        };

        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (stompClient && stompClient.connected) {
                stompClient.disconnect();
            }
        };
    }, [rideId, currentUser]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (event) => {
        event.preventDefault();
        
        const trimmedMessage = inputMessage.trim();
        if (!stompClient || !isConnected || !trimmedMessage) return;
        
        // Validate message length
        if (trimmedMessage.length > 500) {
            alert('Message is too long. Please keep it under 500 characters.');
            return;
        }
        
        const messagePayload = {
            senderName: currentUser.name,
            senderEmail: currentUser.email,
            senderProfilePictureUrl: currentUser.profilePictureUrl,
            content: trimmedMessage,
            rideId: rideId,
            type: 'GROUP'
        };
        
        try {
            stompClient.send(`/app/chat.sendMessage`, {}, JSON.stringify(messagePayload));
            setInputMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                   date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const getProfilePictureUrl = (senderEmail) => {
        const message = messages.find(msg => msg.senderEmail === senderEmail);
        if (message && message.senderProfilePictureUrl) {
            return message.senderProfilePictureUrl;
        }
        
        const participant = participants.find(p => p.email === senderEmail);
        return participant?.profilePictureUrl || null;
    };

    const getSenderName = (senderEmail) => {
        const participant = participants.find(p => p.email === senderEmail);
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

    // Keep track of the last sender to group messages
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
                    messages.map((msg, index) => {
                        const isMyMessage = msg.senderEmail === currentUser.email;
                        const senderName = getSenderName(msg.senderEmail);
                        const profilePictureUrl = getProfilePictureUrl(msg.senderEmail);
                        
                        // Check if the sender is the same as the previous message
                        const showAvatarAndName = msg.senderEmail !== lastSenderEmail;
                        lastSenderEmail = msg.senderEmail;

                        return (
                            <div 
                                key={msg.id || `${msg.senderEmail}-${msg.timestamp}-${index}`}
                                className={`message-bubble-wrapper ${isMyMessage ? 'my-message' : 'other-message'}`}
                            >
                                <div className="message-content-box">
                                    {/* Conditionally render avatar for other messages */}
                                    {!isMyMessage && (
                                        <div 
                                            className={`message-avatar ${showAvatarAndName ? '' : 'hidden-avatar'}`}
                                            style={{ cursor: 'default' }}
                                        >
                                            {profilePictureUrl ? (
                                                <img 
                                                    src={profilePictureUrl} 
                                                    alt={senderName}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <FaUserCircle 
                                                    size={32} 
                                                    className="participant-icon"
                                                />
                                            )}
                                        </div>
                                    )}

                                    <div className="message-text-bubble">
                                        {/* Conditionally render sender name for other messages */}
                                        {!isMyMessage && showAvatarAndName && (
                                            <span className="message-sender-name">
                                                {senderName}
                                            </span>
                                        )}
                                        <p>{msg.content}</p>
                                        <span className="message-timestamp">
                                            {formatTimestamp(msg.timestamp)}
                                        </span>
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
                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
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