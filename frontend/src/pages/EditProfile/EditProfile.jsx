import React, { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import API_BASE from "../../apiConfig";

const EditProfile = () => {
    const [userData, setUserData] = useState({ nombre: '', especialidad: '' });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/user/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData({
                        nombre: data.nombre || '',
                        especialidad: data.especialidad || ''
                    });
                } else {
                    setError('No se pudo cargar la información del usuario.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar los datos.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setUpdating(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/user/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                setSuccess('Perfil actualizado correctamente');
            } else {
                const text = await response.text();
                console.error('Error al actualizar los datos.');
                setError(text || 'Error al actualizar el perfil');
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            setError(error.message || 'Error al actualizar el perfil');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Card>
                <Card.Header>
                    <h3>Actualizar Perfil</h3>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleProfileUpdate}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre Completo</Form.Label>
                            <Form.Control
                                type="text"
                                value={userData.nombre}
                                onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Especialidad Médica</Form.Label>
                            <Form.Control
                                type="text"
                                value={userData.especialidad}
                                onChange={(e) => setUserData({ ...userData, especialidad: e.target.value })}
                                placeholder="Ej: Medicina General"
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={updating}>
                            {updating ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EditProfile;
