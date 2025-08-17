import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import {
    MicrophoneIcon,
    CpuIcon,
    UploadSimpleIcon,
    ClockCounterClockwiseIcon,
    FolderIcon,
    FolderPlusIcon,
    PencilIcon,
    TrashIcon,
    FilePdfIcon
} from '@phosphor-icons/react';
import API_BASE from '../../apiConfig';

const Dashboard = () => {
    const navigate = useNavigate();

    // ====== Estado general ======
    const [userData, setUserData] = useState(null);
    const [planName, setPlanName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ====== Consultas y recientes ======
    const [recordings, setRecordings] = useState([]);

    // ====== Grabación / procesamiento ======
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [processingAudio, setProcessingAudio] = useState(false);
    const [processingSource, setProcessingSource] = useState(null); // 'upload' | 'mic' | null
    const [recordingName, setRecordingName] = useState('');
    const [consultaId, setConsultaId] = useState(null);

    // ====== Resultado mostrado en el dashboard ======
    const [transcription, setTranscription] = useState('');
    const [summary, setSummary] = useState('');
    const [lastResultSource, setLastResultSource] = useState(null); // 'upload' | 'mic' | null

    // ====== Carpetas (UI) ======
    const [folders, setFolders] = useState([
        { id: 'inbox', name: 'General' },
        { id: 'reports', name: 'Informes' }
    ]);
    const [selectedFolder, setSelectedFolder] = useState('inbox');

    // ====== Quick view (Modal) ======
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState(null); // {id,nombre,fechaCreacion,transcription,summary}

    // ====== File input ref ======
    const fileInputRef = useRef(null);

    // ====== Util ======
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const opts = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', opts);
    };

    // ====== Carga inicial ======
    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                // Perfil (opcional)
                const profileRes = await fetch(`${API_BASE}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setUserData(profile);
                    if (profile?.plan) setPlanName(profile.plan);
                }

                // Consultas para “Recientes”
                const recRes = await fetch(`${API_BASE}/consults`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!recRes.ok) throw new Error('No se pudo cargar las consultas');
                const list = await recRes.json();
                setRecordings(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error(e);
                setError('Error al cargar datos iniciales');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate]);

    // ====== Finalize polling ======
    async function waitForFinalize(consultaId, baseFileName, name, maxMinutes = 4) {
        const token = localStorage.getItem('token');
        const deadline = Date.now() + maxMinutes * 60 * 1000;

        while (Date.now() < deadline) {
            const res = await fetch(`${API_BASE}/consults/finalize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ consultaId, baseFileName, name: name || '' })
            });

            if (res.status === 202) {
                await new Promise((r) => setTimeout(r, 4000));
                continue;
            }

            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(txt || 'No se pudo finalizar el resumen');
            }

            const details = await res.json().catch(() => ({}));
            return details;
        }

        throw new Error('Tiempo agotado al esperar el resumen.');
    }

    // ====== Subir archivo (desde botón) ======
    const handleClickUpload = () => {
        if (!recordingName.trim()) {
            setError('Primero ingresa un nombre para la consulta.');
            return;
        }
        setError('');
        fileInputRef.current?.click();
    };

    const processUploadedFile = async (file) => {
        if (!recordingName.trim()) {
            setError('Primero ingresa un nombre para la consulta.');
            return;
        }

        setProcessingSource('upload');
        setProcessingAudio(true);
        setError('');
        setTranscription('');
        setSummary('');

        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            // 1) Subir
            const fd = new FormData();
            fd.append('audioFile', file);
            const up = await fetch(`${API_BASE}/consults/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
            if (!up.ok) {
                const t = await up.text().catch(() => '');
                throw new Error(t || 'Error al subir el archivo');
            }
            const upData = await up.json();

            const baseFileName =
                upData.baseFileName ??
                decodeURIComponent(String(upData.uri || '').split('/').pop() || '');

            // 2) Crear consulta
            const createRes = await fetch(`${API_BASE}/consults`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: recordingName.trim(),
                    baseFileName
                })
            });
            if (!createRes.ok) {
                const t = await createRes.text().catch(() => '');
                throw new Error(t || 'No se pudo crear la consulta');
            }
            const fin = await createRes.json();
            setConsultaId(fin?.id);

            // 3) Poll finalize
            const details = await waitForFinalize(fin.id, baseFileName, recordingName);
            if (details) {
                setTranscription(details.transcription || '');
                setSummary(details.summary || 'No se pudo obtener el resumen.');
            } else {
                setSummary('No se pudo obtener el resumen.');
            }

            // 4) Refrescar recientes
            const listRes = await fetch(`${API_BASE}/consults`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (listRes.ok) setRecordings(await listRes.json());

            // Limpieza
            setAudioBlob(null);
            setRecordingName('');
            setConsultaId(null);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al procesar el archivo.');
        } finally {
            setProcessingAudio(false);
            setProcessingSource(null);
        }
    };

    // ====== Grabación mic ======
    const handleStartRecording = async () => {
        if (!recordingName.trim()) {
            setError('Primero ingresa un nombre para la consulta.');
            return;
        }

        try {
            setLastResultSource('mic');
            setProcessingSource('mic');
            setTranscription('');
            setSummary('');
            setError('');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            const chunks = [];
            mr.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
            mr.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
            };
            mr.start();
            mediaRecorderRef.current = mr;
            setIsRecording(true);
        } catch (err) {
            console.error('Mic error:', err);
            setError('No se pudo acceder al micrófono');
        }
    };

    const handleStopRecording = () => {
        try {
            mediaRecorderRef.current?.stop();
        } catch {}
        setIsRecording(false);
    };

    const handleProcessAudio = async () => {
        if (!audioBlob) {
            setError('Por favor graba audio');
            return;
        }

        setProcessingAudio(true);
        setError('');
        setTranscription('');
        setSummary('');

        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            // 1) Subir audio grabado
            const fd = new FormData();
            fd.append('audioFile', audioBlob);
            const up = await fetch(`${API_BASE}/consults/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
            if (!up.ok) throw new Error('Error al subir el audio grabado');
            const upData = await up.json();
            const baseFileName =
                upData.baseFileName ??
                decodeURIComponent(String(upData.uri || '').split('/').pop() || '');

            // 2) Crear consulta
            const createRes = await fetch(`${API_BASE}/consults`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: recordingName.trim(),
                    baseFileName
                })
            });
            if (!createRes.ok) throw new Error('Error al crear la consulta');
            const fin = await createRes.json();
            setConsultaId(fin?.id);

            // 3) Finalize (poll)
            const details = await waitForFinalize(fin.id, baseFileName, recordingName);
            if (details) {
                setTranscription(details.transcription || '');
                setSummary(details.summary || 'No se pudo obtener el resumen.');
            } else {
                setSummary('No se pudo obtener el resumen.');
            }

            // 4) Refrescar recientes
            const listRes = await fetch(`${API_BASE}/consults`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (listRes.ok) setRecordings(await listRes.json());

            // Reset
            setAudioBlob(null);
            setRecordingName('');
            setConsultaId(null);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al procesar el audio.');
        } finally {
            setProcessingAudio(false);
            setProcessingSource(null);
        }
    };

    // ====== Quick view desde Recientes ======
    const openConsultDetails = async (idLike) => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }
            const id = idLike;

            // 1) Intento /details
            let res = await fetch(`${API_BASE}/consults/${id}/details`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2) Fallback a /consults/:id
            if (!res.ok) {
                res = await fetch(`${API_BASE}/consults/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            if (!res.ok) throw new Error('No se pudo cargar los detalles');

            const data = await res.json();
            setSelectedConsult({
                id,
                nombre: data?.nombre ?? data?.name ?? '',
                fechaCreacion: data?.fechaCreacion ?? data?.createdAt ?? data?.fecha ?? null,
                transcription: data?.transcription ?? '',
                summary: data?.summary ?? ''
            });
            setDetailsOpen(true);
        } catch (err) {
            console.error('Detalles:', err);
            setError('Error al cargar los detalles de la consulta');
        }
    };

    const handleDownloadPDF = async (consultaId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            const res = await fetch(`${API_BASE}/consults/${consultaId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) { setError('Error al descargar el PDF'); return; }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const cd = res.headers.get('content-disposition');
            let filename = `consulta-${consultaId}.pdf`;
            if (cd) {
                const m = cd.match(/filename="?([^"]+)"?/);
                if (m) filename = m[1];
            }
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('PDF:', err);
            setError('Error al descargar el PDF de la consulta');
        }
    };

    // ====== Carpetas (UI) ======
    const handleAddFolder = () => {
        const name = prompt('Nombre de la carpeta:');
        if (!name) return;
        const id = `${Date.now()}`;
        setFolders((prev) => [...prev, { id, name }]);
        setSelectedFolder(id);
    };
    const handleRenameFolder = (id) => {
        const name = prompt('Nuevo nombre:');
        if (!name) return;
        setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    };
    const handleDeleteFolder = (id) => {
        if (!window.confirm('¿Eliminar carpeta?')) return;
        setFolders((prev) => prev.filter((f) => f.id !== id));
        if (selectedFolder === id) setSelectedFolder('inbox');
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    const showEmptyState = !processingAudio && !isRecording && !transcription && !summary;

    return (
        <div className="dashboard-shell">
            {/* ===== Sidebar ===== */}
            <aside className="sidebar">
                <div className="sidebar-section">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Carpetas</h6>
                        <Button size="sm" variant="link" onClick={handleAddFolder} title="Nueva carpeta">
                            <FolderPlusIcon size={16} />
                        </Button>
                    </div>

                    {folders.map((f) => (
                        <div
                            key={f.id}
                            className={`folder-item ${selectedFolder === f.id ? 'active' : ''}`}
                            onClick={() => setSelectedFolder(f.id)}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <FolderIcon size={18} />
                                <span>{f.name}</span>
                            </div>
                            <div className="folder-actions">
                                <Button
                                    variant="link"
                                    className="p-0 me-1"
                                    onClick={(e) => { e.stopPropagation(); handleRenameFolder(f.id); }}
                                    title="Renombrar"
                                >
                                    <PencilIcon size={16} />
                                </Button>
                                <Button
                                    variant="link"
                                    className="p-0"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                                    title="Eliminar"
                                >
                                    <TrashIcon size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sidebar-section mt-4">
                    <h6>Recientes</h6>
                    <div className="recent-list">
                        {recordings.slice(0, 5).map((r) => (
                            <button
                                key={r.id || r._id}
                                className="recent-item"
                                onClick={() => openConsultDetails(r.id || r._id)}
                                title={r.nombre || r.name}
                            >
                                <ClockCounterClockwiseIcon size={16} />
                                <span className="text-truncate">{r.nombre || r.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ===== Main ===== */}
            <main className="main-content">
                <div className="page-header d-flex align-items-center mb-3">
                    <h1 className="mb-0">Dashboard</h1>
                    {planName && <div className="ms-auto badge bg-secondary">{planName}</div>}
                </div>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                {/* Acciones rápidas — turquesa oscuro (restaurado) */}
                <div className="quick-actions">
                    <button
                        className="action-card action-upload theme-turquoise-deep"
                        onClick={handleClickUpload}
                        disabled={processingAudio}
                        title="Subir archivo"
                    >
                        <UploadSimpleIcon size={22} />
                        <span>{processingAudio && processingSource === 'upload' ? 'Procesando…' : 'Subir archivo'}</span>
                        <input
                            ref={fileInputRef}
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) processUploadedFile(f);
                                e.target.value = '';
                            }}
                            type="file"
                            accept="audio/*,video/*,.wav,.mp3,.m4a,.webm"
                            hidden
                        />
                    </button>

                    <button
                        className="action-card action-mic theme-turquoise-deep"
                        onClick={!isRecording ? handleStartRecording : handleStopRecording}
                        disabled={processingAudio}
                        title="Grabar consulta (micrófono)"
                    >
                        <MicrophoneIcon size={22} />
                        <span>{!isRecording ? 'Grabar consulta (micrófono)' : 'Detener'}</span>
                    </button>
                </div>

                {/* Estado vacío vs flujo de nueva consulta */}
                {showEmptyState ? (
                    <Card className="mb-4">
                        <Card.Header><h3>Nueva Consulta Médica</h3></Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre de la consulta</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={recordingName}
                                    onChange={(e) => setRecordingName(e.target.value)}
                                    placeholder="Ej: Consulta Paciente Juan Pérez"
                                    required
                                    disabled={processingSource === 'upload' && processingAudio}
                                />
                            </Form.Group>

                            <div className="recording-controls mb-2">
                                {processingSource === 'upload' && processingAudio ? (
                                    <Alert variant="info" className="mb-0 d-flex align-items-center">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Analizando archivo subido… Esto puede tardar unos minutos.
                                    </Alert>
                                ) : (
                                    <>
                                        {!isRecording ? (
                                            <button className="btn btn-primary" onClick={handleStartRecording} disabled={processingAudio || !recordingName}>
                                                <span className="me-2"><MicrophoneIcon /></span>
                                                Iniciar grabación
                                            </button>
                                        ) : (
                                            <>
                                                <button className="btn btn-danger" onClick={handleStopRecording} disabled={processingAudio}>
                                                    <span className="me-2"><MicrophoneIcon /></span>
                                                    Detener
                                                </button>
                                                {audioBlob && !processingAudio && (
                                                    <button className="btn btn-success ms-3" onClick={handleProcessAudio}>
                                                        <span className="me-2"><CpuIcon /></span>
                                                        Procesar audio
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                ) : (
                    <Card className="mb-4">
                        <Card.Header><h3>Consulta procesada</h3></Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre de la consulta</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={recordingName}
                                    onChange={(e) => setRecordingName(e.target.value)}
                                    placeholder="Ej: Consulta Paciente Juan Pérez"
                                    required
                                />
                            </Form.Group>
                            {processingSource === 'upload' && processingAudio && (
                                <Alert variant="info" className="d-flex align-items-center">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Analizando archivo subido… Esto puede tardar unos minutos.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {(transcription || summary) && (
                    <Row>
                        <Col md={12}>
                            <Card className="mb-4">
                                <Card.Header><h3>Transcripción</h3></Card.Header>
                                <Card.Body>
                                    <div className="transcription-content">
                                        {transcription || 'No hay transcripción disponible'}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={12}>
                            <Card className="mb-4">
                                <Card.Header><h3>Resumen de la consulta</h3></Card.Header>
                                <Card.Body>
                                    <div className="summary-content">
                                        {summary || 'No hay resumen disponible'}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* ===== Modal de vista rápida ===== */}
                <Modal show={detailsOpen} onHide={() => { setDetailsOpen(false); setSelectedConsult(null); }} size="lg">
                    {selectedConsult ? (
                        <>
                            <Modal.Header closeButton>
                                <Modal.Title>{selectedConsult.nombre}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="mb-4">
                                    <h5>Información</h5>
                                    <p><strong>Fecha:</strong> {formatDate(selectedConsult.fechaCreacion)}</p>
                                </div>
                                <div className="mb-4">
                                    <h5>Transcripción</h5>
                                    <div className="form-control" style={{ height: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                                        {selectedConsult.transcription || 'No hay transcripción disponible'}
                                    </div>
                                </div>
                                <div>
                                    <h5>Resumen</h5>
                                    <div className="form-control" style={{ height: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                                        {selectedConsult.summary || 'No hay resumen disponible'}
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="outline-success" onClick={() => handleDownloadPDF(selectedConsult.id)}>
                                    <FilePdfIcon className="me-2" /> Descargar PDF
                                </Button>
                                <Button variant="secondary" onClick={() => { setDetailsOpen(false); setSelectedConsult(null); }}>
                                    Cerrar
                                </Button>
                            </Modal.Footer>
                        </>
                    ) : (
                        <div className="p-5 text-center">
                            <Spinner animation="border" />
                        </div>
                    )}
                </Modal>
            </main>
        </div>
    );
};

export default Dashboard;
