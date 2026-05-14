import API from "../api/axios";

export const loginUser =  (email , password) => API.post("/auth/login", { email, password }).then(r => r.data);

export const registerUser =  (username, email, password) => API.post("/auth/register", { username, email, password }).then(r => r.data);

export const logoutUser = () => API.post("/auth/logout");