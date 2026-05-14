import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";

{/* public routing files */}
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

{/* admin routing files */}
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBooks from "./pages/admin/AdminBooks";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminIssuances from "./pages/admin/AdminIssuances";
import AdminFines from "./pages/admin/AdminFines";

{/* member routing files */}
import MemberDashboard from "./pages/member/MemberDashboard";
import BrowseCatalog from "./Components/BrowseCatalog";

{/* page 404 Not found */}
import NotFoundPage from "./pages/NotFoundPage";

{/* protected routing files */}
import { AdminRoute, ProtectedRoute } from "./Components/ProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* public routes */}
                <Route path="/" element={ <Landing /> } />
                <Route path="/login" element={ <Login /> } />
                <Route path="/register" element={ <Register /> } />

                {/* protected admin route */}
                <Route path="/admin/dashboard" element={ <AdminRoute><AdminDashboard /></AdminRoute>}/>
                <Route path="/admin/users" element={ <AdminRoute><AdminMembers /></AdminRoute> } />
                <Route path="/admin/books" element={ <AdminRoute><AdminBooks /></AdminRoute> } />
                <Route path="/admin/issuances" element={ <AdminRoute><AdminIssuances /></AdminRoute>} />
                <Route path="/admin/fines" element={ <AdminRoute><AdminFines /></AdminRoute>} />

                {/* protected member route */}
                <Route path="/dashboard" element={ <ProtectedRoute><MemberDashboard /></ProtectedRoute> }/>
                <Route path="/dashboard/catalog" element={ <ProtectedRoute><BrowseCatalog /></ProtectedRoute>}/>
                
                {/* catch-all route for 404 Not Found */}
                <Route path="*" element={ <NotFoundPage /> } />
            </Routes>
        </BrowserRouter>
    )
}