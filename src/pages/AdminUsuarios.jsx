import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { accountService } from '../services/accountService';

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'lector' });
  const [loading, setLoading] = useState(false);

  // Cuentas por usuario (cuando se abre el modal)
  const [selectedUser, setSelectedUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountsMap, setAccountsMap] = useState({});
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('ingreso');
  const [editingAccount, setEditingAccount] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userList = await userService.getUsers();
      setUsers(userList);
      // Cargar cuentas para cada usuario (conteo y lista breve)
      try {
        const promises = userList.map(u => accountService.getAccountsForUser(u.id).then(list => ({ id: u.id, list })).catch(()=>({ id: u.id, list: [] })));
        const results = await Promise.all(promises);
        const map = {};
        results.forEach(r => map[r.id] = r.list || []);
        setAccountsMap(map);
      } catch (e) {
        console.warn('No se pudieron cargar cuentas por usuario:', e);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async () => {
    if (newUser.username && newUser.password) {
      setLoading(true);
      try {
        await userService.addUser(newUser);
        setUsers(await userService.getUsers());
        setNewUser({ username: '', password: '', role: 'lector' });
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Error al agregar usuario');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setLoading(true);
      try {
        await userService.deleteUser(id);
        setUsers(await userService.getUsers());
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error al eliminar usuario');
      } finally {
        setLoading(false);
      }
    }
  };

  // Cuentas: abrir modal y cargar
  const openAccounts = async (user) => {
    setSelectedUser(user);
    try {
      const list = await accountService.getAccountsForUser(user.id);
      setAccounts(list || []);
      // actualizar mapa local
      setAccountsMap(prev => ({ ...prev, [user.id]: list || [] }));
    } catch (err) {
      console.error('Error loading accounts:', err);
      setAccounts([]);
    }
    setAccountName('');
    setEditingAccount(null);
  };

  const closeAccounts = () => {
    setSelectedUser(null);
    setAccounts([]);
    setAccountName('');
    setEditingAccount(null);
  };

  const handleAddAccount = async () => {
    if (!accountName.trim()) return;
    try {
      const created = await accountService.addAccount(selectedUser.id, accountName.trim(), accountType);
      setAccounts(prev => [...prev, created]);
      setAccountName('');
      setAccountType('ingreso');
      // actualizar mapa
      setAccountsMap(prev => ({ ...prev, [selectedUser.id]: [...(prev[selectedUser.id]||[]), created] }));
    } catch (err) {
      console.error('Error addAccount:', err);
      if (err && err.code === 'DUPLICATE') alert(err.message || 'Ya existe una cuenta con ese nombre para este usuario');
      else if (err && err.code === 'INVALID_TYPE') alert('Tipo de cuenta inválido');
      else alert(err.message || 'Error al agregar cuenta');
    }
  };

  const startEdit = (acc) => {
    setEditingAccount(acc);
    setAccountName(acc.name);
    setAccountType(acc.type || 'ingreso');
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    try {
      const updated = await accountService.updateAccount(editingAccount.id, selectedUser.id, { name: accountName.trim(), type: accountType });
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      setEditingAccount(null);
      setAccountName('');
      setAccountType('ingreso');
      // actualizar mapa
      setAccountsMap(prev => ({ ...prev, [selectedUser.id]: (prev[selectedUser.id]||[]).map(a => a.id===updated.id?updated:a) }));
    } catch (err) {
      console.error('Error updateAccount:', err);
      if (err && err.code === 'DUPLICATE') alert(err.message || 'Ya existe una cuenta con ese nombre para este usuario');
      else if (err && err.code === 'INVALID_TYPE') alert('Tipo de cuenta inválido');
      else alert(err.message || 'Error al actualizar cuenta');
    }
  };

  const handleDeleteAccount = async (acc) => {
    if (!window.confirm('Eliminar cuenta?')) return;
    try {
      await accountService.deleteAccount(acc.id, selectedUser.id);
      setAccounts(prev => prev.filter(a => a.id !== acc.id));
      // actualizar mapa
      setAccountsMap(prev => ({ ...prev, [selectedUser.id]: (prev[selectedUser.id]||[]).filter(a => a.id !== acc.id) }));
    } catch (err) {
      console.error('Error deleteAccount:', err);
      alert(err.message || 'Error al eliminar cuenta');
    }
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
        <button onClick={handleAddUser} className="bg-blue-500 text-white p-2" disabled={loading}>
          {loading ? 'Agregando...' : 'Agregar'}
        </button>
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
              React.createElement(React.Fragment, { key: user.id },
                React.createElement("tr", { key: user.id },
                  React.createElement("td", { className: "border p-2" }, user.username),
                  React.createElement("td", { className: "border p-2" }, user.role),
                  React.createElement("td", { className: "border p-2" },
                    React.createElement("button", { onClick: () => openAccounts(user), className: "bg-green-500 text-white p-1 mr-2" }, "Cuentas"),
                    React.createElement("button", { onClick: () => handleDelete(user.id), className: "bg-red-500 text-white p-1" }, "Eliminar")
                  )
                ),
                React.createElement("tr", { key: user.id + '-accounts' },
                  React.createElement("td", { colSpan: 3, className: "border p-2" },
                    React.createElement("strong", null, "Cuentas:"),
                    (accountsMap[user.id] && accountsMap[user.id].length>0) ? (
                      React.createElement("div", { style: { display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' } },
                        ['ingreso','egreso'].map(t=> (
                          React.createElement("div", { key: t, style: { minWidth: 180 } },
                            React.createElement("div", { style: { fontSize: 12, fontWeight: 600 } }, t.toUpperCase()),
                            React.createElement("ul", { style: { margin: 6, paddingLeft: 14 } },
                              accountsMap[user.id].filter(a=>a.type===t).map(a=> React.createElement("li", { key: a.id }, a.name)),
                              accountsMap[user.id].filter(a=>a.type===t).length===0 && React.createElement("li", { className: "sub" }, "(ninguna)")
                            )
                          )
                        ))
                      )
                    ) : (
                      React.createElement("span", { style: { marginLeft: 8 } }, "No hay cuentas.")
                    )
                  )
                )
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal simple para cuentas */}
      {selectedUser && (
        <div className="modal-backdrop" style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)'}}>
          <div className="modal" style={{background:'white',maxWidth:700,margin:'40px auto',padding:16,borderRadius:6}}>
            <h3 className="hdr">Cuentas de {selectedUser.username}</h3>
            <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
              <input className="input" placeholder="Nombre de cuenta" value={accountName} onChange={e=>setAccountName(e.target.value)} />
              <select className="select" value={accountType} onChange={e=>setAccountType(e.target.value)} style={{width:140}}>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
              {editingAccount ? (
                <>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>Guardar</button>
                  <button className="btn" onClick={()=>{setEditingAccount(null);setAccountName('');setAccountType('ingreso')}}>Cancelar</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleAddAccount}>Añadir</button>
              )}
            </div>
            <div style={{marginTop:12}}>
              <table className="w-full border">
                <thead>
                  <tr><th className="border p-2">Cuenta</th><th className="border p-2">Tipo</th><th className="border p-2">Acciones</th></tr>
                </thead>
                <tbody>
                  {accounts.map(a=> (
                    <tr key={a.id}><td className="border p-2">{a.name}</td><td className="border p-2">{a.type}</td><td className="border p-2">
                      <button className="btn btn-primary mr-2" onClick={()=>startEdit(a)}>Editar</button>
                      <button className="btn btn-danger" onClick={()=>handleDeleteAccount(a)}>Eliminar</button>
                    </td></tr>
                  ))}
                  {accounts.length===0 && (<tr><td colSpan={2} className="sub">Sin cuentas.</td></tr>)}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
              <button className="btn" onClick={closeAccounts}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;