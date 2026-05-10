import { create } from "zustand";

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    accessToken: localStorage.getItem("accessToken") || null,
    isAuthenticated: !!localStorage.getItem("accessToken"),

    login: (data) => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true
        })
    },

    logout: () => {
        localStorage.clear();
        set({ user: null, accessToken: null, isAuthenticated: false })
    }
}));

export default useAuthStore;