import React, { useState } from 'react';

type LoginFormProps = {
  onSubmit: (username: string, password: string) => void;
  error?: string;
};

export default function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          style={{ background: 'white', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}
          required
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          style={{ background: 'white', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}
          required
        />
      </div>
      {error && <p style={{ color: 'var(--red)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
      <div className="flex-end">
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ingresar</button>
      </div>
    </form>
  );
}
