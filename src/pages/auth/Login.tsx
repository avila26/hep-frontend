import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/dashboard');
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    width: '100vw',
                    backgroundColor: '#f8f9fa',
                    overflow: 'hidden',
                    padding: '1rem',
                    boxSizing: 'border-box'
                }}
            >
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, #eceeef 10%, rgba(33, 150, 243, 0) 30%)',
                        width: '100%',
                        maxWidth: '480px',
                        boxSizing: 'border-box'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '53px',
                            padding: 'clamp(2rem, 5vw, 5rem) clamp(1.5rem, 5vw, 3.5rem)',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Logo y título */}
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <img
                                src="/demo/images/imagenes/Ministerio_de_Salud_P%C3%BAblica_de_Ecuador_logo.svg.png"
                                alt="HEP Logo"
                                style={{
                                    height: 'clamp(35px, 7vw, 60px)',
                                    display: 'block',
                                    margin: '0 auto 1.5rem auto'
                                }}
                            />
                            <div
                                style={{
                                    fontSize: 'clamp(1.2rem, 3vw, 1.7rem)',
                                    fontWeight: '500',
                                    marginBottom: '0.75rem',
                                    color: '#343a40',
                                    lineHeight: '1.3'
                                }}
                            >
                                Sistema de Gestión de Activos HEP
                            </div>
                            <span style={{ color: '#6c757d', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Inicie sesión para continuar</span>
                        </div>

                        {/* Formulario */}
                        <div style={{ width: '100%', boxSizing: 'border-box' }}>
                            {/* Campo Usuario */}
                            <div style={{ marginBottom: '1.5rem', width: '100%' }}>
                                <label
                                    htmlFor="email1"
                                    style={{
                                        display: 'block',
                                        fontWeight: '500',
                                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                        marginBottom: '0.5rem',
                                        color: '#343a40'
                                    }}
                                >
                                    Usuario
                                </label>
                                <InputText
                                    id="email1"
                                    type="text"
                                    placeholder="Ingrese el usuario"
                                    className="w-full"
                                    style={{
                                        width: '100%',
                                        borderColor: '#676b6d',
                                        fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                                        boxSizing: 'border-box',
                                        height: '3rem'
                                    }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Campo Contraseña */}
                            <div style={{ marginBottom: '1rem', width: '100%' }}>
                                <label
                                    htmlFor="password1"
                                    style={{
                                        display: 'block',
                                        fontWeight: '500',
                                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                        marginBottom: '0.5rem',
                                        color: '#343a40'
                                    }}
                                >
                                    Contraseña
                                </label>
                                {/* El wrapper del componente Password necesita display:block y width:100% */}
                                <Password
                                    id="password1"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingrese la contraseña"
                                    toggleMask
                                    className="w-full"
                                    style={{
                                        display: 'block',
                                        width: '100%'
                                    }}
                                    inputStyle={{
                                        width: '100%',
                                        borderColor: '#676b6d',
                                        fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                                        boxSizing: 'border-box',
                                        height: '3rem'
                                    }}
                                    pt={{
                                        root: { style: { width: '100%', display: 'block' } },
                                        input: { style: { width: '100%', boxSizing: 'border-box', height: '3rem' } }
                                    }}
                                    feedback={false}
                                />
                            </div>

                            <Button
                                label="INGRESAR"
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    backgroundColor: '#2196F3',
                                    borderColor: '#2196F3',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                                    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                                    height: '3rem'
                                }}
                                onClick={handleLogin}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
