import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Redirección post-login: vuelve a la ruta previa (si existe) o al dashboard
    const redirectPath = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const result = await login(email, password);

            if (result.success) {
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 100);
            } else {
                setError(result.error || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
        }
    };

    return (
        <div className="auth-page">
            <Container>
                <div className="auth-content">
                    <Card className="auth-card">
                        <Card.Body>
                            <h2 className="text-center mb-4">Iniciar Sesión</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 mb-3">
                                    Iniciar Sesión
                                </Button>

                                <div className="text-center">
                                    <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                                </div>
                            </Form>
                        </Card.Body>
                        <Card.Footer className="text-center">
                            ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
                        </Card.Footer>
                    </Card>
                </div>
            </Container>
        </div>
    );
};

export default Login;
