import React, { useState } from 'react';
import axios from 'axios';
import '../StaticPages.css';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext.jsx';


function ContactPage() {
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post('http://localhost:8080/api/contact/send', formData);
            
            showNotification(response.data.message || "Thank you for your message! We'll get back to you soon.", 'success');
            setFormData({ name: '', email: '', message: '' }); // Reset form
        } catch (error) {
            console.error('Error sending message:', error);
            showNotification(
                error.response?.data?.message || 'Failed to send message. Please try again later.',
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };


  return (
    <div className="main-container">
      <header className="page-header">
        <h1>Get In Touch</h1>
        <p className="page-description">We're here to help. Reach out to us with any questions or feedback.</p>
      </header>

      <div className="contact-grid">
        <div className="contact-info">
          <h3>Contact Information</h3>
          <p>Fill out the form and our team will get back to you within 24 hours.</p>
          
          <ul className="contact-details-list">
            <li>
                <FiMail className="contact-icon" />
                <a href="mailto:contacthomeride@gmail.com">contacthomeride@gmail.com</a>
            </li>
            
            <li>
                <FiMapPin className="contact-icon" />
                <span>India</span>
            </li>
          </ul>
        </div>

        <div className="contact-form-container">
            <form onSubmit={handleSubmit} className="contact-form">
                <Input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                />
                <Input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                />
                <textarea
                    name="message"
                    className="custom-input"
                    placeholder="Your Message"
                    rows="6"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                ></textarea>
                <Button type="submit" disabled={isSubmitting}>
                    <FiSend /> {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;