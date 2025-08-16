import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../apiConfig';


const Plan = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [usage, setUsage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError('');

                // Perfil + uso en paralelo
                const [meRes, usageRes] = await Promise.all([
                    fetch(`${API_BASE}/account/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal
                    }),
                    fetch(`${API_BASE}/billing/usage`, {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal
                    })
                ]);

                if (!meRes.ok) throw new Error('No fue posible obtener tu perfil.');
                const me = await meRes.json();
                const usageJson = usageRes.ok ? await usageRes.json() : null;

                setUser(me);
                setUsage(usageJson);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Ocurrió un error al cargar la información.');
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [navigate]);

    // Derivados seguros (distintas posibles formas según tu API)
    const planName = useMemo(() =>
            user?.planName || user?.plan?.name || (user?.plan === 0 ? 'Gratis' : null) || 'Gratis'
        , [user]);

    const minutesUsed = usage?.minutesUsed ?? 0;
    const minutesLimit = usage?.minutesLimit ?? (planName === 'Gratis' ? 60 : 600);
    const minutesPct = Math.min(100, Math.round((minutesUsed / Math.max(1, minutesLimit)) * 100));

    const transcriptsUsed = usage?.transcriptions ?? 0;
    const transcriptsLimit = usage?.transcriptionsLimit ?? (planName === 'Gratis' ? 20 : 500);
    const transcriptsPct = Math.min(100, Math.round((transcriptsUsed / Math.max(1, transcriptsLimit)) * 100));

    const storageUsed = usage?.storageMBUsed ?? 0;
    const storageLimit = usage?.storageMBLimit ?? (planName === 'Gratis' ? 512 : 10240);
    const storagePct = Math.min(100, Math.round((storageUsed / Math.max(1, storageLimit)) * 100));

    if (loading) {
        return (
            <>
                <Container className="py-4 d-flex justify-content-center">
                    <Spinner animation="border" role="status" />
                </Container>
            </>
        );
    }

    return (
        <>
            <Container className="py-4">
                <Row className="align-items-center mb-2">
                    <Col>
                        <h1 className="mb-0">Mi plan</h1>
                        <div className="text-muted">Estado de tu suscripción y límites de uso</div>
                    </Col>
                    <Col xs="auto">
                        <Badge bg="light" text="dark">Plan actual: {planName}</Badge>
                    </Col>
                </Row>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                <Row className="g-4">
                    {/* Consumo */}
                    <Col lg={8}>
                        <Card className="h-100">
                            <Card.Header><strong>Consumo de este mes</strong></Card.Header>
                            <Card.Body>
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Minutos de transcripción</span>
                                        <span className="text-muted">{minutesUsed} / {minutesLimit} min</span>
                                    </div>
                                    <ProgressBar now={minutesPct} label={`${minutesPct}%`} />
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Transcripciones</span>
                                        <span className="text-muted">{transcriptsUsed} / {transcriptsLimit}</span>
                                    </div>
                                    <ProgressBar now={transcriptsPct} label={`${transcriptsPct}%`} />
                                </div>

                                <div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Almacenamiento</span>
                                        <span className="text-muted">{storageUsed} / {storageLimit} MB</span>
                                    </div>
                                    <ProgressBar now={storagePct} label={`${storagePct}%`} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Info + acciones */}
                    <Col lg={4}>
                        <Card className="mb-4">
                            <Card.Header><strong>Plan actual</strong></Card.Header>
                            <Card.Body>
                                <h4 className="mb-1">{planName}</h4>
                                <div className="text-muted mb-3">
                                    {planName === 'Gratis' ? 'Funciones esenciales para comenzar.' : 'Beneficios activos de tu suscripción.'}
                                </div>
                                <ul className="mb-4">
                                    <li>Transcripción con IA</li>
                                    <li>Resúmenes automáticos</li>
                                    <li>Exportación PDF/TXT</li>
                                    {planName !== 'Gratis' && <li>Soporte prioritario</li>}
                                </ul>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" onClick={() => navigate('/billing/history')}>Historial</Button>
                                    <Button variant="primary" onClick={() => navigate('/billing')}>
                                        {planName === 'Gratis' ? 'Mejorar plan' : 'Gestionar'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Header><strong>¿Necesitas más límites?</strong></Card.Header>
                            <Card.Body>
                                <p className="mb-3 text-muted">
                                    Pásate a un plan superior para aumentar minutos, transcripciones y espacio de almacenamiento.
                                </p>
                                <Button variant="primary" className="w-100" onClick={() => navigate('/billing')}>
                                    Ver planes disponibles
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Plan;
