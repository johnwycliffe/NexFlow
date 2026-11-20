import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ROLES_LIST, INITIAL_USERS } from '../data/initialData';
import { authService, usersService } from '../services';

const AuthContext = createContext(null);

export const normalizeRole = (roleStr) => {
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

export const roleMatches = (userRole, targetRole) => {
  if (!userRole || !targetRole) return false;
  const u = String(userRole).toUpperCase().replace(/[^A-Z]/g, '');
  const t = String(targetRole).toUpperCase().replace(/[^A-Z]/g, '');
  if (u === t) return true;
  if ((u === 'ADMIN' || u === 'ADMINISTRATOR') && (t === 'ADMIN' || t === 'ADMINISTRATOR')) return true;
  if (u.includes('INVENTORY') && t.includes('INVENTORY')) return true;
  if (u.includes('PLANNER') && t.includes('PLANNER')) return true;
  if (u.includes('SUPERVISOR') && t.includes('SUPERVISOR')) return true;
  if ((u.includes('QUALITY') || u.includes('INSPECTOR')) && (t.includes('QUALITY') || t.includes('INSPECTOR'))) return true;
  if ((u.includes('MANAGEMENT') || u.includes('VIEWER')) && (t.includes('MANAGEMENT') || t.includes('VIEWER'))) return true;
  return false;
};

// Aliases mapping sidebar keys to backend permission prefixes
const MODULE_TO_PERM_PREFIX = {
  'dashboard': ['dashboard'],
  'products': ['products'],
  'bom': ['bom'],
  'raw-materials': ['raw_materials', 'rawmaterials', 'materials'],
  'suppliers': ['suppliers'],
  'inventory': ['inventory'],
  'demand-orders': ['demand_orders', 'demandorders', 'demand'],
  'production-orders': ['production_orders', 'productionorders', 'production'],
  'mrp': ['mrp'],
  'work-centers': ['work_centers', 'workcenters'],
  'machines': ['machines'],
  'shifts-calendar': ['shifts', 'shifts_calendar', 'shiftscalendar'],
  'scheduling': ['scheduling'],
  'production-execution': ['execution', 'production_execution', 'productionexecution'],
  'quality-inspection': ['quality', 'quality_inspection', 'qualityinspection'],
  'material-consumption': ['consumption', 'material_consumption', 'materialconsumption'],
  'finished-goods': ['finished_goods', 'finishedgoods'],
  'reports': ['reports'],
  'audit-logs': ['audit_logs', 'auditlogs', 'audit'],
  'user-management': ['users', 'user_management', 'usermanagement', 'roles', 'departments'],
  'credential-management': ['credentials', 'credential_management', 'credentialmanagement']
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [currentRole, setCurrentRole] = useState(() => {
    const saved = localStorage.getItem('nexflow_active_role');
    return normalizeRole(saved);
  });

  const [officersList, setOfficersList] = useState(() => {
    try {
      const cached = localStorage.getItem('nexflow_officers_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_USERS;
  });

  const [meUser, setMeUser] = useState(null);
  const [customUser, setCustomUser] = useState(null);

  // Single authoritative resolution path for currentUser using useMemo
  const currentUser = useMemo(() => {
    if (customUser) {
      return {
        ...customUser,
        name: customUser.fullName || customUser.name,
        fullName: customUser.fullName || customUser.name,
        permissions: Array.isArray(customUser.permissions) ? customUser.permissions : []
      };
    }

    if (meUser && roleMatches(meUser.role, currentRole)) {
      return {
        ...meUser,
        name: meUser.fullName || meUser.name,
        fullName: meUser.fullName || meUser.name,
        role: normalizeRole(meUser.role),
        jobTitle: meUser.jobTitle || 'Staff Officer',
        department: meUser.department || 'General Operations',
        permissions: Array.isArray(meUser.permissions) ? meUser.permissions : []
      };
    }

    const matched = (officersList || []).find(u => roleMatches(u.role, currentRole)) ||
      INITIAL_USERS.find(u => roleMatches(u.role, currentRole)) ||
      INITIAL_USERS[0];

    return {
      ...matched,
      name: matched.fullName || matched.name,
      fullName: matched.fullName || matched.name,
      jobTitle: matched.jobTitle || 'Staff Officer',
      department: matched.department || 'General Operations',
      permissions: Array.isArray(matched.permissions) ? matched.permissions : []
    };
  }, [currentRole, officersList, meUser, customUser]);

  // Stable refresh function with 0 dependencies so it never triggers infinite re-render loops
  const refreshCurrentUser = useCallback(async () => {
    try {
      const usersData = await usersService.getAll();
      if (Array.isArray(usersData) && usersData.length > 0) {
        const fresh = usersData.map(u => ({
          ...u,
          name: u.fullName || u.name,
          fullName: u.fullName || u.name,
          role: normalizeRole(u.role || u.roleName),
          jobTitle: u.jobTitle || 'Staff Officer',
          department: u.department || 'General Operations',
          permissions: Array.isArray(u.permissions) ? u.permissions : []
        }));
        setOfficersList(prev => {
          const prevStr = JSON.stringify(prev);
          const freshStr = JSON.stringify(fresh);
          if (prevStr === freshStr) return prev;
          try {
            localStorage.setItem('nexflow_officers_cache', freshStr);
          } catch (_) {}
          return fresh;
        });
      }
    } catch (err) {
      console.warn('[AuthContext] Live users directory fetch notice:', err?.message);
    }

    try {
      const me = await authService.getMe();
      if (me && me.email) {
        setMeUser(me);
      }
    } catch (err) {
      console.warn('[AuthContext] /auth/me fetch failed.');
    }
  }, []);

  // Sync active role to localStorage and load initial directory on mount or role change
  useEffect(() => {
    localStorage.setItem('nexflow_active_role', currentRole);
    refreshCurrentUser();
  }, [currentRole, refreshCurrentUser]);

  const switchRole = useCallback((roleName) => {
    const validRole = normalizeRole(roleName);
    setCustomUser(null);
    setCurrentRole(validRole);
    localStorage.setItem('nexflow_active_role', validRole);
  }, []);

  const login = useCallback((roleName = 'Administrator', userObj = null) => {
    const validRole = normalizeRole(roleName);
    if (userObj) {
      setCustomUser({
        ...userObj,
        permissions: Array.isArray(userObj.permissions) ? userObj.permissions : []
      });
    } else {
      setCustomUser(null);
    }
    setCurrentRole(validRole);
    setIsAuthenticated(true);
    localStorage.setItem('nexflow_active_role', validRole);
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCustomUser(null);
    setMeUser(null);
    localStorage.removeItem('nexflow_auth_token');
  }, []);

  const currentRoleConfig = useMemo(() => {
    return ROLES_LIST.find(r => r.name === currentRole) || ROLES_LIST[0];
  }, [currentRole]);

  const hasPermission = useCallback((permissionOrModuleKey) => {
    if (!currentRole) return true;
    const r = currentRole.toLowerCase().trim();
    if (r === 'administrator' || r === 'admin') return true;

    // Check granular permissions if user has an array of permissions
    if (Array.isArray(currentUser?.permissions) && currentUser.permissions.length > 0) {
      const permKeys = currentUser.permissions.map(p => 
        typeof p === 'string' ? p : (p?.permissionKey || p?.permission_key || '')
      );
      if (permKeys.includes('*')) return true;
      if (permKeys.includes(permissionOrModuleKey)) return true;

      // Check module prefix aliases (e.g. 'raw-materials' -> 'raw_materials.read')
      const targetKey = String(permissionOrModuleKey).toLowerCase();
      const prefixes = MODULE_TO_PERM_PREFIX[targetKey] || [
        targetKey.replace(/[-_.]/g, ''),
        targetKey.split('.')[0]
      ];

      for (const p of permKeys) {
        if (typeof p !== 'string') continue;
        const pNorm = p.toLowerCase();
        for (const pfx of prefixes) {
          if (pNorm.startsWith(pfx + '.') || pNorm === pfx) {
            return true;
          }
        }
      }
    }

    // Role configuration fallback
    const cfg = ROLES_LIST.find(role => role.name.toLowerCase() === r) || ROLES_LIST[0];
    if (!cfg || !cfg.allowedModules) return true;
    return cfg.allowedModules.includes('*') || cfg.allowedModules.includes(permissionOrModuleKey);
  }, [currentRole, currentUser?.permissions]);

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
        officersList,
        switchRole,
        hasPermission,
        refreshCurrentUser
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
