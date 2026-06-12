import { ENV } from "./env.js";


const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.IS_PROD,           // true in production (HTTPS), false in dev (HTTP)
  sameSite: ENV.IS_PROD ? "none" : "lax",  // "none" requires secure=true
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, COOKIE_OPTIONS);
};

export const clearAuthCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
  });
};