import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  CallControls,
  ParticipantView,
  useCallStateHooks,
  hasVideo,
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
  // Mobile tab: 'video' | 'chat'
  const [activeTab, setActiveTab] = useState('video');

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
        activeVideoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { id: user._id, name: user.name, image: user.profileImage },
          token: tokenRes.data.token,
        });
        activeCall = activeVideoClient.call('default', consultRes.data.callId);
        await activeCall.join({ create: true });

        // Auto-enable camera and mic on join
        try {
          await activeCall.camera.enable();
          await activeCall.microphone.enable();
        } catch (mediaErr) {
          console.warn('Could not automatically enable camera/mic:', mediaErr);
        }

        // Chat client 
        // Setting a 15-second timeout 
        activeChatClient = StreamChat.getInstance(apiKey, { timeout: 15000 });
        if (activeChatClient.userID !== tokenRes.data.userId) {
          await activeChatClient.connectUser(
            { id: tokenRes.data.userId, name: tokenRes.data.userName, image: tokenRes.data.userImage },
            tokenRes.data.token
          );
        }

        // Use the chatChannelId from backend 
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
        if (activeCall) { try { await activeCall.leave(); } catch (e) { } }
        if (activeVideoClient) { try { await activeVideoClient.disconnectUser(); } catch (e) { } }
        if (activeChatClient) { try { await activeChatClient.disconnectUser(); } catch (e) { } }
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
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-gray-900/95 border-b border-white/10 shrink-0 z-20 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="bg-brand-500 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-brand-500/20 shrink-0">
            <Video className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-sm sm:text-base leading-tight truncate">Live Consultation</h2>
            <div className="hidden sm:flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Encrypted & Secure</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user.role === 'DOCTOR' && (
            <>
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="px-2 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm active:scale-95"
              >
                <PlusSquare size={15} />
                <span className="hidden sm:inline">Add Prescription</span>
              </button>
              <button
                onClick={handleEndConsultation}
                disabled={ending}
                className="px-2 sm:px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm active:scale-95"
              >
                {ending ? <Loader2 size={15} className="animate-spin" /> : <PhoneOff size={15} />}
                <span className="hidden sm:inline">End Consultation</span>
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/dashboard/appointments')}
            className="p-2 sm:p-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/30 hover:border-transparent group"
          >
            <XCircle size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* Body: Video + Chat  */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Video Panel — full on desktop; shown on mobile only when activeTab==='video' */}
        <div className={`flex-1 flex flex-col bg-gray-950 overflow-hidden relative
          ${activeTab === 'video' ? 'flex' : 'hidden md:flex'}`}>
          {videoClient && call ? (
            <StreamVideo client={videoClient}>
              <StreamCall call={call}>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-hidden">
                    <MyVideoLayout />
                  </div>
                  {/* Floating controls */}
                  <div className="flex justify-center py-3 sm:py-4 shrink-0 bg-gradient-to-t from-gray-950/90 to-transparent">
                    <div className="bg-white/10 backdrop-blur-2xl px-4 sm:px-6 py-2 sm:py-3 rounded-[2rem] border border-white/10 shadow-2xl">
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
        <div className={`
          md:w-72 xl:w-80 md:shrink-0 border-l border-white/10 flex flex-col bg-gray-900
          ${activeTab === 'chat' ? 'flex flex-1' : 'hidden md:flex'}
        `}>
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
          <div className="flex-1 min-h-0 overflow-hidden">
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

      {/*  Mobile Tab Bar */}
      <div className="md:hidden flex shrink-0 border-t border-white/10 bg-gray-900">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors
            ${activeTab === 'video' ? 'text-brand-400 border-t-2 border-brand-400' : 'text-white/40'}`}
        >
          <Video size={18} />
          Video
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors
            ${activeTab === 'chat' ? 'text-indigo-400 border-t-2 border-indigo-400' : 'text-white/40'}`}
        >
          <MessageSquare size={18} />
          Chat
        </button>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <PrescriptionFormModal onClose={() => setShowPrescriptionModal(false)} appointmentId={id} />
      )}
    </div>
  );
}

/* Video Layout  */
const MyVideoLayout = () => {
  const { useParticipants } = useCallStateHooks();
  const allParticipants = useParticipants();

  const participants = allParticipants.reduce((acc, cur) => {
    if (!acc.find(p => p.userId === cur.userId)) acc.push(cur);
    return acc;
  }, []);

  const local = participants.find(p => p.isLocalParticipant);
  const remote = participants.find(p => !p.isLocalParticipant);

  /* Solo / waiting screen  */
  if (!remote) {
    return (
      <div className="relative h-full w-full bg-gray-950 overflow-hidden">
        {local && (
          <div className="absolute inset-0">
            <ParticipantView participant={local} />
            {!hasVideo(local) && (
              <div className="absolute inset-0 bg-gray-950 flex items-center justify-center z-10">
                <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                  <UserIcon size={56} className="text-gray-600" />
                </div>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/55 backdrop-blur-sm">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-5 border border-white/20">
            <Loader2 size={40} className="text-white animate-[spin_3s_linear_infinite]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Waiting for the other party…</h3>
          <p className="text-white/50 text-sm">The secure channel is ready.</p>
          {local && (
            <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-30">
              <p className="text-white font-semibold text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {local.name || 'You'} (You)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /*  remote fullscreen, local PiP bottom-right  */
  return (
    <div className="relative h-full w-full bg-black overflow-hidden">

      {/* Remote  */}
      <div className="absolute inset-0">
        <ParticipantView participant={remote} />
        {!hasVideo(remote) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
            <div className="w-36 h-36 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
              <UserIcon size={64} className="text-gray-600" />
            </div>
            <p className="mt-5 text-white/30 font-bold text-xs uppercase tracking-widest">Camera Off</p>
          </div>
        )}
        {/* Remote name */}
        <div className="absolute bottom-5 left-5 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
          <p className="text-white font-semibold text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {remote.name || 'Guest'}
          </p>
        </div>
      </div>

      {/* Local — PiP tile, bottom-right */}
      {local && (
        <div className="absolute bottom-5 right-5 z-30 w-44 h-28 sm:w-56 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl shadow-black/70 bg-gray-900">
          <ParticipantView participant={local} />
          {!hasVideo(local) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <UserIcon size={28} className="text-gray-600" />
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 z-20">
            <p className="text-white/80 font-semibold text-[10px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {local.name || 'You'} (You)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


/*  Prescription Modal */
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
