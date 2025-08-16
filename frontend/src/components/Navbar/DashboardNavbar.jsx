import React from 'react';
import { Navbar, Container, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HeartIcon,
    GaugeIcon,
    NotebookIcon,
    UserCircleIcon,
    GearSixIcon,
    SignOutIcon
} from '@phosphor-icons/react';
import './Navbar.css';
import './DashboardNavbar.css';

const DashboardNavbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const planName = currentUser?.planName || currentUser?.plan || 'Gratis';
    const displayName = currentUser?.nombre || 'Usuario';

    return (
        <Navbar bg="primary" variant="dark" expand="lg" className="dashboard-navbar">
            <Container>
                {/* Brand visible en móvil (en desktop uso el grid interno) */}
                <Navbar.Brand as={Link} to="/dashboard" className="navitem-icon d-lg-none">
                    <HeartIcon size={22} weight="fill" />
                    <span className="brand-text">ConsulMedic</span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="navbar-nav" />
                <Navbar.Collapse id="navbar-nav" className="w-100">
                    {/* Grid de 3 columnas en desktop para simetría perfecta */}
                    <div className="navbar-grid w-100">
                        {/* Izquierda: Brand (solo desktop) */}
                        <div className="grid-brand d-none d-lg-flex navitem-icon">
                            <HeartIcon size={22} weight="fill" />
                            <span className="brand-text">ConsulMedic</span>
                        </div>

                        {/* Centro: 3 botones centrados */}
                        <Nav className="grid-center align-items-center">
                            <Nav.Link as={Link} to="/dashboard" className="navitem-icon nav-typo">
                                <GaugeIcon size={20} />
                                <span>Dashboard</span>
                            </Nav.Link>
                            <Nav.Link as={Link} to="/consultations" className="navitem-icon nav-typo">
                                <NotebookIcon size={20} />
                                <span>Mis Consultas</span>
                            </Nav.Link>
                            <Nav.Link as={Link} to="/plan" className="navitem-icon nav-typo">
                                <span>Mi plan</span>
                                <Badge bg="light" text="dark" className="ms-2">{planName}</Badge>
                            </Nav.Link>
                        </Nav>

                        {/* Derecha: usuario */}
                        <Nav className="grid-right align-items-center">
                            {currentUser && (
                                <NavDropdown
                                    align="end"
                                    id="user-dropdown"
                                    title={
                                        <span className="navitem-icon nav-typo">
                      <UserCircleIcon size={20} />
                      <span>{displayName}</span>
                    </span>
                                    }
                                >
                                    <NavDropdown.Item as={Link} to="/profile" className="navitem-icon">
                                        <GearSixIcon size={18} />
                                        <span>Configuración</span>
                                    </NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout} className="navitem-icon">
                                        <SignOutIcon size={18} />
                                        <span>Cerrar sesión</span>
                                    </NavDropdown.Item>
                                </NavDropdown>
                            )}
                        </Nav>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default DashboardNavbar;