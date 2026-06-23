# 🎟️ Smart Queue APK

A token-based digital queue management system with an Android APK client and a Node.js backend. Eliminates physical waiting lines by letting users generate queue tokens, track their position in real time, and get notified when it's their turn.

---

## ✨ Features

- **Token Generation** — users receive a digital token upon joining a queue
- **Real-Time Queue Tracking** — live position updates so users can wait freely
- **Admin / Counter Dashboard** — staff can call, skip, or close tokens from a web interface
- **Android APK Client** — mobile app for end-users to join queues and track status
- **RESTful Backend API** — Node.js/Express server handling queue state and token logic

---

## 🏗️ Architecture

```
Android APK (Client)
       │
       ▼
Node.js / Express (REST API)
       │
       ▼
  In-Memory / DB Queue Store
```

---

## 🛠️ Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | Node.js, Express.js     |
| Mobile   | Android (APK)           |
| API      | REST (JSON)             |
| Runtime  | Node.js                 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/vikash1311/Smart_queue_apk.git
cd Smart_queue_apk/backend

# Install dependencies
npm install

# Start the server
npm start
```

The API server runs at `http://localhost:3000` by default.

### Android APK

Install the APK on your Android device:
1. Download the `.apk` file from the repo
2. Enable "Install from unknown sources" on your device
3. Open and install the APK
4. Point the app to your backend URL

---

## 📡 API Endpoints

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | `/queue/join`    | Join a queue, get token  |
| GET    | `/queue/status`  | Get current queue status |
| POST   | `/queue/next`    | Admin: serve next token  |
| DELETE | `/queue/:token`  | Cancel / remove a token  |

---

## 📁 Project Structure

```
Smart_queue_apk/
├── backend/          # Node.js Express API server
│   ├── routes/       # API route handlers
│   ├── controllers/  # Business logic
│   └── index.js      # Entry point
└── README.md
```

---

## 🔮 Roadmap

- [ ] Firebase Realtime Database integration for live sync
- [ ] Push notifications when token is about to be called
- [ ] Multi-counter support
- [ ] Web dashboard for queue administrators
- [ ] QR-code-based token check-in

---

## 👨‍💻 Author

**Vikash Gautam**
[GitHub](https://github.com/vikash1311) · [LinkedIn](https://linkedin.com/in/vikash2808) · [Portfolio](https://vikash-gautam.netlify.app)

---

## 📄 License

MIT
