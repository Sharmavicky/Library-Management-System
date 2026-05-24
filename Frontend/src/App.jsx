import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";

{/* protected routing files */}
import { AdminRoute, ProtectedRoute } from "./Components/ProtectedRoute";
import AdminRequests from "./pages/admin/AdminRequests";

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
import MemberFines from "./pages/member/MemberFines";
import MemberHistory from "./pages/member/MemberHistory";
import MemberCatalog from "./pages/member/MemberCatalog";

{/* page 404 Not found */}
import NotFoundPage from "./pages/NotFoundPage";
import BookReader from "./pages/member/BookReader";

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
                <Route path="/admin/requests" element={ <AdminRoute><AdminRequests /></AdminRoute>} />

                {/* protected member route */}
                <Route path="/member/dashboard" element={ <ProtectedRoute><MemberDashboard /></ProtectedRoute> }/>
                <Route path="/member/catalog" element={ <ProtectedRoute><MemberCatalog /></ProtectedRoute>}/>
                <Route path="/member/fines" element={ <ProtectedRoute><MemberFines /></ProtectedRoute>} />
                <Route path="/member/history" element={ <ProtectedRoute><MemberHistory /></ProtectedRoute>} />
                <Route path="/member/issues/read/:issueId" element={ <ProtectedRoute><BookReader /></ProtectedRoute>} />
                
                {/* catch-all route for 404 Not Found */}
                <Route path="*" element={ <NotFoundPage /> } />
            </Routes>
        </BrowserRouter>
    )
}