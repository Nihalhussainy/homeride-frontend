import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBell, FiX } from 'react-icons/fi';
import './Notifications.css';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await axios.get('http://localhost:8080/api/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotifications(response.data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll for new notifications every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const handleNotificationClick = async (notification) => {
        setIsOpen(false);
        navigate(notification.link);
    };

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && notifications.length > 0) {
            const token = localStorage.getItem('token');
            try {
                await axios.post('http://localhost:8080/api/notifications/read-all', {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Optimistically update the UI to remove the badge immediately
                const readNotifications = notifications.map(n => ({ ...n, isRead: true }));
                setNotifications(readNotifications);
            } catch (error) {
                console.error('Failed to mark notifications as read:', error);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const notificationDate = new Date(timestamp);
        const seconds = Math.floor((now - notificationDate) / 1000);

        if (seconds < 60) {
            return "just now";
        }
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days = Math.floor(hours / 24);
        if (days === 1) {
            return "Yesterday";
        }
        
        return notificationDate.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notification-container" ref={dropdownRef}>
            <button onClick={handleOpen} className="notification-button">
                <FiBell />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>
            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <button onClick={() => setIsOpen(false)}><FiX /></button>
                    </div>
                    <div className="notification-list">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div key={notification.id} className={`notification-item ${notification.isRead ? 'read' : ''}`} onClick={() => handleNotificationClick(notification)}>
                                    <p>{notification.message}</p>
                                    <span className="notification-time">
                                        {formatRelativeTime(notification.createdAt)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="no-notifications">
                                <p>No new notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Notifications;