import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import MemberDashboard from "./pages/member/MemberDashboard";

// helper to protect route
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken");
    return token ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.role === "admin" ? children : <Navigate to="/login" />
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={ <Landing /> } />
            <Route path="/login" element={ <Login /> } />
            <Route path="/register" element={ <Register /> } />

            {/* protected admin route */}
            <Route path="/admin/dashboard" element={
                <PrivateRoute>
                <AdminRoute>
                    <AdminDashboard /> 
                </AdminRoute>
                </PrivateRoute>
            }/>

            {/* protected member route */}
            <Route path="/dashboard" element={
                <PrivateRoute>
                    <MemberDashboard />
                </PrivateRoute>
            }/>
            
            <Route path="*" element={ <NotFoundPage /> } />
        </Routes>
    )
}