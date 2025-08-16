import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

// ⬇️ Ajusta esta ruta a tu logo real
import logo from '../../assets/logo_transparent_trimmed.png';


const NavigationBar = ({ transparentOnTop = false }) => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [location.pathname]);

    const useTransparent = transparentOnTop && !scrolled;

    return (
        <Navbar expand="lg" fixed="top"
                className={`site-navbar ${useTransparent ? 'navbar--transparent' : 'navbar--solid'}`}>
            <Container>
                <Navbar.Brand as={Link} to="/" className="brand">
                    <img src={logo} alt="ConsulMedic" className="brand-logo" />
                    <span className="brand-text">ConsulMedic</span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="nav" />
                <Navbar.Collapse id="nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/pricing">Precios</Nav.Link>
                        <Nav.Link as={Link} to="/contact">Contacto</Nav.Link>
                        <Nav.Link as={Link} to="/about">Sobre nosotros</Nav.Link>
                    </Nav>

                    {/* ⬇️ Mismo tamaño SIEMPRE */}
                    <div className="d-flex gap-2">
                        <Button as={Link} to="/login" className="btn-auth btn-login">
                            Iniciar sesión
                        </Button>
                        <Button as={Link} to="/register" className="btn-auth btn-cta">
                            Registrarse
                        </Button>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
