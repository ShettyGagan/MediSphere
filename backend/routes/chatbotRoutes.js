import express from 'express';
import { getChatbotResponse } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/chat', getChatbotResponse);

export default router;
