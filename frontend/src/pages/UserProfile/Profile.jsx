import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import API_BASE from '../../apiConfig';
import './Profile.css'; 
import { motion, AnimatePresence, animate } from "motion/react";
import { useNavigate } from 'react-router-dom';
import { HeartIcon, FileTextIcon, ClockCounterClockwiseIcon, CheckCircleIcon, UserGearIcon, LockSimpleIcon,
    GearIcon } from '@phosphor-icons/react';

// Componente para animar números
const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const controls = animate(0, value, {
            duration: 1,
            onUpdate: latest => setDisplay(Math.floor(latest))
        });
        return () => controls.stop();
    }, [value]);

    return <h4>{display}</h4>;
};

const Profile = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userData, setUserData] = useState({
        nombre: '',
        correo: '',
        especialidad: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success] = useState('');
    const [stats, setStats] = useState({
        totalConsultas: 0,
        totalTranscripciones: 0,
        tiempoAhorrado: 0
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('No se encontró la sesión del usuario');
                    setLoading(false);
                    return;
                }

                // Obtener información del usuario
                const userResponse = await fetch(`${API_BASE}/user/profile`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (userResponse.ok) {
                    const user = await userResponse.json();
                    setUserData(prev => ({
                        ...prev,
                        nombre: user.nombre || '',
                        correo: user.correo || '',
                        especialidad: user.especialidad || ''
                    }));
                }

                // Obtener estadísticas del usuario
                const statsResponse = await fetch(`${API_BASE}/user/stats`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
                setError('Error al cargar datos del usuario');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData().catch((error) => {console.error(error)});
    }, []);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <div className="profile-page">
            <Container>
                <Row className="mb-3">
                    <Col>
                        <h1>Mi Perfil</h1>
                    </Col>
                    <Col className="text-end">
                        <Button variant="outline-primary" onClick={() => setDrawerOpen(true)}>
                            <GearIcon /> Configuración
                        </Button>
                    </Col>
                </Row>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Row>
                    <Col md={6}>
                        <Card className="mb-4">
                            <Card.Header><h3>Estadísticas</h3></Card.Header>
                            <Card.Body>
                                <div className="stats-item">
                                    <div className="stats-icon"><HeartIcon /></div>
                                    <div className="stats-info">
                                        <AnimatedNumber value={stats.totalConsultas} />
                                        <p>Consultas Totales</p>
                                    </div>
                                </div>

                                <div className="stats-item">
                                    <div className="stats-icon"><FileTextIcon /></div>
                                    <div className="stats-info">
                                        <AnimatedNumber value={stats.totalTranscripciones} />
                                        <p>Transcripciones</p>
                                    </div>
                                </div>

                                <div className="stats-item">
                                    <div className="stats-icon"><ClockCounterClockwiseIcon /></div>
                                    <div className="stats-info">
                                        <AnimatedNumber value={stats.tiempoAhorrado} /> hrs
                                        <p>Tiempo Ahorrado</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card>
                            <Card.Header><h3>Plan Actual</h3></Card.Header>
                            <Card.Body>
                                <div className="plan-info">
                                    <h4>Plan Profesional</h4>
                                    <p className="text-primary fw-bold">$49.99/mes</p>
                                    <p>Renovación: 15/08/2025</p>
                                    <div className="mt-3">
                                        <h5>Características:</h5>
                                        <ul className="plan-features">
                                            <li><CheckCircleIcon weight="fill" /> Transcripciones ilimitadas</li>
                                            <li><CheckCircleIcon weight="fill" /> Resúmenes ilimitados</li>
                                            <li><CheckCircleIcon weight="fill" /> Exportación PDF/Word</li>
                                            <li><CheckCircleIcon weight="fill" /> Soporte prioritario</li>
                                        </ul>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Drawer lateral */}
                <AnimatePresence>
                    {drawerOpen && (
                        <>
                            {/* Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="drawer-overlay"
                                onClick={() => setDrawerOpen(false)}
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
                                className="drawer-panel"
                            >
                                {/* Info del usuario */}
                                <div className="drawer-user text-center mb-4">
                                    <img
                                        src="https://via.placeholder.com/80"
                                        alt="avatar"
                                        className="drawer-avatar mb-2"
                                    />
                                    <h5 className="mb-0">{userData.nombre || "Usuario"}</h5>
                                    <small className="text-muted">{userData.correo || "email@example.com"}</small>
                                </div>

                                {/* Opciones */}
                                <div className="drawer-options">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        className="drawer-option"
                                        onClick={() => { setDrawerOpen(false); navigate('/profile/edit'); }}
                                    >
                                        <UserGearIcon className="me-2" /> Actualizar Perfil
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        className="drawer-option"
                                        onClick={() => { setDrawerOpen(false); navigate('/profile/change-password'); }}
                                    >
                                        <LockSimpleIcon className="me-2" /> Cambiar Contraseña
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        className="drawer-option"
                                        onClick={() => { setDrawerOpen(false); navigate('/profile/settings');}}
                                    >
                                        <GearIcon className="me-2" /> Preferencias
                                    </motion.button>
                                </div>

                                {/* Botón cerrar */}
                                <Button
                                    variant="secondary"
                                    className="w-100 mt-4"
                                    onClick={() => setDrawerOpen(false)}
                                >
                                    Cerrar
                                </Button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </Container>
        </div>
    );
};

export default Profile;