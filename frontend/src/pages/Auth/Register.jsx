import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        speciality: '',
        licenseNumber: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { register } = useAuth();

    useEffect(() => {
        // Verificar si hay un mensaje desde la ubicación
        if (location.state && location.state.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        const userData = {
            nombre: formData.name,
            correo: formData.email,
            contrasenia: formData.password,
            especialidad: formData.speciality
        }

        try {
            const result = await register(userData);

            if (result.success) {
                if (result.requireLogin) {
                    // Si el registro fue exitoso pero necesitamos iniciar sesión manualmente
                    setError('');
                    navigate('/login', { state: { message: 'Registro exitoso. Por favor inicia sesión.' } });
                } else {
                    // Si el registro incluía token, vamos directamente al dashboard
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Error al registrar. Por favor, intenta nuevamente.');
            }
        } catch (err) {
            setError('Error al registrar. Por favor, intenta nuevamente.');
        }
    };

    return (
        <div className="auth-page">
            <Container>
                <div className="auth-content">
                    <Card className="auth-card">
                        <Card.Body>
                            <h2 className="text-center mb-4">Registro</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {successMessage && <Alert variant="success">{successMessage}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre completo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Especialidad médica</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="speciality"
                                        value={formData.speciality}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Confirmar contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 mb-3">
                                    Registrarse
                                </Button>
                            </Form>
                        </Card.Body>
                        <Card.Footer className="text-center">
                            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
                        </Card.Footer>
                    </Card>
                </div>
            </Container>
        </div>
    );
};

export default Register;