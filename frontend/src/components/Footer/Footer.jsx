import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FacebookLogoIcon, TwitterLogoIcon, LinkedinLogoIcon, InstagramLogoIcon, YoutubeLogoIcon }
    from '@phosphor-icons/react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <Container>
                <Row className="main-footer">
                    <Col lg={4} className="about-section">
                        <h5>ConsulMedic</h5>
                        <p>
                            Como empresa tecnológica innovadora, nos centramos en ofrecer
                            soluciones de inteligencia artificial para profesionales médicos.
                            Ayudamos a nuestros clientes a mejorar la eficiencia en sus consultas
                            con servicios de transcripción automática y gestión de datos médicos.
                        </p>
                        <div className="social-links">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <FacebookLogoIcon size={24} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <TwitterLogoIcon size={24} />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                                <LinkedinLogoIcon size={24} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <InstagramLogoIcon size={24} />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                                <YoutubeLogoIcon size={24} />
                            </a>
                        </div>
                    </Col>

                    <Col lg={2} md={4} className="footer-links">
                        <h5>GENERAL</h5>
                        <ul>
                            <li><Link to="/about">¿Por qué ConsulMedic?</Link></li>
                            <li><Link to="/demo">Demo</Link></li>
                            <li><Link to="/mobile">App Móvil</Link></li>
                            <li><Link to="/pricing">Planes & Precios</Link></li>
                            <li><Link to="/discounts">Descuentos</Link></li>
                            <li><Link to="/package">Encuentra tu Plan</Link></li>
                            <li><Link to="/faq">FAQ</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                        </ul>
                    </Col>

                    <Col lg={3} md={4} className="footer-links">
                        <h5>CAMPO DE APLICACIÓN</h5>
                        <ul>
                            <li><Link to="/individual">Médicos Independientes</Link></li>
                            <li><Link to="/clinics">Clínicas</Link></li>
                            <li><Link to="/hospitals">Hospitales</Link></li>
                            <li><Link to="/specialists">Especialistas</Link></li>
                            <li><Link to="/accessibility">Accesibilidad Digital</Link></li>
                        </ul>
                    </Col>

                    <Col lg={3} md={4} className="footer-links">
                        <h5>CONTACTO</h5>
                        <ul>
                            <li><Link to="/support">Asistencia Técnica</Link></li>
                            <li><Link to="/sales">Contactar Ventas</Link></li>
                            <li><Link to="/legal">Legal</Link></li>
                            <li><Link to="/media">Medios de Comunicación</Link></li>
                            <li><Link to="/admin">Administración Pública</Link></li>
                        </ul>
                    </Col>
                </Row>

                <div className="footer-bottom">
                    <Row>
                        <Col md={6}>
                            <p>© 2025 ConsulMedic. Todos los derechos reservados</p>
                        </Col>
                        <Col md={6}>
                            <div className="legal-links">
                                <Link to="/terms">Términos y condiciones</Link>
                                <Link to="/privacy">Política de Privacidad</Link>
                                <Link to="/conditions">Condiciones de uso</Link>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;