import { ragQuery } from '../chatbot/query.js';

export const getChatbotResponse = async (req, res) => {
    const { question, patientId } = req.body;

    if (!question) return res.status(400).json({ message: "Question is required" });

    try {

        const result = await ragQuery(question, patientId);
        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong. Please try again." })
    }
}