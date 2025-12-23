import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const Login = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (username, password) => {
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="modal-backdrop" style={{ background: '#f3f4f6' }}>
      <div className="modal" style={{ maxWidth: '400px', background: 'white' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>App-Contable</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>Bienvenido</p>
        <h2 className="hdr" style={{ textAlign: 'center', marginBottom: '1rem' }}>Iniciar Sesión</h2>
        <LoginForm onSubmit={handleFormSubmit} error={error} />
      </div>
    </div>
  );
};

export default Login;