import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { UsersIcon, LightningIcon, CrosshairIcon, GearIcon } from '@phosphor-icons/react';
import './WhyChooseUs.css';

const WhyChooseUs = () => {
    const benefits = [
        {
            icon: <UsersIcon size={48} />,
            title: "Involucre a sus pacientes",
            description: "Elimine las distracciones que le provoca tomar notas, lo que le permitirá centrarse en sus pacientes y fomentar conexiones significativas."
        },
        {
            icon: <LightningIcon size={48} />,
            title: "Maximice su eficiencia",
            description: "Capture instantáneamente conversaciones en vivo con su paciente o dicte un resumen de la interacción."
        },
        {
            icon: <CrosshairIcon size={48} />,
            title: "Mejore su precisión",
            description: "Reduzca los errores y mejore la precisión de los datos con nuestro escriba médico de inteligencia artificial."
        },
        {
            icon: <GearIcon size={48} />,
            title: "Adáptese a sus necesidades",
            description: "Personalice plantillas y flujos de trabajo para adaptarlos a su práctica específica."
        }
    ];

    return (
        <section className="why-choose-us">
            <Container>
                <h2 className="text-center mb-5" data-aos="fade-up">
                    ¿Por qué elegir ConsulMedic?
                </h2>
                <Row>
                    {benefits.map((benefit, index) => (
                        <Col md={6} lg={3} key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                            <div className="benefit-card">
                                <div className="benefit-icon">{benefit.icon}</div>
                                <h3>{benefit.title}</h3>
                                <p>{benefit.description}</p>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
    );
};

export default WhyChooseUs;
