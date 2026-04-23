# 🎬 ElitePlus: Multi-Platform Media Streaming Ecosystem

[![Python](https://img.shields.io/badge/Backend-Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Android](https://img.shields.io/badge/Mobile-Android_APK-3DDC84?logo=android&logoColor=white)](https://developer.android.com/)
[![JavaScript](https://img.shields.io/badge/Frontend-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ElitePlus** is a comprehensive, cross-platform media server and streaming application. It provides a centralized hub for managing and viewing movies and series, bridging the gap between desktop web browsers and mobile Android devices through a unified Flask backend.

---

## ✨ Key Features

### 🌐 Unified Web Interface
* **Modular Library:** Separate dedicated portals for Movies and TV Series with intelligent categorization.
* **Dynamic Search:** Real-time filtering of media assets using optimized JavaScript search logic.
* **Authentication Guard:** Secure session-based access control (`checkAuth.js`) to protect your library.

### 📱 Mobile Integration
* **Dedicated APK:** Features a companion Android application (`ElitePlus.apk`) for high-performance mobile streaming.
* **Automated Updates:** Integrated version tracking system (`appversion.txt`) that monitors and prompts for new updates and features.

### 🛠️ Backend Power
* **RESTful API:** A robust Python/Flask backend that serves as the "brain," managing data flow between the web client and the database.
* **Streamlined Content Delivery:** Optimized to serve high-resolution media metadata and streaming links with minimal latency.

---

## 🚀 System Architecture

The ecosystem operates on a client-server model designed for scalability and data integrity.



1.  **Backend (Flask):** Handles requests, authentication, and database interactions.
2.  **Frontend (Web):** Provides a rich, interactive UI for desktop users to browse and watch content.
3.  **Android Client:** Consumes the API to provide a native mobile experience.

---

## 🛠️ Getting Started

### Prerequisites
* Python 3.9+
* Android 8.0+ (for mobile app)
* Modern Web Browser
