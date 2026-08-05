<div align="center">
  <img src="frontend/public/logo.png" alt="Arthur Logo" width="130" />
  <br />
  <img src="frontend/public/arthur-wordmark.png" alt="Arthur Branding" width="220" />
  
  <p align="center">
    <strong>A high-performance, passwordless, real-time chat application built for privacy, speed, and seamless communication.</strong>
  </p>

  <p align="center">
    <strong>Created & Developed by <a href="https://github.com/atulyapandey">Atulya</a></strong> 👑
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Author-Atulya-007ACC?style=for-the-badge&logo=github&logoColor=white" alt="Author" />
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

---

## 🌟 Key Features

### 💬 **Real-Time Communication Engine**
- **Low-Latency Messaging**: Bi-directional real-time chat powered by **Socket.IO** with under 10ms message delivery.
- **Live Typing Indicators**: Pulsing blue `typing...` indicators active in both chat headers and the sidebar friend list.
- **Read Receipts**: Real-time double-check marks (`✓✓ Seen`) when a recipient views your message.
- **Unsend Messages**: Delete sent messages for everyone in real-time.
- **Emoji Reactions**: React to any message with top quick emojis (❤️, 👍, 😂, 🔥, 😮).

### 📁 **File & Media Sharing**
- **Document Attachments**: Share PDFs, ZIP archives, code snippets, or documents up to 10MB with instant download buttons.
- **Photo Attachments & Lightbox**: Send high-resolution images with thumbnail previews and full-screen image lightbox modal.

### 📌 **Pin Messages & Search History**
- **Pin Important Messages**: Pin any message (your own or your friend's) to the top of the chat window.
- **Direct Message Tracing**: Click any pinned message in the top banner to smoothly scroll directly to that message with a glowing golden border ring.
- **Expandable Pinned Panel**: View all pinned messages with full text, **Jump to** buttons, and individual unpin controls.
- **In-Chat Search Bar**: Filter chat history live by keyword.

### 📩 **Unread Counter Badges**
- **Database & Socket Synced Badges**: Displays unread message badges (*`1 new msg`*, *`2 new msgs`*, *`5+ new msgs`*) on the sidebar friend items, pre-calculated from MongoDB on load and updated live via WebSockets.
- **Auto-Clear**: Clicking a friend's chat room automatically clears the unread badge.

### 🔒 **Passwordless & Guest Authentication**
- **6-Digit Email OTP**: Passwordless sign-in via Nodemailer with Gmail SMTP integration.
- **Instant Guest Mode**: Try Arthur immediately as a guest without creating an account.

### 👑 **Super Admin Command Center**
- **Dedicated Admin Portal**: Accessible via `/admin` or the floating shield icon with secret passkey protection.
- **Live System Analytics**: Real-time metrics for total users, online count, total messages, and pending reports.
- **User Management**: Ban, unban, or permanently delete user accounts with 1 click.
- **Friendship Graph Linker**: Inspect who is friends with whom, break friendships, or forcefully link user A & B.
- **Abuse Reports Oversight**: Review user reports submitted for spam or harassment.

### 👤 **Custom Profile & Avatar Settings**
- **Custom Display Name**: Edit your display name anytime with MongoDB persistence.
- **Preset & Custom Avatars**: Choose from 6 curated DiceBear avatar presets or upload custom photos (base64).

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework**: React.js (Create React App)
- **Styling**: Tailwind CSS (Dark Glassmorphism UI)
- **Icons**: Lucide React
- **WebSockets**: Socket.io-client
- **HTTP Client**: Axios

### **Backend**
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Real-Time Engine**: Socket.IO (Multi-socket Set per user)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Email Service**: Nodemailer (Gmail SMTP)

---

## 📁 Project Structure

```
Chat-Web2.0/
├── frontend/                  # React Single Page Application
│   ├── public/                # Static assets (logo.png, arthur-wordmark.png)
│   ├── src/
│   │   ├── components/
│   │   │   ├── accounts/      # AuthModal, OtpVerify
│   │   │   ├── admin/         # AdminDashboard
│   │   │   └── chat/          # Sidebar, ChatArea, ProfileModal, ReportModal
│   │   ├── contexts/          # AuthContext
│   │   └── services/          # API, SocketService, AuthService
│   ├── vercel.json            # SPA Client Routing Rewrites
│   └── package.json
│
└── server/                    # Node.js Express & Socket.IO Server
    ├── config/                # mongo.js, mailconfig.js
    ├── controllers/           # authcontroller, user, chatmssg, adminController
    ├── middlewares/           # verifytoken, rateLimiter
    ├── models/                # user, chatroom, chatmssg, Report, otp
    ├── routes/                # auth, user, chatmssg, admin
    ├── index.js               # Entry Point & Socket.IO Event Handler
    └── package.json
```

---

## ⚙️ Quick Start & Local Setup

### **Prerequisites**
- Node.js (`v18+` or `v22+`)
- MongoDB (Local instance or MongoDB Atlas URI)

### **1. Clone Repository**
```bash
git clone https://github.com/atulyapandey/Arthur-Chat-App.git
cd Arthur-Chat-App
```

### **2. Setup & Run Server**
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```env
PORT=8080
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_super_secret_jwt_key

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_digit_app_password
SMTP_FROM="Arthur Verification <your_gmail_address@gmail.com>"

# Admin Credentials
ADMIN_SECRET=your_admin_secret_passkey
ADMIN_EMAIL=your_admin_email@gmail.com
```

Start the backend server:
```bash
npm run dev
```

### **3. Setup & Run Frontend**
```bash
cd ../frontend
npm install
npm start
```

Open `http://localhost:3000` in your browser!

---

## 🚀 Production Deployment

### **Deploy Backend to Render (`render.com`)**
1. Create a new **Web Service** on Render connected to your repository.
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node index.js`
5. Add all Environment Variables from your `.env` file.

### **Deploy Frontend to Vercel (`vercel.com`)**
1. Create a new project on Vercel connected to your repository.
2. Set **Root Directory**: `frontend`
3. Add Environment Variables:
   - `REACT_APP_API_URL` ➔ `https://your-backend.onrender.com/api`
   - `REACT_APP_SOCKET_URL` ➔ `https://your-backend.onrender.com`
4. Deploy!

---

## 👤 Author & Credits

Designed, Architected, and Developed with ❤️ by **[Atulya](https://github.com/atulyapandey)**.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built for real-time personalized messaging by <strong>Atulya</strong>.</sub>
</div>
