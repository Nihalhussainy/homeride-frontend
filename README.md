# HomeRide - Corporate Carpooling Platform 🚗💨

> **"Your Daily Commute, Reimagined."**

<p align="center">
  <a href="https://homeride-frontend.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-homeride.vercel.app-brightgreen.svg" alt="Live Demo">
  </a>
</p>

## Overview

**HomeRide** is a comprehensive, full-stack web platform designed to facilitate carpooling exclusively for employees within an organization.  
Developed as an internship project at **Sopra Steria**, this application connects employees to share rides, creating a community-driven solution to commuting.

The platform empowers employees to offer their empty car seats or find rides with trusted colleagues, achieving three primary goals:

* **💸 Save Money:** Reduces commuting costs by up to 75% by sharing fuel and toll expenses.  
* **🌍 Go Green:** Lowers the organization's carbon footprint, saving an average of 2.5kg of CO₂ per shared trip.  
* **🤝 Build Community:** Fosters networking and strengthens workplace connections during commutes.

The backend is built with **Java Spring Boot** and deployed on **Render**, while the frontend is a modern **React SPA** deployed on **Vercel**.

---

## ✨ Key Features

### 1. User Authentication & Profiles
* **Secure Authentication:** Robust JWT-based authentication and authorization using Spring Security.  
* **Role-Based Access:** Differentiated access levels for `EMPLOYEE` and `ADMIN` roles.  
* **Comprehensive User Profiles:** Detailed user profiles displaying name, contact info, profile picture (hosted on Cloudinary), average rating, and full history of feedback and rides.

### 2. Ride Lifecycle Management
* **Offer a Ride:** An intuitive multi-step form allows drivers to post rides, specify origin, destination, and multiple stopovers using the **Google Places Autocomplete API**.  
* **Vehicle & Price Settings:** Drivers can set vehicle details, seat capacity, gender preferences, and a price per seat. The system provides a recommended price based on route distance.  
* **Advanced Ride Search:** Passengers can search for rides filtering by origin, destination, date, and available seats.  
* **Interactive Booking:** Ride detail pages include an interactive **Google Map** showing the full route and stopovers, transparent pricing, and participant info.  
* **"My Rides" Dashboard:** A central dashboard for users to manage their upcoming and completed rides as both driver and passenger.

### 3. Communication & Trust
* **Real-time Ride Chat:** A WebSocket-based group chat (SockJS & STOMP) enables real-time coordination between driver and passengers.  
* **Rating & Feedback System:** After a ride, participants can rate and leave feedback for one another to build trust.

### 4. Admin & Platform Features
* **Admin Dashboard:** A dedicated `/admin` panel provides platform statistics like total users and total rides.  
* **Employee Management:** Admins can view all employees, roles, ride history, and manage user details.  
* **AI Chatbot (GOGO):** Integrated AI assistant powered by **Google Gemini API** for platform support and FAQs.  
* **Email & In-App Notifications:** Uses **SendGrid** and in-app alerts to notify users about bookings, messages, and feedback.  
* **Analytics:** User behavior and usage are tracked using **Google Analytics 4** (`react-ga4`).

---

## 🏛️ System Architecture

The platform follows a modern three-tier distributed architecture:

* **Frontend (Client Layer):** Responsive **React SPA**, deployed on **Vercel’s CDN** for optimal performance.  
* **Backend (API Layer):** Stateless **Spring Boot API** on **Render**, managing business logic and API integrations, secured with JWT.  
* **Data & Services Layer:**  
  - **Database:** **PostgreSQL** on Render, storing users, rides, and bookings.  
  - **Real-time Chat:** **WebSocket** endpoint on the backend.  
  - **External APIs:**  
    - **Google Maps & Places** – geocoding, distance, and autocomplete.  
    - **Cloudinary** – image storage and CDN delivery.  
    - **SendGrid** – transactional emails.  
    - **Google Gemini** – AI chatbot integration.

---

## 🛠️ Technology Stack

### **Backend (from `pom.xml`)**

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Spring Boot 3.2.5 | Core backend framework |
| **Language** | Java 17 | Base programming language |
| **Security** | Spring Security | JWT Authentication & Authorization |
| **Data** | Spring Data JPA / Hibernate | ORM & data persistence |
| **Database** | PostgreSQL | Relational database |
| **Real-time** | Spring WebSocket / SockJS | Real-time chat |
| **APIs** | Google Maps, Cloudinary, SendGrid | External integrations |
| **Utility** | Lombok | Reduces boilerplate code |
| **Build Tool** | Apache Maven | Dependency management |

### **Frontend (from `package.json`)**

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React | Core UI library |
| **Routing** | react-router-dom | Client-side routing |
| **API Client** | axios | HTTP requests |
| **Maps** | @react-google-maps/api | Google Maps integration |
| **Real-time** | sockjs-client, stompjs | WebSocket client |
| **Analytics** | react-ga4 | Google Analytics 4 |
| **Auth** | jwt-decode | Decode JWT tokens |

### **Infrastructure & Deployment**

| Category | Service | Purpose |
| :--- | :--- | :--- |
| **Backend** | Render | Cloud hosting for Spring Boot API |
| **Frontend** | Vercel | Hosting for React SPA |
| **Database** | PostgreSQL on Render | Managed relational DB |
| **File Storage** | Cloudinary | Image storage & CDN |

---

## 🚀 Getting Started

Run the app locally by setting up both backend and frontend.

### **Prerequisites**
* Java 17+
* Apache Maven
* Node.js & npm
* PostgreSQL
* API Keys for Google Maps, Cloudinary, SendGrid, Gemini

