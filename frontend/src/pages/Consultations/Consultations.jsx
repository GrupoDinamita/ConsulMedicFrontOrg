import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Spinner, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Consultations.css';

const API_BASE = import.meta.env.VITE_API_URL; // <- Vite env

const Consultations = () => {
  const [consults, setConsults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('fechaCreacion');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  
const fetchConsults = async () => {
    try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
        navigate('/login');
        return;
        }

        const res = await fetch(`${API_BASE}/consults`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Error al cargar las consultas');

        const data = await res.json();
        setConsults(data);
    } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las consultas');
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    fetchConsults();
    }, []);


  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDetails = async (consultaId) => {
  try {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const url = `${API_BASE}/consults/${consultaId}/details`;
    console.log('[details] GET', url, 'id=', consultaId, 'token=', token.slice(0,12) + '...');

    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = await res.text();
    if (!res.ok) {
      console.error(`[details] status=${res.status} body=`, raw);
      if (res.status === 401) {
        setError('Sesión expirada. Inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      if (res.status === 404) {
        setError('Consulta no encontrada (o no te pertenece).');
        return;
      }
      throw new Error(`Error ${res.status}: ${raw}`);
    }

    let data = {};
    try { data = JSON.parse(raw); } catch { data = {}; }

    setSelected({
        id: consultaId,
        nombre: data.nombre,
        fechaCreacion: data.fechaCreacion,
        transcription: data.transcription,
        summary: data.summary,
    });

    setShowModal(true);
  } catch (err) {
    console.error('Error detalles:', err);
    setError('Error al cargar los detalles de la consulta');
  } finally {
    setLoading(false);
  }
};


  const handleCloseModal = () => {
    setShowModal(false);
    setSelected(null);
  };


  const handleDelete = async (consultaId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta consulta? Esta acción no se puede deshacer.')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/consults/${consultaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al eliminar la consulta');

      setConsults((prev) => prev.filter((c) => c.id !== consultaId));
      if (selected?.id === consultaId) handleCloseModal();
    } catch (err) {
      console.error('Error:', err);
      setError('Error al eliminar la consulta');
    }
  };

  // Ordenar
  const sorted = [...consults].sort((a, b) => {
    if (sortField === 'fechaCreacion') {
      return sortDirection === 'asc'
        ? new Date(a.fechaCreacion) - new Date(b.fechaCreacion)
        : new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
    } else if (sortField === 'nombre') {
      return sortDirection === 'asc'
        ? a.nombre.localeCompare(b.nombre)
        : b.nombre.localeCompare(a.nombre);
    }
    return 0;
  });

  // Filtrar
  const filtered = sorted.filter((c) =>
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginate = (n) => setCurrentPage(n);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (loading && consults.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <div className="consultations-page">
      <Container>
        <h1 className="mb-4">Mis Consultas Médicas</h1>
        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </InputGroup>
              </Col>
              <Col md={6} className="text-md-end mt-3 mt-md-0">
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Consulta
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            {current.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-file-earmark-text display-1 text-muted"></i>
                <h3 className="mt-3">No hay consultas</h3>
                <p className="text-muted">Comience a grabar su primera consulta médica desde el Dashboard</p>
                <Button variant="primary" onClick={() => navigate('/dashboard')} className="mt-3">
                  Ir al Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="consultations-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('nombre')} className="sortable-header">
                          Nombre
                          {sortField === 'nombre' && (
                            <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                          )}
                        </th>
                        <th onClick={() => handleSort('fechaCreacion')} className="sortable-header">
                          Fecha
                          {sortField === 'fechaCreacion' && (
                            <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                          )}
                        </th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {current.map((c) => (
                        <tr key={c.id}>
                          <td>{c.nombre}</td>
                          <td>{formatDate(c.fechaCreacion)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewDetails(c.id)}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleDownloadPDF(c.id)}
                            >
                              <i className="bi bi-file-earmark-pdf"></i>
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c.id)}>
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination-container mt-4">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                          Anterior
                        </button>
                      </li>
                      {[...Array(totalPages).keys()].map((n) => (
                        <li key={n + 1} className={`page-item ${currentPage === n + 1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => paginate(n + 1)}>
                            {n + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                          Siguiente
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal de detalles */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        {selected ? (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selected.nombre}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-4">
                <h5>Información</h5>
                <p>
                  <strong>Fecha:</strong> {formatDate(selected.fechaCreacion)}
                </p>
              </div>

              <div className="mb-4">
                <h5>Transcripción</h5>
                <div className="transcription-content">
                  {selected.transcription || 'No hay transcripción disponible'}
                </div>
              </div>

              <div>
                <h5>Resumen</h5>
                <div className="summary-content">
                  {selected.summary || 'No hay resumen disponible'}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-success" onClick={() => handleDownloadPDF(selected.id)}>
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Descargar PDF
              </Button>
              <Button variant="secondary" onClick={handleCloseModal}>
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
    </div>
  );
};

export default Consultations;
