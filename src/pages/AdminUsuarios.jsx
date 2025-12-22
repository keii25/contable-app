import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'lector' });

  useEffect(() => {
    setUsers(userService.getUsers());
  }, []);

  const handleAddUser = () => {
    if (newUser.username && newUser.password) {
      userService.addUser(newUser);
      setUsers(userService.getUsers());
      setNewUser({ username: '', password: '', role: 'lector' });
    }
  };

  const handleDelete = (id) => {
    userService.deleteUser(id);
    setUsers(userService.getUsers());
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>
      <div className="mb-6">
        <h2 className="text-xl mb-4">Agregar Usuario</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          className="border p-2 mr-2"
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="lector">Lector</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleAddUser} className="bg-blue-500 text-white p-2">Agregar</button>
      </div>
      <div>
        <h2 className="text-xl mb-4">Lista de Usuarios</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2">Usuario</th>
              <th className="border p-2">Rol</th>
              <th className="border p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">{user.username}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
                  <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white p-1">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsuarios;