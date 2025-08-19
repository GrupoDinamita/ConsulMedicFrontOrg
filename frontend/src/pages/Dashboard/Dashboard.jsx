import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import {
    MicrophoneIcon, CpuIcon, UploadSimpleIcon, ClockCounterClockwiseIcon, FolderIcon, FolderPlusIcon, PencilIcon,
    TrashIcon
} from '@phosphor-icons/react';
import API_BASE from '../../apiConfig';

const Dashboard = () => {
    const navigate = useNavigate();
    const [consultaId, setConsultaId] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recordings, setRecordings] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [summary, setSummary] = useState('');
    const [processingAudio, setProcessingAudio] = useState(false);
    const [recordingName, setRecordingName] = useState('');
    const [lastResultSource, setLastResultSource] = useState(null);
    const [processingSource, setProcessingSource] = useState(null);

    const [folders, setFolders] = useState([
        { id: 'inbox', name: 'General' },
        { id: 'reports', name: 'Informes' }
    ]);
    const [selectedFolder, setSelectedFolder] = useState('inbox');

    const fileInputRef = useRef(null);

    async function waitForFinalize(consultaId, baseFileName, name, maxMinutes = 3) {
        const token = localStorage.getItem('token');
        const deadline = Date.now() + maxMinutes * 60 * 1000;

        while (Date.now() < deadline) {
            const res = await fetch(`${API_BASE}/consults/finalize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    consultaId,
                    baseFileName,
                    name: name || ''
                }),
            });

            if (res.status === 202) {
                await new Promise((r) => setTimeout(r, 4000));
                continue;
            }

            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`Finalize error ${res.status}: ${txt}`);
            }

            return await res.json();
        }

        throw new Error('Timeout esperando el procesamiento.');
    }

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const profileRes = await fetch(`${API_BASE}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!profileRes.ok) {
                    console.error('Perfil: respuesta no OK',profileRes.status);
                    setError('Error al cargar datos del usuario')
                    return;
                }
                setUserData(await profileRes.json());

                const recRes = await fetch(`${API_BASE}/consults`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (recRes.ok) setRecordings(await recRes.json());
            } catch (err) {
                console.error(err);
                setError('Error al cargar los datos del usuario');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    // 🔒 Validación: exigir nombre antes de abrir el file picker
    const handleClickUpload = () => {
        if (!recordingName.trim()) {
            setError('Primero ingresa un nombre para la consulta.');
            return;
        }
        setError('');
        fileInputRef.current?.click();
    };

    const processUploadedFile = async (file) => {
        // Validación: exigir nombre también si el archivo llega por otra vía
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

            let cid = consultaId;
            if (!cid) {
                const createRes = await fetch(`${API_BASE}/consults`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ nombre: recordingName || '' }),
                });
                if (!createRes.ok) {
                    console.error('No se pudo crear la consulta', createRes.status);
                    setError('Mo se pudo crear la consulta');
                    return;
                    }

                const created = await createRes.json();
                cid = created.id ?? created.Id;
                if (!cid) {
                    console.error('La respuesta de creación no devolvió id.',created);
                    setError('La respuesta de creación no devolvió id.');
                    return;
                }
                setConsultaId(cid);
            }

            const formData = new FormData();
            formData.append('audioFile', file);

            const uploadResponse = await fetch(`${API_BASE}/consults/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errTxt = await uploadResponse.text().catch(() => '');
                console.error('Error al subir el archivo',uploadResponse.status, errTxt);
                setError(errTxt || 'Error al subir el archivo')
                return;
            }

            const uploadData = await uploadResponse.json();

            const baseFileName =
                uploadData.baseFileName ??
                decodeURIComponent(String(uploadData.uri || '').split('/').pop() || '');

            if (!baseFileName) {
                console.error('No se pudo obtener el nombre del archivo subido.',uploadData);
                setError('No se pudo obtener el nombre del archivo subido');
                return;
            }

            const fin = await waitForFinalize(cid, baseFileName, recordingName);

            const detailsRes = await fetch(`${API_BASE}/consults/${fin.id}/details`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (detailsRes.ok) {
                const details = await detailsRes.json();
                setTranscription(details.transcription || '');
                setSummary(details.summary || 'No se pudo obtener el resumen.');
            } else {
                setSummary('No se pudo obtener el resumen.');
            }
            const listRes = await fetch(`${API_BASE}/consults`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (listRes.ok) setRecordings(await listRes.json());

            setLastResultSource('upload');
            setRecordingName('');
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al procesar el archivo. Intenta nuevamente.');
        } finally {
            setProcessingAudio(false);
            setProcessingSource(null);
        }
    };

    const handleUploadFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processUploadedFile(file);
        e.target.value = ''; // permitir re-subir el mismo archivo
    };

    const handleStartRecording = async () => {
        // Validación: exigir nombre antes de pedir permiso al micrófono
        if (!recordingName.trim()) {
            setError('Primero ingresa un nombre para la consulta.');
            return;
        }

        try {
            setLastResultSource('mic');
            setProcessingSource('mic');
            setTranscription('');
            setSummary('');
            setError(''); // limpia el error si todo ok

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
            console.error('Error al iniciar la grabación:', err);
            setError('No se pudo acceder al micrófono');
        }
    };

    const handleStopRecording = () => {
        const mr = mediaRecorderRef.current;
        if (mr && isRecording) {
            mr.stop();
            mr.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
        }
    };

    // nombre sugerido tras grabar
    useEffect(() => {
        if (audioBlob && !recordingName) {
            const d = new Date();
            const stamp = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            setRecordingName(`Consulta ${stamp}`);
        }
    }, [audioBlob, recordingName]);

    const handleProcessAudio = async () => {
        if (!audioBlob) { setError('Por favor grabe audio'); return; }

        setProcessingSource('mic');
        setProcessingAudio(true);
        setError('');
        setTranscription('');
        setSummary('');

        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            let cid = consultaId;
            if (!cid) {
                const createRes = await fetch(`${API_BASE}/consults`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ nombre: recordingName || '' })
                });
                if (!createRes.ok) {
                    console.error('No se pudo crear la consulta', createRes.status);
                    setError('No se pudo obtener la consulta');
                    return;
                }
                const created = await createRes.json(); // { id, nombre }
                cid = created.id;
                setConsultaId(cid);
            }

            const formData = new FormData();
            formData.append('audioFile', audioBlob);

            const uploadResponse = await fetch(`${API_BASE}/consults/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadResponse.ok) {
                console.error('Error al subir el audio',uploadResponse.status,);
                setError('Error al subir el audio');
                return;
            }

            const uploadData = await uploadResponse.json();
            const baseFileName =
                uploadData.baseFileName ??
                decodeURIComponent(String(uploadData.uri || '').split('/').pop());
            if (!baseFileName) {
                console.error('No se pudo obtener el nombre del archivo subido.',uploadData);
                setError('No se pudo obtener el nombre del archivo subido.');
                return;
            }

            const fin = await waitForFinalize(cid, baseFileName, recordingName); // { id, nombre, status }

            const detailsRes = await fetch(`${API_BASE}/consults/${fin.id}/details`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (detailsRes.ok) {
                const details = await detailsRes.json();
                setTranscription(details.transcription || '');
                setSummary(details.summary || 'No se pudo obtener el resumen.');
            } else {
                setSummary('No se pudo obtener el resumen.');
            }

            const listRes = await fetch(`${API_BASE}/consults`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (listRes.ok) setRecordings(await listRes.json());

            // Reset UI si quieres empezar una nueva consulta
            setAudioBlob(null);
            setRecordingName('');
            setConsultaId(null);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al procesar el audio. Intenta nuevamente.');
        } finally {
            setProcessingAudio(false);
            setProcessingSource(null);
        }
    };

    const handleViewRecording = async (recordingId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/consults/${recordingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                console.error('No se pudo obtener la grabación',response.status);
                setError('No se pudo obtener la grabación');
                return;
            }
            const data = await response.json();
            setTranscription(data.transcription || '');
            setSummary(data.summary || '');
        } catch (err) {
            console.error(err);
            setError('Error al cargar la grabación');
        }
    };

    const startMicFlow = () => {
        if (isRecording) handleStopRecording();
        setTranscription('');
        setSummary('');
        setAudioBlob(null);
        setProcessingAudio(false);
        setRecordingName('');
        setLastResultSource('mic');
    };

    const handleAddFolder = () => {
        const name = prompt('Nombre de la carpeta:');
        if (!name) return;
        const id = `${Date.now()}`;
        setFolders(prev => [...prev, { id, name }]);
        setSelectedFolder(id);
    };
    const handleRenameFolder = (id) => {
        const name = prompt('Nuevo nombre:');
        if (!name) return;
        setFolders(prev => prev.map(f => f.id === id ? ({ ...f, name }) : f));
    };
    const handleDeleteFolder = (id) => {
        if (!confirm('¿Eliminar carpeta?')) return;
        setFolders(prev => prev.filter(f => f.id !== id));
        if (selectedFolder === id) setSelectedFolder('inbox');
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    const showEmptyState =
        !transcription &&
        !summary &&
        recordings.length === 0 &&
        !audioBlob &&
        !isRecording &&
        !processingAudio &&
        !lastResultSource;

    const planName = userData?.planName || userData?.plan || userData?.subscription?.plan ;

    return (
        <div className="dashboard-shell">
            {}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h6>Carpetas</h6>
                    <Button variant="link" className="p-0" onClick={handleAddFolder} title="Nueva carpeta">
                        <FolderPlusIcon size={18} />
                    </Button>
                </div>

                <div className="folder-list">
                    {folders.map(f => (
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
                                <Button variant="link" className="p-0 me-2" onClick={(e)=>{e.stopPropagation();handleRenameFolder(f.id);}} title="Renombrar">
                                    <PencilIcon size={16} />
                                </Button>
                                <Button variant="link" className="p-0" onClick={(e)=>{e.stopPropagation();handleDeleteFolder(f.id);}} title="Eliminar">
                                    <TrashIcon size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sidebar-section mt-4">
                    <h6>Recientes</h6>
                    <div className="recent-list">
                        {recordings.slice(0,5).map(r => (
                            <button
                                key={r._id}
                                className="recent-item"
                                onClick={() => handleViewRecording(r._id)}
                                title={r.name}
                            >
                                <ClockCounterClockwiseIcon size={16} />
                                <span className="text-truncate">{r.name}</span>
                            </button>
                        ))}
                        {recordings.length === 0 && <small className="text-muted">Sin registros</small>}
                    </div>
                </div>
            </aside>

            {}
            <main className="main">
                <div className="main-header">
                    <h1>Dashboard</h1>
                    <div className="ms-auto badge bg-secondary">{planName}</div>
                </div>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                {}
                <div className="quick-actions">
                    <button className="action-card action-upload theme-turquoise-deep" onClick={handleClickUpload} disabled={processingAudio}>
                        <UploadSimpleIcon size={22} />
                        <span>{processingAudio ? 'Procesando…' : 'Subir archivo'}</span>
                        <input ref={fileInputRef} onChange={handleUploadFileChange} type="file" accept="audio/*,video/*,.wav,.mp3,.m4a,.webm" hidden />
                    </button>

                    <button className="action-card action-mic  theme-turquoise-deep" onClick={startMicFlow} disabled={processingAudio} title="Grabar consulta (micrófono)">
                        <MicrophoneIcon size={22} />
                        <span>Grabar consulta (micrófono)</span>
                    </button>
                </div>


                {}
                {showEmptyState && (
                    <div className="empty-state">
                        <div className="empty-icon">↑</div>
                        <h4>Agrega tu primera consulta</h4>
                        <p>Sube un archivo o graba audio. Crearemos transcripciones y resúmenes para ti.</p>
                        <Button variant="primary" onClick={handleClickUpload} disabled={processingAudio}>
                            Explorar opciones
                        </Button>
                    </div>
                )}

                {}
                {!showEmptyState && (
                    <>
                        {lastResultSource === 'upload' ? (
                            <Card className="mb-4">
                                <Card.Header><h3>Consulta procesada</h3></Card.Header>
                                <Card.Body>
                                    {processingSource === 'upload' && processingAudio && (
                                        <Alert variant="info" className="mb-3 d-flex align-items-center">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Analizando archivo subido… Esto puede tardar unos minutos.
                                        </Alert>
                                    )}

                                    <Form.Group className="mb-2">
                                        <Form.Label>Nombre de la consulta</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={recordingName}
                                            onChange={(e) => setRecordingName(e.target.value)}
                                            placeholder="Ej: Consulta Paciente Juan Pérez"
                                            required
                                        />
                                    </Form.Group>
                                    <small className="text-muted">
                                        Para grabar una nueva consulta, usa “Grabar consulta (micrófono)” en Acciones rápidas.
                                    </small>
                                </Card.Body>
                            </Card>
                        ) : (
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

                                    <div className="recording-controls mb-4">
                                        {processingSource === 'upload' && processingAudio ? (
                                            <Alert variant="info" className="mb-0 d-flex align-items-center">
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Analizando archivo subido… Esto puede tardar unos minutos.
                                            </Alert>
                                        ) : (
                                            <>
                                                {!isRecording ? (
                                                    <button className="btn btn-primary" onClick={handleStartRecording} disabled={processingAudio}>
                                                        <span className="me-2"><MicrophoneIcon /></span>
                                                        Iniciar grabación
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-danger" onClick={handleStopRecording}>
                                                        Detener grabación
                                                    </button>
                                                )}

                                                {audioBlob && !isRecording && (
                                                    <button
                                                        className="btn btn-success ms-3"
                                                        onClick={handleProcessAudio}
                                                        disabled={processingAudio || !recordingName}
                                                    >
                                                        {processingAudio ? (
                                                            <>
                                                                <Spinner animation="border" size="sm" className="me-2" />
                                                                Procesando…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="me-2"><CpuIcon /></span>
                                                                Procesar audio
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
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
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;