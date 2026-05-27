import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  CallControls,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Loader2, Video, XCircle, PlusSquare, Plus, Save, MessageSquare, PhoneOff,
} from 'lucide-react';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [ending, setEnding] = useState(false);

  const handleEndConsultation = async () => {
    if (!window.confirm('End this consultation? The appointment will be marked as completed.')) return;
    setEnding(true);
    try {
      await api.post(`/consultation/end/${id}`);
      navigate('/dashboard/appointments');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end consultation.');
      setEnding(false);
    }
  };

  useEffect(() => {
    let activeCall = null;
    let activeVideoClient = null;
    let activeChatClient = null;

    const init = async () => {
      try {
        const [consultRes, tokenRes] = await Promise.all([
          api.get(`/consultation/join/${id}`),
          api.get('/chat/token'),
        ]);

        // Video client
        activeVideoClient = new StreamVideoClient({
          apiKey,
          user: { id: user._id, name: user.name, image: user.profileImage },
          token: tokenRes.data.token,
        });
        activeCall = activeVideoClient.call('default', consultRes.data.callId);
        await activeCall.join({ create: true });

        // Chat client — connect to the server-created channel (avoids 403)
        activeChatClient = StreamChat.getInstance(apiKey);
        if (activeChatClient.userID !== tokenRes.data.userId) {
          await activeChatClient.connectUser(
            { id: tokenRes.data.userId, name: tokenRes.data.userName, image: tokenRes.data.userImage },
            tokenRes.data.token
          );
        }

        // Use the chatChannelId returned by the backend (channel was pre-created server-side)
        const ch = activeChatClient.channel('messaging', consultRes.data.chatChannelId);
        await ch.watch();


        setVideoClient(activeVideoClient);
        setCall(activeCall);
        setChatClient(activeChatClient);
        setChannel(ch);
      } catch (err) {
        console.error('Consultation join failed:', err);
        alert('Could not join the consultation. Please try again.');
        navigate('/dashboard/appointments');
      } finally {
        setLoading(false);
      }
    };

    if (id) init();

    return () => {
      const cleanup = async () => {
        if (activeCall) { try { await activeCall.leave(); } catch (e) {} }
        if (activeVideoClient) { try { await activeVideoClient.disconnectUser(); } catch (e) {} }
        if (activeChatClient) { try { await activeChatClient.disconnectUser(); } catch (e) {} }
      };
      cleanup();
    };
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="text-center space-y-4">
        <Loader2 className="w-14 h-14 animate-spin text-brand-500 mx-auto" />
        <p className="text-white font-bold text-lg tracking-widest uppercase">Initializing Secure Session…</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden fixed inset-0 z-[100]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900/95 border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-brand-500 p-2 rounded-xl shadow-lg shadow-brand-500/20">
            <Video className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">Live Consultation</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Encrypted & Secure</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'DOCTOR' && (
            <>
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm active:scale-95"
              >
                <PlusSquare size={15} /> Add Prescription
              </button>
              <button
                onClick={handleEndConsultation}
                disabled={ending}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 text-sm active:scale-95"
              >
                {ending ? <Loader2 size={15} className="animate-spin" /> : <PhoneOff size={15} />}
                End Consultation
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/dashboard/appointments')}
            className="p-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/30 hover:border-transparent group"
          >
            <XCircle size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* ── Main: Video (left) + Chat (right) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Panel */}
        <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden relative">
          {videoClient && call ? (
            <StreamVideo client={videoClient}>
              <StreamCall call={call}>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-hidden">
                    <MyVideoLayout />
                  </div>
                  {/* Floating controls */}
                  <div className="flex justify-center py-4 shrink-0 bg-gradient-to-t from-gray-950/90 to-transparent">
                    <div className="bg-white/10 backdrop-blur-2xl px-6 py-3 rounded-[2rem] border border-white/10 shadow-2xl">
                      <CallControls onLeave={() => navigate('/dashboard/appointments')} />
                    </div>
                  </div>
                </div>
              </StreamCall>
            </StreamVideo>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-72 xl:w-80 border-l border-white/10 flex flex-col bg-gray-900 shrink-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <MessageSquare size={15} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Consultation Chat</p>
              <p className="text-white/40 text-[10px] font-semibold">Live messaging</p>
            </div>
          </div>

          {/* Stream Chat */}
          <div className="flex-1 overflow-hidden">
            {chatClient && channel ? (
              <Chat client={chatClient} theme="messaging dark">
                <Channel channel={channel}>
                  <Window>
                    <MessageList />
                    <MessageInput focus />
                  </Window>
                </Channel>
              </Chat>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <PrescriptionFormModal onClose={() => setShowPrescriptionModal(false)} appointmentId={id} />
      )}
    </div>
  );
}

/* ── Video Layout ── */
const MyVideoLayout = () => {
  const { useParticipants } = useCallStateHooks();
  const allParticipants = useParticipants();

  const participants = allParticipants.reduce((acc, cur) => {
    if (!acc.find(p => p.userId === cur.userId)) acc.push(cur);
    return acc;
  }, []);

  return (
    <div className="h-full p-4 pb-2">
      <div className={`grid gap-4 h-full ${participants.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {participants.map((p) => (
          <div key={p.sessionId} className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl">
            <ParticipantView participant={p} />
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-20">
              <p className="text-white font-bold text-xs flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${p.isLocalParticipant ? 'bg-brand-500' : 'bg-indigo-400'}`} />
                {p.name || 'Anonymous'} {p.isLocalParticipant && '(You)'}
              </p>
            </div>
            {!p.videoStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border border-white/5">
                  <UserIcon size={48} className="text-gray-600" />
                </div>
                <p className="mt-4 text-white/30 font-bold text-[10px] uppercase tracking-widest">Camera Off</p>
              </div>
            )}
          </div>
        ))}

        {participants.length === 1 && (
          <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl bg-gray-900/40 border-2 border-dashed border-white/10 p-8 text-center">
            <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-brand-500 animate-[spin_3s_linear_infinite]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Waiting for other party</h3>
            <p className="text-white/30 text-sm font-medium">Secure channel is ready</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Prescription Modal ── */
const PrescriptionFormModal = ({ onClose, appointmentId }) => {
  const [formData, setFormData] = useState({
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', duration: '', instructions: '' }],
  });
  const [loading, setLoading] = useState(false);

  const addMedicine = () =>
    setFormData({ ...formData, medicines: [...formData.medicines, { name: '', dosage: '', duration: '', instructions: '' }] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/prescriptions/appointment/${appointmentId}`, formData);
      alert('Prescription created successfully');
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
        <header className="p-6 bg-indigo-600 text-white flex items-center justify-between">
          <h3 className="text-2xl font-bold">New Prescription</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <XIcon size={20} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Clinical Diagnosis</label>
            <textarea
              className="input-field min-h-[100px] py-4"
              placeholder="Describe your findings…"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Medications</label>
              <button type="button" onClick={addMedicine} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1 bg-indigo-50 rounded-lg">
                <Plus size={13} strokeWidth={3} /> Add Line
              </button>
            </div>
            {formData.medicines.map((med, i) => (
              <div key={i} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl grid grid-cols-2 gap-3">
                <input className="input-field col-span-2 text-sm bg-white" placeholder="Medicine Name" value={med.name}
                  onChange={(e) => { const m = [...formData.medicines]; m[i].name = e.target.value; setFormData({ ...formData, medicines: m }); }} required />
                <input className="input-field text-xs bg-white h-10" placeholder="Dosage (e.g. 1-0-1)" value={med.dosage}
                  onChange={(e) => { const m = [...formData.medicines]; m[i].dosage = e.target.value; setFormData({ ...formData, medicines: m }); }} />
                <input className="input-field text-xs bg-white h-10" placeholder="Duration (e.g. 5 days)" value={med.duration}
                  onChange={(e) => { const m = [...formData.medicines]; m[i].duration = e.target.value; setFormData({ ...formData, medicines: m }); }} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Patient Notes</label>
            <textarea className="input-field min-h-[80px] text-sm" placeholder="Dietary advice, follow-up instructions…"
              value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </form>
        <footer className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="btn-secondary py-3 px-8 font-bold">Discard</button>
          <button disabled={loading} onClick={handleSubmit}
            className="btn-primary py-3 px-10 font-bold bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700 flex items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={16} /> Finalize</>}
          </button>
        </footer>
      </div>
    </div>
  );
};

function UserIcon({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function XIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
