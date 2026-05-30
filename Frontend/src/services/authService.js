import API from "../api/axios";

export const loginUser =  (email , password) => API.post("/auth/login", { email, password }).then(r => r.data);

export const registerUser =  (username, email, password) => API.post("/auth/register", { username, email, password }).then(r => r.data);

export const verifyOTP = (email, otp) => API.post("/auth/verify-otp", { email, otp }).then(r => r.data);

export const resendOTP = (email) => API.post("/auth/resend-otp", { email }).then(r => r.data);

export const logoutUser = () => API.post("/auth/logout");