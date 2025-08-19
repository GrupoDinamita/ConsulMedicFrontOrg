import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './Auth.css';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar si el token es válido
        const verifyToken = async () => {
            try {
                // Aquí irá la llamada a tu API para verificar el token
                // Por ejemplo:
                // await api.verifyResetToken(token);

                // Simulamos una verificación
                await new Promise(resolve => setTimeout(resolve, 500));
                setIsValid(true);
            } catch (err) {
                setError('El enlace de recuperación no es válido o ha expirado.');
                setIsValid(false);
            }
        };

        verifyToken().catch((error) => console.error(error));
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validatePassword = (password) => {
        // Mínimo 8 caracteres, al menos una letra mayúscula, una minúscula y un número
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!validatePassword(formData.password)) {
            setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        try {
            // Aquí irá la llamada a tu API para cambiar la contraseña
            // Por ejemplo:
            // await api.resetPassword(token, formData.password);

            // Simulamos una llamada a la API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError('No se pudo restablecer la contraseña. Por favor, intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isValid && error) {
        return (
            <div className="auth-page">
                <Container>
                    <div className="auth-content">
                        <Card className="auth-card">
                            <Card.Body className="text-center">
                                <Alert variant="danger">{error}</Alert>
                                <Link to="/forgot-password" className="btn btn-primary">
                                    Solicitar nuevo enlace
                                </Link>
                            </Card.Body>
                        </Card>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <Container>
                <div className="auth-content">
                    <Card className="auth-card">
                        <Card.Body>
                            <h2 className="text-center mb-4">Restablecer Contraseña</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {isSuccess ? (
                                <Alert variant="success">
                                    Tu contraseña ha sido restablecida exitosamente.
                                    Serás redirigido al inicio de sesión en unos segundos...
                                </Alert>
                            ) : (
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nueva contraseña</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            minLength={8}
                                        />
                                        <Form.Text className="text-muted">
                                            La contraseña debe tener al menos 8 caracteres, una mayúscula,
                                            una minúscula y un número.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Confirmar nueva contraseña</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            minLength={8}
                                        />
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Procesando...' : 'Restablecer Contraseña'}
                                    </Button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </Container>
        </div>
    );
};

export default ResetPassword;