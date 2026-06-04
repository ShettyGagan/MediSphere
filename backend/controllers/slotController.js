import Slot from "../models/Slot.js";

const addMinutes = (t, mins) => {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

// Save selected time slots for a given date (skips duplicates)
export const setSlots = async (req, res) => {
  try {
    const doctor_id = req.user._id;
    const { date, times } = req.body;

    if (!date || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({ message: "date and times[] required" });
    }

    const docs = times.map((start_time) => ({
      doctor_id,
      date,
      start_time,
      end_time: addMinutes(start_time, 15),
    }));

    // ordered: false so duplicate-key errors don't stop the whole batch
    await Slot.insertMany(docs, { ordered: false }).catch((err) => {
      if (err.code !== 11000) console.error("InsertMany Error:", err);
    });

    const slots = await Slot.find({ doctor_id, date }).sort("start_time").lean();
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to set slots" });
  }
};

// Remove an open slot 
export const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findOne({
      _id: req.params.id,
      doctor_id: req.user._id,
    });

    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if (slot.is_booked) return res.status(400).json({ message: "Cannot delete a booked slot" });

    await slot.deleteOne();
    res.json({ message: "Slot removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all slots for the doctor 
export const getMySlots = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { doctor_id: req.user._id };
    if (date) query.date = date;

    const slots = await Slot.find(query).sort("date start_time").lean();
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all slots for a doctor on a date 
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date)
      return res.status(400).json({ message: "doctorId and date required" });

    const slots = await Slot.find({ doctor_id: doctorId, date })
      .sort("start_time")
      .lean();

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
