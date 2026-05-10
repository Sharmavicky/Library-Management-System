import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api"  
});

// attach token to every request automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})

// handle token expiry globally
API.interceptors.response.use(
    (response) => response, async(error) => {
        const original = error.config;

        // check if response is form "auth" route
        const isAuthRoute = original.url?.includes("/auth/");
        if (isAuthRoute) {
            return Promise.reject(error); // just reject don't refresh 
        }

        // if 401 and not already retired than try refresh
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");

                if (!refreshToken) {
                    localStorage.clear();
                    window.location.href = "/login";
                    return Promise.reject(error);
                }
                
                const { data } = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/refresh`,{ refreshToken });

                // save new token
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);

                // retry original request with new token
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return API(original);
            } catch  {
                // refresh failed, redirect user to login page
                localStorage.clear();
                window.location.href = "/login";
            }

        }
        return Promise.reject(error);
    }
);

export default API;