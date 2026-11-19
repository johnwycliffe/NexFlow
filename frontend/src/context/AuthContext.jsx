import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES_LIST, INITIAL_USERS } from '../data/initialData';

const AuthContext = createContext(null);

const normalizeRole = (roleStr) => {
  if (!roleStr) return 'Administrator';
  const clean = String(roleStr).trim().toLowerCase();
  if (clean === 'administrator' || clean === 'admin') return 'Administrator';
  const found = ROLES_LIST.find(r => 
    r.name.toLowerCase() === clean || 
    r.id.toLowerCase() === clean ||
    r.name.toLowerCase().replace(/[^a-z]/g, '') === clean.replace(/[^a-z]/g, '')
  );
  return found ? found.name : 'Administrator';
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [currentRole, setCurrentRole] = useState(() => {
    const saved = localStorage.getItem('nexflow_active_role');
    return normalizeRole(saved);
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedRole = normalizeRole(localStorage.getItem('nexflow_active_role'));
    return INITIAL_USERS.find(u => u.role === savedRole) || INITIAL_USERS[0];
  });

  useEffect(() => {
    localStorage.setItem('nexflow_active_role', currentRole);
    const matchedUser = INITIAL_USERS.find(u => u.role === currentRole);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
  }, [currentRole]);

  const switchRole = (roleName) => {
    setCurrentRole(normalizeRole(roleName));
  };

  const login = (roleName = 'Administrator', userObj = null) => {
    const validRole = normalizeRole(roleName);
    setCurrentRole(validRole);
    if (userObj) {
      setCurrentUser(userObj);
    } else {
      const matched = INITIAL_USERS.find(u => u.role === validRole) || INITIAL_USERS[0];
      setCurrentUser(matched);
    }
    setIsAuthenticated(true);
    localStorage.setItem('nexflow_active_role', validRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nexflow_auth_token');
  };

  const currentRoleConfig = ROLES_LIST.find(r => r.name === currentRole) || ROLES_LIST[0];

  const hasPermission = (moduleKey) => {
    if (!currentRole) return true;
    const r = currentRole.toLowerCase().trim();
    if (r === 'administrator' || r === 'admin') return true;
    const cfg = ROLES_LIST.find(role => role.name.toLowerCase() === r) || ROLES_LIST[0];
    if (!cfg || !cfg.allowedModules) return true;
    return cfg.allowedModules.includes('*') || cfg.allowedModules.includes(moduleKey);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentRole,
        currentUser,
        currentRoleConfig,
        rolesList: ROLES_LIST,
        switchRole,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

