const STORAGE_KEY = 'app_users';

const initializeUsers = () => {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (users.length === 0) {
    const seedUser = {
      id: 1,
      username: 'admin',
      password: btoa('admin123'), // Base64 encode
      role: 'admin',
    };
    users.push(seedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  return users;
};

export const userService = {
  getUsers: () => {
    return initializeUsers();
  },

  addUser: (user) => {
    const users = initializeUsers();
    const newUser = {
      ...user,
      id: Date.now(),
      password: btoa(user.password), // Encode
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  updateUser: (id, updates) => {
    const users = initializeUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  },

  deleteUser: (id) => {
    const users = initializeUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};