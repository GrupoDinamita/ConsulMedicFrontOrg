import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'aos/dist/aos.css';
import './App.css';

import NavigationBar from './components/Navbar/Navbar';
import DashboardNavbar from './components/Navbar/DashboardNavbar';
import Hero from './components/Hero/Hero';
import WritingSection from './components/WritingSection/WritingSection';
import DemoSection from './components/DemoSection/DemoSection';
import WhyChooseUs from './components/WhyChooseUs/WhyChooseUs';
import FAQ from './components/FAQ/FAQ';
import Footer from './components/Footer/Footer';
import Pricing from './pages/Pricing/Pricing';
import Contact from './pages/Contact/Contact';
import About from './pages/About/About';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import ProtectedRoute from './pages/ProtectedRoute';
import Profile from './pages/UserProfile/Profile';
import Consultations from './pages/Consultations/Consultations';
import { AuthProvider } from './context/AuthContext';
import EditProfile from "./pages/EditProfile/EditProfile";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import ProfileSettings from "./pages/ProfileSettings/ProfileSettings";
import Plan from "./pages/Plan/Plan";

const AppRoutes = () => {
    const location = useLocation();
    const [isDashboardPath, setIsDashboardPath] = useState(false);

    useEffect(() => {
        const dashboardPaths = ['/dashboard', '/consultations', '/profile', '/plan'];
        setIsDashboardPath(dashboardPaths.some(path => location.pathname.startsWith(path)));
    }, [location]);

    const isHome = location.pathname === '/'; // ← NUEVO

    return (
        <div className="App">
            {/* ← Pasamos la prop para que el Navbar sea transparente en el home */}
            {isDashboardPath ? <DashboardNavbar /> : <NavigationBar transparentOnTop={isHome} />}

            {/* ← Quitamos margen superior solo en home para que el hero quede “debajo” del navbar */}
            <div className={`main-content ${isHome ? 'no-top' : ''}`}>
                <Routes>
                    <Route path="/" element={
                        <>
                            <Hero />
                            <WritingSection />
                            <DemoSection />
                            <WhyChooseUs />
                            <FAQ />
                        </>
                    } />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/consultations" element={<Consultations />} />
                        <Route path="/profile/edit" element={<EditProfile />} />
                        <Route path="/profile/change-password" element={<ChangePassword />} />
                        <Route path="/profile/settings" element={<ProfileSettings />} />
                        <Route path="/plan" element={<Plan />} />
                    </Route>
                </Routes>
            </div>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
