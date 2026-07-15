# MediSphere 🏥

A full-stack telemedicine platform connecting patients with doctors for online consultations, appointment booking, real-time video calls, and AI-powered health assistance.

## Features

- **Authentication** — Email/password and Google OAuth login with JWT sessions
- **Doctor Discovery** — Browse and filter doctors by specialty, availability, and ratings
- **Appointment Booking** — Book slots, pay via Cashfree Payment gateway, and manage appointments
- **Video Consultations** — Live video calls powered by Stream Video SDK
- **Real-time Chat** — In-consultation messaging via Stream Chat
- **Prescriptions** — Doctors can issue digital prescriptions; patients can download PDFs
- **AI Chatbot** — RAG-based health assistant using Pinecone + Groq (LLaMA) + Langfuse tracing
- **Doctor Payouts** — Wallet system with Cashfree Payouts integration for earnings withdrawal
- **Slot Management** — Doctors can set and manage their availability

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Stream Video & Chat SDK | Video calls and messaging |
| Cashfree JS | Payment UI |
| React Router v7 | Client-side routing |
| Axios | API communication |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Primary database |
| Passport.js | Google OAuth strategy |
| Groq SDK (LLaMA) | LLM inference for chatbot |
| Pinecone | Vector database for RAG |
| @xenova/transformers | Local embeddings generation |
| Cashfree| Payment processing |
| Stream SDK | Video & chat token generation |
| Langfuse | LLM observability and tracing |
| bcrypt + JWT | Password hashing and auth tokens |

## Project Structure

```
health/
├── backend/
│   ├── chatbot/          # RAG pipeline, intent classifier, drug database
│   ├── controllers/      # Request handlers (auth, appointments, consultation, etc.)
│   ├── middlewares/      # Auth middleware
│   ├── models/           # Mongoose schemas (User, Doctor, Appointment, Slot, etc.)
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic (appointment service)
│   ├── utils/            # DB connection, env config, passport setup
│   └── index.js          # App entry point
└── frontend/
    └── src/
        ├── components/   # Reusable UI components (FloatingChatbot, etc.)
        ├── context/      # React context providers
        ├── pages/        # Route-level pages
        │   ├── dashboard/  # Dashboard sub-pages (appointments, consultation, payouts, etc.)
        │   ├── Home.jsx
        │   ├── FindDoctors.jsx
        │   ├── Login.jsx
        │   └── Register.jsx
        └── lib/          # Utility functions
```

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- API keys for: Stream, Razorpay, Cashfree, Groq, Pinecone, Langfuse, Google OAuth

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key

CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_STREAM_API_KEY=your_stream_api_key
```

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Overview

| Prefix | Description |
|---|---|
| `/api/auth` | Register, login, Google OAuth |
| `/api/doctors` | Doctor listings and profiles |
| `/api/slots` | Slot creation and availability |
| `/api/appointments` | Booking, payment, cancellation |
| `/api/consultation` | Video session token generation |
| `/api/chat` | Chat token generation |
| `/api/prescriptions` | Issue and fetch prescriptions |
| `/api/chatbot` | AI health assistant queries |
| `/api/payouts` | Doctor wallet and withdrawals |
| `/health` | Server health check |

## License

MIT
