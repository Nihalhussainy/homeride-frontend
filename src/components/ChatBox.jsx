import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Button from './Button';
import Input from './Input';
import { FiSend, FiUsers } from 'react-icons/fi';
import './ChatBox.css';
import { FaUserCircle } from 'react-icons/fa';
import { Client } from '@stomp/stompjs';

function ChatBox({ rideId, currentUser, participants }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const clientRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Fetch chat history on component mount
    useEffect(() => {
        const fetchChatHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                setIsLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/history/${rideId}`, {
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

    // Set up WebSocket connection using Client
    useEffect(() => {
        if (!rideId || !currentUser) return;

        const connectWebSocket = () => {
            const token = localStorage.getItem('token');
            
            // Convert http(s) URL to ws(s) for WebSocket connection
            const wsUrl = `${import.meta.env.VITE_API_URL}/ws`.replace(/^http/, 'ws');
            
            // Include token as query parameter
            const wsUrlWithToken = `${wsUrl}?token=${token}`;

            // Create and configure the Stomp Client
            const client = new Client({
                brokerURL: wsUrlWithToken,
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                debug: (str) => { console.log('STOMP DEBUG:', str); }
            });

            // Handle successful connection
            client.onConnect = (frame) => {
                console.log('✅ Connected via STOMP Client:', frame);
                setStompClient(client);
                clientRef.current = client;
                setIsConnected(true);

                // Subscribe to the ride topic
                client.subscribe(`/topic/ride.${rideId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    // Add message to state, preventing duplicates
                    setMessages(prev => {
                        const messageExists = prev.some(msg =>
                            msg.id === receivedMessage.id ||
                            (msg.content === receivedMessage.content &&
                             msg.senderEmail === receivedMessage.senderEmail &&
                             Math.abs(new Date(msg.timestamp) - new Date(receivedMessage.timestamp)) < 1500)
                        );
                        if (messageExists) return prev;
                        return [...prev, receivedMessage];
                    });
                });
            };

            // Handle STOMP protocol errors
            client.onStompError = (frame) => {
                console.error('❌ STOMP Error:', frame.headers['message']);
                console.error('Details:', frame.body);
                setIsConnected(false);
            };

            // Handle WebSocket level errors
            client.onWebSocketError = (error) => {
                console.error('❌ WebSocket Error:', error);
                setIsConnected(false);
            };

            // Handle disconnection
            client.onDisconnect = () => {
                console.log('⚠️ STOMP Client Disconnected');
                setIsConnected(false);
                setStompClient(null);
                clientRef.current = null;
            };

            // Activate the client to initiate connection
            client.activate();

            // Store client in ref immediately for potential cleanup
            clientRef.current = client;
        };

        // Call connectWebSocket
        connectWebSocket();

        // Cleanup function: Deactivate client on component unmount
        return () => {
            if (clientRef.current && clientRef.current.active) {
                clientRef.current.deactivate();
                console.log('STOMP Client deactivated on unmount');
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
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

        if (!stompClient || !stompClient.connected || !trimmedMessage) return;

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
            stompClient.publish({
                destination: `/app/chat.sendMessage`,
                body: JSON.stringify(messagePayload),
            });
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
        const message = messages.findLast(msg => msg.senderEmail === senderEmail);
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

                        const showAvatarAndName = !isMyMessage && msg.senderEmail !== lastSenderEmail;
                        if (!isMyMessage) {
                            lastSenderEmail = msg.senderEmail;
                        } else {
                            lastSenderEmail = null;
                        }

                        return (
                            <div
                                key={msg.id || `${msg.senderEmail}-${msg.timestamp}-${index}`}
                                className={`message-bubble-wrapper ${isMyMessage ? 'my-message' : 'other-message'}`}
                            >
                                <div className="message-content-box">
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
                                                        const parent = e.target.parentNode;
                                                        if (parent && !parent.querySelector('.participant-icon')) {
                                                            const icon = document.createElement('span');
                                                            icon.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" class="participant-icon" height="32" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path><path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"></path></svg>';
                                                            icon.className = 'participant-icon';
                                                            icon.style.fontSize = '32px';
                                                            icon.style.color = 'var(--text-secondary)';
                                                            parent.appendChild(icon);
                                                        }
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
                                        {showAvatarAndName && (
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