import API from "../api/axios";

export const loginUser = async (email , password) => {
    const { data } = await API.post("/auth/login", { email, password });
    return data;
}

export const registerUser = async (username, email, password) => {
    const { data } = await API.post("/auth/register", { username, email, password });
    return data;
}

export const logout = async () => {
    const { data } = await API.post("/auth/logout");
    return data;
}