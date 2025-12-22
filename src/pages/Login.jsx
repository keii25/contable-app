import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h2 className="hdr" style={{ textAlign: 'center', marginBottom: '1rem' }}>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="hdr" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="hdr" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          {error && <p style={{ color: 'var(--red)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
          <div className="flex-end">
            <button type="submit" className="btn btn-primary">Ingresar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;