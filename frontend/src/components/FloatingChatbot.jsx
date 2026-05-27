import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// ─── Markdown-lite renderer (bold, citations) ─────────────────────────────────
function renderMessage(text) {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[(\d+)\]/g, '<sup class="chatbot-cite">[$1]</sup>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

export default function FloatingChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hi! I'm HealthConnect's medical assistant. Ask me anything about medications — uses, side effects, interactions, or pricing.",
    },
  ]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Guard: only patients see the chatbot
  if (!user || user.role?.toLowerCase() !== 'patient') return null;

  const handleOpen = () => {
    setOpen(true);
    setPulse(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/chat', { question, patientId: user._id });
      const { answer, citations, blocked } = res.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: answer,
          citations: !blocked && citations?.length ? citations : null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '⚠️ Sorry, something went wrong. Please try again.', error: true },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── FAB Launcher ─────────────────────────────────────── */}
      <button
        id="chatbot-launcher"
        onClick={open ? () => setOpen(false) : handleOpen}
        className={`chatbot-fab${pulse && !open ? ' chatbot-fab-pulse' : ''}`}
        aria-label="Open medical assistant"
        title="Medical Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="12" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
            </svg>
            <span className="chatbot-fab-label">Medical Assistant</span>
          </>
        )}
      </button>

      {/* ── Chat Panel ───────────────────────────────────────── */}
      <div
        id="chatbot-panel"
        className={`chatbot-panel${open ? ' chatbot-panel-open' : ''}`}
        role="dialog"
        aria-label="Medical chatbot"
      >
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h3 className="chatbot-header-title">Medical Assistant</h3>
            <p className="chatbot-header-sub">Powered by AI · Medicine RAG</p>
          </div>
          <button onClick={() => setOpen(false)} className="chatbot-close-btn" aria-label="Close chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages" id="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-msg-row${msg.role === 'user' ? ' chatbot-msg-row-user' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="chatbot-avatar">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              )}
              <div className={`chatbot-bubble${msg.role === 'user' ? ' chatbot-bubble-user' : msg.error ? ' chatbot-bubble-error' : ' chatbot-bubble-bot'}`}>
                <p className="chatbot-bubble-text" dangerouslySetInnerHTML={{ __html: renderMessage(msg.text) }} />
                {msg.citations && (
                  <div className="chatbot-citations">
                    {msg.citations.map((c) => (
                      <span key={c.index} className="chatbot-citation-tag">[{c.index}] {c.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chatbot-msg-row">
              <div className="chatbot-avatar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-area">
          <textarea
            ref={inputRef}
            id="chatbot-input"
            className="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any medicine..."
            rows={1}
            disabled={loading}
          />
          <button
            id="chatbot-send"
            className="chatbot-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="chatbot-disclaimer">⚕️ Not a substitute for professional medical advice.</p>
      </div>
    </>
  );
}
