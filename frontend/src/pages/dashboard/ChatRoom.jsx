import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, MessageSquare, Search, ArrowLeft } from 'lucide-react';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

export default function ChatRoom() {
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState('list');

  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await api.get('/chat/token');
        const chatClient = StreamChat.getInstance(apiKey);

        await chatClient.connectUser(
          {
            id: res.data.userId,
            name: res.data.userName,
            image: res.data.userImage,
          },
          res.data.token
        );

        setClient(chatClient);
      } catch (err) {
        console.error('Chat initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (client) client.disconnectUser();
    };
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-20">
      <h3 className="text-xl font-bold text-surface-900">Chat server unavailable</h3>
      <p className="text-surface-500">Please try again later or contact support.</p>
    </div>
  );

  const filters = { members: { $in: [user._id] } };
  const sort = { last_message_at: -1 };

  return (
    <div className="h-[calc(100vh-160px)] card-premium overflow-hidden bg-white/50 backdrop-blur border-surface-200">
      <Chat client={client} theme="messaging light">
        <div className="flex h-full divide-x divide-surface-100">


          {/* On mobile: full-width when mobileView==='list', hidden otherwise */}

          <div className={`
            flex flex-col
            md:w-80 md:shrink-0 md:block
            ${mobileView === 'list' ? 'flex w-full' : 'hidden md:flex'}
          `}>
            <div className="p-4 border-b border-surface-100 bg-surface-50/50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  className="input-field pl-9 py-2 text-xs h-9 bg-white w-full"
                  placeholder="Search conversations..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChannelList
                filters={filters}
                sort={sort}
                Preview={(props) => (
                  <div
                    {...props}
                    onClick={(e) => {
                      props.setActiveChannel?.(props.channel, e);
                      setMobileView('channel');
                    }}
                    className={`p-4 hover:bg-surface-50 cursor-pointer border-b border-surface-50 transition-colors flex items-center gap-3 ${props.active ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface-200 overflow-hidden shrink-0">
                      {props.displayImage && <img src={props.displayImage} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-surface-900 text-sm truncate">{props.displayTitle}</p>
                      <p className="text-xs text-surface-400 truncate">{props.latestMessage || 'No messages yet'}</p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* ── Chat Window ── */}
          {/* On mobile: full-width when mobileView==='channel', hidden otherwise */}

          <div className={`
            flex flex-col min-w-0 flex-1
            ${mobileView === 'channel' ? 'flex' : 'hidden md:flex'}
          `}>
            {/* Mobile back button */}
            <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-surface-100 bg-surface-50/50 shrink-0">
              <button
                onClick={() => setMobileView('list')}
                className="flex items-center gap-1.5 text-brand-600 font-semibold text-sm"
              >
                <ArrowLeft size={16} />
                All Chats
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <Channel>
                <Window>
                  <ChannelHeader
                    Title={(props) => (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-900 flex items-center justify-center text-white shrink-0">
                          <MessageSquare size={18} />
                        </div>
                        <h4 className="font-bold text-surface-900 truncate">{props.title}</h4>
                      </div>
                    )}
                  />
                  <MessageList />
                  <MessageInput focus />
                </Window>
                <Thread />
              </Channel>
            </div>
          </div>

        </div>
      </Chat>
    </div>
  );
}
