import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import API_BASE from '../../apiConfig';

const ChangePassword = () => {
    const [userData, setUserData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updating, setUpdating] = useState(false);

    const isSecurePassword = (password) => {
        const securePattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        return securePattern.test(password);
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!isSecurePassword(userData.newPassword)) {
            setError('La nueva contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un símbolo.');
            return;
        }

        if (userData.newPassword !== userData.confirmPassword) {
            setError('La nueva contraseña y su confirmación no coinciden.');
            return;
        }

        setUpdating(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No se encontró la sesión del usuario');
                setError('No se encontró la sesión del usuario')
            }

            const response = await fetch(`${API_BASE}/user/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: userData.currentPassword,
                    newPassword: userData.newPassword
                })
            });

            if (response.ok) {
                setSuccess('Contraseña actualizada correctamente');
                setUserData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                const text = await response.text().catch(() => '');
                console.error('Error al actualizar contraseña (API):', text || response.status);
                setError(text || 'Error al actualizar la contraseña');
            }
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            setError(error.message || 'Error al actualizar la contraseña');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Container className="py-4">
            <Card>
                <Card.Header>
                    <h3>Cambiar Contraseña</h3>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handlePasswordUpdate}>
                        <Form.Group className="mb-3">
                            <Form.Label>Contraseña Actual</Form.Label>
                            <Form.Control
                                type="password"
                                value={userData.currentPassword}
                                onChange={(e) => setUserData({ ...userData, currentPassword: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nueva Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                value={userData.newPassword}
                                onChange={(e) => setUserData({ ...userData, newPassword: e.target.value })}
                                required
                            />
                            <Form.Text className="text-muted">
                                Mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                value={userData.confirmPassword}
                                onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={updating}>
                            {updating ? <Spinner animation="border" size="sm" /> : 'Cambiar Contraseña'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ChangePassword;
