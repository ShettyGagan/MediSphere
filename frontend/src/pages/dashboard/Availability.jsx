import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import {
  CalendarDays,
  Clock,
  Trash2,
  Loader2,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

// Generate 15-min slots from 07:00 to 21:00
const ALL_SLOTS = (() => {
  const slots = [];
  for (let h = 7; h < 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      );
    }
  }
  return slots;
})();

const fmt = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function Availability() {
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);        // slots from DB for current date
  const [selected, setSelected] = useState([]); // newly-toggled times (not yet saved)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);    // slot id being deleted
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/slots/my?date=${date}`);
      setSlots(res.data.slots);
    } catch {
      showToast('Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchSlots(); setSelected([]); }, [fetchSlots]);

  // Times already saved in DB for this date
  const savedTimes = new Set(slots.map((s) => s.start_time));

  const toggleSelect = (time) => {
    if (savedTimes.has(time)) return; // already in DB, can't re-add
    setSelected((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving('batch');
    try {
      await api.post('/slots/set', { date, times: selected });
      await fetchSlots();
      setSelected([]);
      showToast(`${selected.length} slot(s) added`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (slot) => {
    if (slot.is_booked) return;
    setSaving(slot._id);
    try {
      await api.delete(`/slots/${slot._id}`);
      setSlots((prev) => prev.filter((s) => s._id !== slot._id));
      showToast('Slot removed');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed');
    } finally {
      setSaving(null);
    }
  };

  // Navigate date
  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const fmtDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a3d30] flex items-center gap-3">
          <div className="bg-[#2a7d5f] p-2 rounded-xl text-white">
            <CalendarDays className="w-5 h-5" />
          </div>
          My Availability
        </h1>
        <p className="text-[#4a7a67] mt-1 text-sm">
          Select the 15-minute slots you're open for consultations. Booked slots are locked.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a3d30] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Date Navigator */}
      <div className="bg-white border border-[#c5e3d8] rounded-xl p-5 flex items-center justify-between gap-4">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-lg border border-[#c5e3d8] text-[#4a7a67] hover:bg-[#f0f7f4] transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 flex-1 justify-center">
          <CalendarDays className="w-4 h-4 text-[#2a7d5f]" />
          <span className="font-semibold text-[#1a3d30] text-[15px]">{fmtDate}</span>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="input-field text-sm w-auto py-1 px-3 ml-2 hidden sm:block"
          />
        </div>

        <button
          onClick={() => shiftDate(1)}
          className="p-2 rounded-lg border border-[#c5e3d8] text-[#4a7a67] hover:bg-[#f0f7f4] transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slot Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#2a7d5f]" />
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#4a7a67]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-[#c5e3d8] inline-block" />Available to select</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#2a7d5f] inline-block" />Selected (unsaved)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#c5e3d8] inline-block" />Saved / Open</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#b91c1c]/20 border border-[#b91c1c]/30 inline-block" />Booked</span>
          </div>

          {/* Grid of times */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {ALL_SLOTS.map((time) => {
              const saved = slots.find((s) => s.start_time === time);
              const isBooked = saved?.is_booked;
              const isSaved = !!saved && !isBooked;
              const isSelected = selected.includes(time);

              let cls =
                'relative text-center px-2 py-2.5 rounded-lg text-[11px] font-semibold border cursor-pointer select-none transition-all ';
              if (isBooked) {
                cls += 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-70';
              } else if (isSaved) {
                cls += 'bg-[#e8f5f0] border-[#c5e3d8] text-[#1a3d30]';
              } else if (isSelected) {
                cls += 'bg-[#2a7d5f] border-[#2a7d5f] text-white shadow-md shadow-[#2a7d5f]/20';
              } else {
                cls += 'bg-white border-[#c5e3d8] text-[#4a7a67] hover:border-[#2a7d5f] hover:bg-[#f0f7f4]';
              }

              return (
                <div
                  key={time}
                  className={cls}
                  onClick={() => !isBooked && toggleSelect(time)}
                  title={isBooked ? 'Booked — cannot remove' : fmt(time)}
                >
                  {fmt(time)}
                  {isBooked && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full" />
                  )}
                  {isSaved && !isBooked && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(saved); }}
                      disabled={saving === saved._id}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-[#c5e3d8] rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition"
                    >
                      {saving === saved._id
                        ? <Loader2 className="w-2 h-2 animate-spin text-[#4a7a67]" />
                        : <Trash2 className="w-2 h-2 text-[#4a7a67]" />
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save bar */}
          {selected.length > 0 && (
            <div className="sticky bottom-4 bg-white border border-[#c5e3d8] rounded-xl px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2 text-[#1a3d30]">
                <Clock className="w-4 h-4 text-[#2a7d5f]" />
                <span className="font-semibold text-sm">{selected.length} slot{selected.length > 1 ? 's' : ''} selected</span>
                <span className="text-[#4a7a67] text-xs ml-1">for {fmtDate}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected([])} className="text-sm font-medium text-[#4a7a67] hover:text-[#1a3d30] transition px-4 py-2">
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving === 'batch'}
                  className="btn-primary flex items-center gap-2 py-2 px-6 text-sm disabled:opacity-60"
                >
                  {saving === 'batch'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Plus className="w-4 h-4" /> Save slots</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Existing slots summary */}
          {slots.length > 0 && (
            <div className="bg-white border border-[#c5e3d8] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#c5e3d8]">
                <h3 className="font-semibold text-[#1a3d30] text-sm">Slots for {fmtDate}</h3>
              </div>
              <div className="divide-y divide-[#f0f7f4]">
                {slots.map((s) => (
                  <div key={s._id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#4a7a67]" />
                      <span className="text-sm font-medium text-[#1a3d30]">
                        {fmt(s.start_time)} – {fmt(s.end_time)}
                      </span>
                    </div>
                    {s.is_booked ? (
                      <span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">Booked</span>
                    ) : (
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={saving === s._id}
                        className="text-xs font-medium text-[#4a7a67] hover:text-red-500 flex items-center gap-1.5 transition"
                      >
                        {saving === s._id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />
                        }
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {slots.length === 0 && selected.length === 0 && (
            <div className="text-center py-12 border border-dashed border-[#c5e3d8] rounded-xl bg-white">
              <Info className="w-8 h-8 text-[#c5e3d8] mx-auto mb-3" />
              <p className="text-[#4a7a67] text-sm">No slots set for this day. Click the times above to add availability.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
