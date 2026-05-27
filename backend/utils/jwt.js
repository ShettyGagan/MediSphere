import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId) => {
    return jwt.sign({ id: userId }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN || "7d", });
};

export const verifyToken =(token)=>{
    return jwt.verify(token,ENV.JWT_SECRET);
};