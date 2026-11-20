import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_RAW_MATERIALS,
  INITIAL_BOMS,
  INITIAL_SUPPLIERS,
  INITIAL_WAREHOUSES,
  INITIAL_INVENTORY,
  INITIAL_DEMAND_ORDERS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_WORK_CENTERS,
  INITIAL_MACHINES,
  INITIAL_SHIFTS,
  INITIAL_SCHEDULES,
  INITIAL_EXECUTION_RUNS,
  INITIAL_QUALITY_INSPECTIONS,
  INITIAL_MATERIAL_CONSUMPTION,
  INITIAL_FINISHED_GOODS,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS
} from '../data/initialData';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { ERPContext } from './ERPContextInstance';
import {
  productsService,
  rawMaterialsService,
  bomService,
  suppliersService,
  inventoryService,
  demandService,
  productionOrdersService,
  workCentersService,
  machinesService,
  shiftsService,
  schedulingService,
  executionService,
  qualityService,
  consumptionService,
  finishedGoodsService,
  auditLogsService,
  usersService,
  mrpService,
  reportsService,
  checkBackendHealth
} from '../services';

// Storage Keys

const STORAGE_KEYS = {
  PRODUCTS: 'nexflow_products',
  RAW_MATERIALS: 'nexflow_raw_materials',
  BOMS: 'nexflow_boms',
  SUPPLIERS: 'nexflow_suppliers',
  WAREHOUSES: 'nexflow_warehouses',
  INVENTORY: 'nexflow_inventory',
  DEMAND_ORDERS: 'nexflow_demand_orders',
  PRODUCTION_ORDERS: 'nexflow_production_orders',
  WORK_CENTERS: 'nexflow_work_centers',
  MACHINES: 'nexflow_machines',
  SHIFTS: 'nexflow_shifts',
  SCHEDULES: 'nexflow_schedules',
  EXECUTION_RUNS: 'nexflow_execution_runs',
  QUALITY_INSPECTIONS: 'nexflow_quality_inspections',
  MATERIAL_CONSUMPTION: 'nexflow_consumption',
  FINISHED_GOODS: 'nexflow_finished_goods',
  AUDIT_LOGS: 'nexflow_audit_logs',
  USERS: 'nexflow_users'
};

const getStorageItem = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
};

export const ERPProvider = ({ children }) => {
  const { currentRole, currentUser } = useAuth();
  const { addToast } = useToast();

  // Backend Connection State
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // State initialization with localStorage fallback
  const [products, setProducts] = useState(() => getStorageItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [rawMaterials, setRawMaterials] = useState(() => getStorageItem(STORAGE_KEYS.RAW_MATERIALS, INITIAL_RAW_MATERIALS));
  const [boms, setBoms] = useState(() => getStorageItem(STORAGE_KEYS.BOMS, INITIAL_BOMS));
  const [suppliers, setSuppliers] = useState(() => getStorageItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
  const [warehouses, setWarehouses] = useState(() => getStorageItem(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES));
  const [inventory, setInventory] = useState(() => getStorageItem(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY));
  const [demandOrders, setDemandOrders] = useState(() => getStorageItem(STORAGE_KEYS.DEMAND_ORDERS, INITIAL_DEMAND_ORDERS));
  const [productionOrders, setProductionOrders] = useState(() => getStorageItem(STORAGE_KEYS.PRODUCTION_ORDERS, INITIAL_PRODUCTION_ORDERS));
  const [workCenters, setWorkCenters] = useState(() => getStorageItem(STORAGE_KEYS.WORK_CENTERS, INITIAL_WORK_CENTERS));
  const [machines, setMachines] = useState(() => getStorageItem(STORAGE_KEYS.MACHINES, INITIAL_MACHINES));
  const [shifts, setShifts] = useState(() => getStorageItem(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS));
  const [schedules, setSchedules] = useState(() => getStorageItem(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES));
  const [executionRuns, setExecutionRuns] = useState(() => getStorageItem(STORAGE_KEYS.EXECUTION_RUNS, INITIAL_EXECUTION_RUNS));
  const [qualityInspections, setQualityInspections] = useState(() => getStorageItem(STORAGE_KEYS.QUALITY_INSPECTIONS, INITIAL_QUALITY_INSPECTIONS));
  const [materialConsumption, setMaterialConsumption] = useState(() => getStorageItem(STORAGE_KEYS.MATERIAL_CONSUMPTION, INITIAL_MATERIAL_CONSUMPTION));
  const [finishedGoods, setFinishedGoods] = useState(() => getStorageItem(STORAGE_KEYS.FINISHED_GOODS, INITIAL_FINISHED_GOODS));
  const [auditLogs, setAuditLogs] = useState(() => getStorageItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS));
  const [users, setUsers] = useState(() => getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS));

  // Sync with live FastAPI backend
  const syncWithBackend = useCallback(async (notify = false) => {
    setIsSyncing(true);
    try {
      const isOnline = await checkBackendHealth(true);
      setIsBackendConnected(isOnline);
      if (isOnline) {
        const [
          pRes, rmRes, bRes, sRes, iRes, dRes, poRes, wcRes, mcRes, shRes, schRes, exRes, qRes, cRes, fgRes, logRes, uRes
        ] = await Promise.allSettled([
          productsService.getAll(),
          rawMaterialsService.getAll(),
          bomService.getAll(),
          suppliersService.getAll(),
          inventoryService.getAll(),
          demandService.getAll(),
          productionOrdersService.getAll(),
          workCentersService.getAll(),
          machinesService.getAll(),
          shiftsService.getAll(),
          schedulingService.getAll(),
          executionService.getAll(),
          qualityService.getAll(),
          consumptionService.getAll(),
          finishedGoodsService.getAll(),
          auditLogsService.getAll(),
          usersService.getAll(),
        ]);

        if (pRes.status === 'fulfilled' && pRes.value?.length > 0) setProducts(pRes.value);
        if (rmRes.status === 'fulfilled' && rmRes.value?.length > 0) setRawMaterials(rmRes.value);
        if (bRes.status === 'fulfilled' && bRes.value?.length > 0) setBoms(bRes.value);
        if (sRes.status === 'fulfilled' && sRes.value?.length > 0) setSuppliers(sRes.value);

        const loadedRawMaterials = (rmRes.status === 'fulfilled' && rmRes.value?.length > 0) ? rmRes.value : (rawMaterials || []);
        const loadedWarehouses = warehouses || [];

        if (iRes.status === 'fulfilled' && iRes.value?.length > 0) {
          const normalizedInventory = iRes.value.map((item) => {
            const rawMat = loadedRawMaterials.find(
              (r) => r.id === item.materialId || String(r.id) === String(item.materialId) || r.code === item.materialCode
            );
            const wh = loadedWarehouses.find(
              (w) => w.id === item.warehouseId || String(w.id) === String(item.warehouseId) || w.code === item.warehouseCode
            );
            const onHand = Number(item.onHand !== undefined ? item.onHand : (item.onHandQty !== undefined ? item.onHandQty : 0));
            const reserved = Number(item.reserved !== undefined ? item.reserved : (item.reservedQty !== undefined ? item.reservedQty : 0));
            const available = Number(item.available !== undefined ? item.available : (item.availableQty !== undefined ? item.availableQty : Math.max(0, onHand - reserved)));
            const unitCost = Number(item.unitCost !== undefined ? item.unitCost : (rawMat?.unitCost || 0));
            const totalValuation = Number(item.totalValuation !== undefined ? item.totalValuation : (onHand * unitCost).toFixed(2));

            return {
              ...item,
              onHand,
              reserved,
              available,
              onHandQty: onHand,
              reservedQty: reserved,
              availableQty: available,
              materialCode: item.materialCode || rawMat?.code || '',
              materialName: item.materialName || rawMat?.name || '',
              warehouseName: item.warehouseName || wh?.name || 'Central Raw Material Depot',
              uom: item.uom || rawMat?.uom || 'units',
              unitCost,
              totalValuation
            };
          });
          setInventory(normalizedInventory);
        }
        if (dRes.status === 'fulfilled' && dRes.value?.length > 0) setDemandOrders(dRes.value);
        if (poRes.status === 'fulfilled' && poRes.value?.length > 0) setProductionOrders(poRes.value);
        if (wcRes.status === 'fulfilled' && wcRes.value?.length > 0) setWorkCenters(wcRes.value);
        if (mcRes.status === 'fulfilled' && mcRes.value?.length > 0) setMachines(mcRes.value);
        if (shRes.status === 'fulfilled' && shRes.value?.length > 0) setShifts(shRes.value);
        if (schRes.status === 'fulfilled' && schRes.value?.length > 0) setSchedules(schRes.value);
        if (exRes.status === 'fulfilled' && exRes.value?.length > 0) setExecutionRuns(exRes.value);
        if (qRes.status === 'fulfilled' && qRes.value?.length > 0) setQualityInspections(qRes.value);
        if (cRes.status === 'fulfilled' && cRes.value?.length > 0) setMaterialConsumption(cRes.value);
        if (fgRes.status === 'fulfilled' && fgRes.value?.length > 0) setFinishedGoods(fgRes.value);
        if (logRes.status === 'fulfilled' && logRes.value?.length > 0) setAuditLogs(logRes.value);
        if (uRes.status === 'fulfilled' && uRes.value?.length > 0) setUsers(uRes.value);

        if (notify) {
          addToast('Successfully synchronized with live FastAPI backend database.', 'info');
        }
      }
    } catch (e) {
      console.warn('[ERPContext] Backend synchronization error:', e);
      setIsBackendConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [addToast]);

  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(() => {
      checkBackendHealth().then(online => setIsBackendConnected(online));
    }, 25000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RAW_MATERIALS, JSON.stringify(rawMaterials)); }, [rawMaterials]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BOMS, JSON.stringify(boms)); }, [boms]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses)); }, [warehouses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DEMAND_ORDERS, JSON.stringify(demandOrders)); }, [demandOrders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTION_ORDERS, JSON.stringify(productionOrders)); }, [productionOrders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WORK_CENTERS, JSON.stringify(workCenters)); }, [workCenters]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines)); }, [machines]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EXECUTION_RUNS, JSON.stringify(executionRuns)); }, [executionRuns]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.QUALITY_INSPECTIONS, JSON.stringify(qualityInspections)); }, [qualityInspections]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MATERIAL_CONSUMPTION, JSON.stringify(materialConsumption)); }, [materialConsumption]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FINISHED_GOODS, JSON.stringify(finishedGoods)); }, [finishedGoods]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);

  // Immutable Audit Logger
  const logAudit = useCallback((moduleName, actionType, changeNotes, targetId = '') => {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().substring(0, 8)}`;
    const newEntry = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp,
      userRole: currentRole,
      userId: currentUser?.name || 'System Operator',
      module: moduleName,
      actionType, // CREATE, UPDATE, STATUS_CHANGE, DELETE, REQUISITION
      targetId,
      changeNotes
    };

    setAuditLogs((prev) => [newEntry, ...prev]);
  }, [currentRole, currentUser]);

  // Reset entire database to canonical seed state
  const resetDatabase = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setRawMaterials(INITIAL_RAW_MATERIALS);
    setBoms(INITIAL_BOMS);
    setSuppliers(INITIAL_SUPPLIERS);
    setWarehouses(INITIAL_WAREHOUSES);
    setInventory(INITIAL_INVENTORY);
    setDemandOrders(INITIAL_DEMAND_ORDERS);
    setProductionOrders(INITIAL_PRODUCTION_ORDERS);
    setWorkCenters(INITIAL_WORK_CENTERS);
    setMachines(INITIAL_MACHINES);
    setShifts(INITIAL_SHIFTS);
    setSchedules(INITIAL_SCHEDULES);
    setExecutionRuns(INITIAL_EXECUTION_RUNS);
    setQualityInspections(INITIAL_QUALITY_INSPECTIONS);
    setMaterialConsumption(INITIAL_MATERIAL_CONSUMPTION);
    setFinishedGoods(INITIAL_FINISHED_GOODS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setUsers(INITIAL_USERS);

    addToast('Manufacturing ERP database successfully restored to canonical benchmark state.', 'info');
  }, [addToast]);

  // ----------------------------------------------------
  // PRODUCTS CRUD
  // ----------------------------------------------------
  const addProduct = async (productData) => {
    const id = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    const newProduct = { ...productData, id };
    setProducts((prev) => [newProduct, ...prev]);
    logAudit('Product Master', 'CREATE', `Registered new SKU ${newProduct.sku} (${newProduct.name})`, id);
    addToast(`Product ${newProduct.sku} registered successfully.`);

    try {
      const persisted = await productsService.create(newProduct);
      if (persisted && (persisted.id || persisted.sku)) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...persisted } : p)));
      }
    } catch (err) {
      console.warn('[ERPContext] Backend product creation error:', err?.response?.data || err?.message);
    }

    return newProduct;
  };

  const updateProduct = async (id, updatedFields) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    logAudit('Product Master', 'UPDATE', `Updated product specifications for ${id}`, id);
    addToast('Product details updated.');

    try {
      const currentProd = products.find((p) => p.id === id || p.sku === id);
      const targetId = currentProd?.id || id;
      await productsService.update(targetId, updatedFields);
    } catch (err) {
      console.warn('[ERPContext] Backend product update error:', err?.response?.data || err?.message);
    }
  };

  const deleteProduct = async (id) => {
    const p = products.find((prod) => prod.id === id || prod.sku === id);
    setProducts((prev) => prev.filter((item) => item.id !== id && item.sku !== id));
    logAudit('Product Master', 'DELETE', `Archived product SKU ${p?.sku || id}`, id);
    addToast('Product removed.', 'warning');

    try {
      const targetId = p?.id || id;
      await productsService.delete(targetId);
    } catch (err) {
      console.warn('[ERPContext] Backend product delete error:', err?.response?.data || err?.message);
    }
  };

  // ----------------------------------------------------
  // RAW MATERIALS CRUD
  // ----------------------------------------------------
  const addRawMaterial = async (matData) => {
    const id = `MAT-${String(100 + rawMaterials.length + 1)}`;
    const newMat = { ...matData, id };
    setRawMaterials((prev) => [...prev, newMat]);

    // Also auto-create inventory record in WH-01
    const newInv = {
      id: `INV-${newMat.id.replace('MAT-', '')}`,
      materialId: newMat.id,
      materialCode: newMat.code,
      materialName: newMat.name,
      warehouseId: 'WH-01',
      warehouseName: 'Central Raw Material Depot',
      locationBin: 'BIN-NEW-01',
      onHand: 100,
      reserved: 0,
      available: 100,
      uom: newMat.uom,
      unitCost: Number(newMat.unitCost || 10),
      totalValuation: Number(newMat.unitCost || 10) * 100,
      lastCountDate: new Date().toISOString().split('T')[0],
      status: 'IN_STOCK'
    };
    setInventory((prev) => [...prev, newInv]);

    logAudit('Raw Materials', 'CREATE', `Added raw material ${newMat.code} (${newMat.name})`, id);
    addToast(`Raw material ${newMat.name} added to catalog.`);

    try {
      const persisted = await rawMaterialsService.create(newMat);
      if (persisted && (persisted.id || persisted.code)) {
        setRawMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...persisted } : m)));
      }
    } catch (err) {
      console.warn('[ERPContext] Backend raw material creation error:', err?.response?.data || err?.message);
    }

    return newMat;
  };

  const updateRawMaterial = async (id, updatedFields) => {
    setRawMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedFields } : m)));
    setInventory((prev) => prev.map((inv) => (inv.materialId === id ? {
      ...inv,
      materialName: updatedFields.name || inv.materialName,
      unitCost: updatedFields.unitCost !== undefined ? Number(updatedFields.unitCost) : inv.unitCost,
      totalValuation: (updatedFields.unitCost !== undefined ? Number(updatedFields.unitCost) : inv.unitCost) * inv.onHand
    } : inv)));
    logAudit('Raw Materials', 'UPDATE', `Modified raw material ${id} parameters`, id);
    addToast('Raw material record updated.');

    try {
      const currentMat = rawMaterials.find((m) => m.id === id || m.code === id);
      const targetId = currentMat?.id || id;
      await rawMaterialsService.update(targetId, updatedFields);
    } catch (err) {
      console.warn('[ERPContext] Backend raw material update error:', err?.response?.data || err?.message);
    }
  };

  const deleteRawMaterial = async (id) => {
    setRawMaterials((prev) => prev.filter((m) => m.id !== id && m.code !== id));
    setInventory((prev) => prev.filter((inv) => inv.materialId !== id));
    logAudit('Raw Materials', 'DELETE', `Deleted raw material ${id}`, id);
    addToast('Material removed from registry.', 'warning');

    try {
      const currentMat = rawMaterials.find((m) => m.id === id || m.code === id);
      const targetId = currentMat?.id || id;
      await rawMaterialsService.delete(targetId);
    } catch (err) {
      console.warn('[ERPContext] Backend raw material delete error:', err?.response?.data || err?.message);
    }
  };

  // ----------------------------------------------------
  // BOM CRUD & CALCULATIONS
  // ----------------------------------------------------
  const addBOM = (bomData) => {
    const id = `BOM-${String(boms.length + 1).padStart(3, '0')}`;
    const scrapPct = Number(bomData.scrapAllowancePercent || 0);
    const subtotal = (bomData.items || []).reduce((acc, item) => acc + (Number(item.quantityPerUnit || 0) * Number(item.unitCost || 0)), 0);
    const totalCalculatedCost = subtotal * (1 + scrapPct / 100);

    const newBom = {
      ...bomData,
      id,
      totalCalculatedCost: Number(totalCalculatedCost.toFixed(2))
    };
    setBoms((prev) => [...prev, newBom]);
    logAudit('Bill of Materials', 'CREATE', `Created BOM ${newBom.bomCode} for ${newBom.productName}`, id);
    addToast(`BOM ${newBom.bomCode} established.`);
    return newBom;
  };

  const updateBOM = (id, updatedFields) => {
    setBoms((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const merged = { ...b, ...updatedFields };
      const scrapPct = Number(merged.scrapAllowancePercent || 0);
      const subtotal = (merged.items || []).reduce((acc, item) => acc + (Number(item.quantityPerUnit || 0) * Number(item.unitCost || 0)), 0);
      merged.totalCalculatedCost = Number((subtotal * (1 + scrapPct / 100)).toFixed(2));
      return merged;
    }));
    logAudit('Bill of Materials', 'UPDATE', `Revised BOM structure for ${id}`, id);
    addToast('BOM revised.');
  };

  const deleteBOM = (id) => {
    setBoms((prev) => prev.filter((b) => b.id !== id));
    logAudit('Bill of Materials', 'DELETE', `Deleted BOM ${id}`, id);
    addToast('BOM deleted.', 'warning');
  };

  // ----------------------------------------------------
  // SUPPLIERS CRUD
  // ----------------------------------------------------
  const addSupplier = async (supData) => {
    const code = (supData.code || `SUP-${String(suppliers.length + 1).padStart(3, '0')}`).trim().toUpperCase();
    const id = code;
    const linkedCategories = Array.isArray(supData.linkedCategories)
      ? supData.linkedCategories.join(', ')
      : (supData.linkedCategories || '');

    const newSup = {
      ...supData,
      id,
      code,
      rating: Number(supData.rating || 4.5),
      leadTimeDays: parseInt(supData.leadTimeDays || 10, 10),
      qualityPassRate: Number(supData.qualityPassRate || 98.0),
      paymentTerms: supData.paymentTerms || 'Net 30',
      linkedCategories
    };

    setSuppliers((prev) => [...prev, newSup]);
    logAudit('Suppliers', 'CREATE', `Registered supplier ${newSup.name} (${newSup.country})`, id);
    addToast(`Supplier ${newSup.name} added.`);

    // Persist to FastAPI MySQL Backend
    try {
      const persisted = await suppliersService.create(newSup);
      if (persisted && (persisted.id || persisted.code)) {
        setSuppliers((prev) => prev.map((s) => (s.id === id || s.code === code ? { ...s, ...persisted } : s)));
      }
    } catch (err) {
      console.warn('[ERPContext] Backend supplier creation error (saved locally):', err?.response?.data || err?.message);
    }

    return newSup;
  };

  const updateSupplier = async (id, updatedFields) => {
    const payload = { ...updatedFields };
    if (payload.linkedCategories && Array.isArray(payload.linkedCategories)) {
      payload.linkedCategories = payload.linkedCategories.join(', ');
    }

    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)));
    logAudit('Suppliers', 'UPDATE', `Updated vendor record ${id}`, id);
    addToast('Supplier details updated.');

    try {
      const currentSup = suppliers.find((s) => s.id === id || s.code === id);
      const targetId = currentSup?.id || id;
      await suppliersService.update(targetId, payload);
    } catch (err) {
      console.warn('[ERPContext] Backend supplier update error:', err?.response?.data || err?.message);
    }
  };

  const deleteSupplier = async (id) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id && s.code !== id));
    logAudit('Suppliers', 'DELETE', `Removed supplier ${id}`, id);
    addToast('Supplier removed.', 'warning');

    try {
      const currentSup = suppliers.find((s) => s.id === id || s.code === id);
      const targetId = currentSup?.id || id;
      await suppliersService.delete(targetId);
    } catch (err) {
      console.warn('[ERPContext] Backend supplier delete error:', err?.response?.data || err?.message);
    }
  };

  // ----------------------------------------------------
  // INVENTORY OPERATIONS (CRUD & ATOMIC MOVEMENTS)
  // ----------------------------------------------------
  const adjustStock = async (inventoryId, newOnHand, reason = 'Cycle Count Adjustment') => {
    const onHandNum = Math.max(0, Number(newOnHand));

    // Optimistic UI update
    setInventory((prev) => prev.map((item) => {
      if (item.id !== inventoryId) return item;
      const reserved = Number(item.reserved !== undefined ? item.reserved : (item.reservedQty ?? 0));
      const available = Math.max(0, onHandNum - reserved);
      const unitCost = Number(item.unitCost || 0);
      const totalValuation = Number((onHandNum * unitCost).toFixed(2));
      
      const rawMat = rawMaterials.find(
        (r) => r.id === item.materialId || String(r.id) === String(item.materialId) || r.code === item.materialCode
      );
      const safetyStock = rawMat?.safetyStock || 50;
      let status = 'IN_STOCK';
      if (available <= 0) status = 'OUT_OF_STOCK';
      else if (available <= safetyStock) status = 'LOW_STOCK';

      return {
        ...item,
        onHand: onHandNum,
        reserved,
        available,
        onHandQty: onHandNum,
        reservedQty: reserved,
        availableQty: available,
        totalValuation,
        status,
        lastCountDate: new Date().toISOString().split('T')[0]
      };
    }));

    logAudit('Inventory', 'UPDATE', `Adjusted inventory ${inventoryId} to ${onHandNum}. Reason: ${reason}`, inventoryId);
    addToast('Inventory count adjusted.');

    // Persist to MySQL Backend via FastAPI
    try {
      const currentItem = inventory.find(i => i.id === inventoryId);
      const numericId = typeof currentItem?.id === 'number' ? currentItem.id : (parseInt(String(inventoryId).replace(/\D/g, ''), 10) || currentItem?.materialId || 1);
      await inventoryService.adjust(numericId, onHandNum, reason);
    } catch (err) {
      console.warn('[ERPContext] Backend stock adjustment error (saved locally):', err?.response?.data || err?.message);
    }
  };

  const transferStock = async (materialId, fromWarehouseId, toWarehouseId, quantity, notes = '') => {
    const qty = Number(quantity);
    if (qty <= 0) {
      addToast('Transfer quantity must be greater than zero.', 'error');
      return false;
    }

    const sourceItem = inventory.find(
      (i) => (i.materialId === materialId || String(i.materialId) === String(materialId)) &&
             (i.warehouseId === fromWarehouseId || String(i.warehouseId) === String(fromWarehouseId))
    );
    const available = Number(sourceItem?.available ?? sourceItem?.availableQty ?? 0);
    if (!sourceItem || available < qty) {
      addToast(`Transfer blocked: Insufficient available stock in source warehouse (${available} available, ${qty} requested).`, 'error');
      return false;
    }

    // Optimistic UI update
    setInventory((prev) => {
      return prev.map((item) => {
        if (
          (item.materialId === materialId || String(item.materialId) === String(materialId)) &&
          (item.warehouseId === fromWarehouseId || String(item.warehouseId) === String(fromWarehouseId))
        ) {
          const newOnHand = Math.max(0, (item.onHand ?? item.onHandQty ?? 0) - qty);
          const reserved = Number(item.reserved ?? item.reservedQty ?? 0);
          const newAvail = Math.max(0, newOnHand - reserved);
          return {
            ...item,
            onHand: newOnHand,
            available: newAvail,
            onHandQty: newOnHand,
            availableQty: newAvail,
            totalValuation: Number((newOnHand * (item.unitCost || 0)).toFixed(2))
          };
        }
        return item;
      });
    });

    logAudit('Inventory', 'UPDATE', `Transferred ${qty} ${sourceItem.uom || 'units'} of ${sourceItem.materialCode || materialId} from ${fromWarehouseId} to ${toWarehouseId}. ${notes}`, materialId);
    addToast(`Successfully transferred ${qty} ${sourceItem.uom || 'units'} to staging.`);

    // Persist to MySQL Backend via FastAPI
    try {
      const matIdNum = typeof materialId === 'number' ? materialId : (parseInt(String(materialId).replace(/\D/g, ''), 10) || 1);
      const fromWhNum = typeof fromWarehouseId === 'number' ? fromWarehouseId : (parseInt(String(fromWarehouseId).replace(/\D/g, ''), 10) || 1);
      const toWhNum = typeof toWarehouseId === 'number' ? toWarehouseId : (parseInt(String(toWarehouseId).replace(/\D/g, ''), 10) || 2);
      await inventoryService.transfer(matIdNum, fromWhNum, toWhNum, qty, notes);
    } catch (err) {
      console.warn('[ERPContext] Backend stock transfer error (saved locally):', err?.response?.data || err?.message);
    }

    return true;
  };

  // ----------------------------------------------------
  // DEMAND / SALES ORDERS CRUD
  // ----------------------------------------------------
  const addDemandOrder = (orderData) => {
    const id = `SO-2026-${String(demandOrders.length + 1).padStart(3, '0')}`;
    const newOrder = {
      ...orderData,
      id,
      orderNumber: id,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'PENDING_PLANNING',
      linkedProductionOrderId: null
    };
    setDemandOrders((prev) => [newOrder, ...prev]);
    logAudit('Demand / Sales Orders', 'CREATE', `Generated demand order ${id} for ${newOrder.customerName} (${newOrder.quantity} ${newOrder.uom})`, id);
    addToast(`Demand Order ${id} created.`);
    return newOrder;
  };

  const updateDemandOrder = (id, updatedFields) => {
    setDemandOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updatedFields } : o)));
    logAudit('Demand / Sales Orders', 'UPDATE', `Updated order terms for ${id}`, id);
    addToast('Sales order updated.');
  };

  const deleteDemandOrder = (id) => {
    setDemandOrders((prev) => prev.filter((o) => o.id !== id));
    logAudit('Demand / Sales Orders', 'DELETE', `Cancelled sales demand order ${id}`, id);
    addToast('Sales order removed.', 'warning');
  };

  // Convert Demand to Production Order
  const convertDemandToProductionOrder = (demandOrderId, customBatchSize = null) => {
    const demand = demandOrders.find(d => d.id === demandOrderId);
    if (!demand) return null;

    const poId = `PO-2026-${String(100 + productionOrders.length + 1)}`;
    const batchQty = customBatchSize || demand.quantity;

    const newPO = {
      id: poId,
      orderNumber: poId,
      demandOrderId: demand.id,
      productId: demand.productId,
      productName: demand.productName,
      batchQuantity: batchQty,
      uom: demand.uom,
      priority: demand.priority,
      status: 'Draft', // Draft -> Released -> In-Progress -> Inspection -> Completed
      progressPercent: 0,
      workCenterId: 'WC-04',
      workCenterName: 'Final Mechanical Assembly Line',
      machineId: 'MC-05',
      machineName: 'Assembly Line Rig A',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: demand.requestedDeliveryDate,
      actualStartDate: null,
      completedDate: null,
      scrapRatePercent: 0.0,
      operatorNotes: `Converted from Customer Demand ${demand.orderNumber} (${demand.customerName})`
    };

    setProductionOrders((prev) => [newPO, ...prev]);

    // Update Demand Order status to IN_PRODUCTION
    setDemandOrders((prev) => prev.map((d) => d.id === demandOrderId ? {
      ...d,
      status: 'IN_PRODUCTION',
      linkedProductionOrderId: poId
    } : d));

    logAudit('Production Orders', 'CREATE', `Spawned Production Order ${poId} from Demand ${demand.orderNumber}`, poId);
    addToast(`Production Order ${poId} generated in Draft status.`);
    return newPO;
  };

  // ----------------------------------------------------
  // PRODUCTION ORDERS CRUD & LIFECYCLE
  // ----------------------------------------------------
  const addProductionOrder = (poData) => {
    const id = `PO-2026-${String(100 + productionOrders.length + 1)}`;
    const newPO = {
      ...poData,
      id,
      orderNumber: id,
      status: 'Draft',
      progressPercent: 0,
      scrapRatePercent: 0.0,
      actualStartDate: null,
      completedDate: null
    };
    setProductionOrders((prev) => [newPO, ...prev]);
    logAudit('Production Orders', 'CREATE', `Created manual production order ${id} for ${newPO.productName}`, id);
    addToast(`Production order ${id} created.`);
    return newPO;
  };

  const updateProductionOrder = (id, updatedFields) => {
    setProductionOrders((prev) => prev.map((po) => (po.id === id ? { ...po, ...updatedFields } : po)));
    logAudit('Production Orders', 'UPDATE', `Updated production order specifications for ${id}`, id);
    addToast('Production order modified.');
  };

  const updateProductionOrderStatus = (id, newStatus) => {
    const po = productionOrders.find(p => p.id === id);
    if (!po) return;

    let updates = { status: newStatus };

    if (newStatus === 'Released' && !po.actualStartDate) {
      updates.actualStartDate = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'In-Progress') {
      if (po.progressPercent === 0) updates.progressPercent = 15;
    } else if (newStatus === 'Inspection') {
      updates.progressPercent = 100;
    } else if (newStatus === 'Completed') {
      updates.progressPercent = 100;
      updates.completedDate = new Date().toISOString().split('T')[0];

      // If linked to Demand Order, mark demand order completed
      if (po.demandOrderId) {
        setDemandOrders((prev) => prev.map((d) => d.id === po.demandOrderId ? {
          ...d,
          status: 'COMPLETED'
        } : d));
      }
    }

    setProductionOrders((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    logAudit('Production Orders', 'STATUS_CHANGE', `PO ${po.orderNumber} transitioned from ${po.status} to ${newStatus}`, id);
    addToast(`Order ${po.orderNumber} is now ${newStatus}.`);
  };

  const deleteProductionOrder = (id) => {
    const po = productionOrders.find(p => p.id === id);
    setProductionOrders((prev) => prev.filter((p) => p.id !== id));
    logAudit('Production Orders', 'DELETE', `Cancelled Production Order ${po?.orderNumber || id}`, id);
    addToast('Production order removed.', 'warning');
  };

  // ----------------------------------------------------
  // WORK CENTERS & MACHINES CRUD
  // ----------------------------------------------------
  const addWorkCenter = (wcData) => {
    const id = `WC-${String(workCenters.length + 1).padStart(2, '0')}`;
    const newWC = { ...wcData, id, status: 'ACTIVE', activeMachinesCount: 1 };
    setWorkCenters((prev) => [...prev, newWC]);
    logAudit('Work Centers', 'CREATE', `Commissioned Work Center ${newWC.name}`, id);
    addToast(`Work Center ${newWC.name} configured.`);
    return newWC;
  };

  const updateWorkCenter = (id, updatedFields) => {
    setWorkCenters((prev) => prev.map((wc) => (wc.id === id ? { ...wc, ...updatedFields } : wc)));
    logAudit('Work Centers', 'UPDATE', `Updated operating parameters for Work Center ${id}`, id);
    addToast('Work Center updated.');
  };

  const addMachine = (mcData) => {
    const id = `MC-${String(machines.length + 1).padStart(2, '0')}`;
    const newMC = { ...mcData, id };
    setMachines((prev) => [...prev, newMC]);
    logAudit('Machines', 'CREATE', `Registered machine ${newMC.name} under ${newMC.workCenterName}`, id);
    addToast(`Machine ${newMC.name} registered.`);
    return newMC;
  };

  const updateMachine = (id, updatedFields) => {
    setMachines((prev) => prev.map((mc) => (mc.id === id ? { ...mc, ...updatedFields } : mc)));
    logAudit('Machines', 'UPDATE', `Updated machine status/runtime for ${id}`, id);
    addToast('Machine data updated.');
  };

  // ----------------------------------------------------
  // SHIFTS & SCHEDULING (WITH ACTIVE DOUBLE-BOOKING CONFLICT DETECTION)
  // ----------------------------------------------------
  const addShift = (shiftData) => {
    const id = `SH-${String(shifts.length + 1).padStart(2, '0')}`;
    const newShift = { ...shiftData, id, status: 'ACTIVE' };
    setShifts((prev) => [...prev, newShift]);
    logAudit('Shifts & Calendar', 'CREATE', `Configured shift pattern ${newShift.name}`, id);
    addToast(`Shift pattern ${newShift.name} added.`);
    return newShift;
  };

  const updateShift = (id, updatedFields) => {
    setShifts((prev) => prev.map((sh) => (sh.id === id ? { ...sh, ...updatedFields } : sh)));
    logAudit('Shifts & Calendar', 'UPDATE', `Modified shift pattern ${id}`, id);
    addToast('Shift schedule updated.');
  };

  // Detect collision: check if machine is already scheduled in the same time window
  const checkScheduleConflict = (machineId, scheduleDate, startHour, endHour, excludeScheduleId = null) => {
    const start = Number(startHour);
    const end = Number(endHour);

    const conflict = schedules.find((s) => {
      if (excludeScheduleId && s.id === excludeScheduleId) return false;
      if (s.machineId !== machineId) return false;
      if (s.scheduleDate !== scheduleDate) return false;

      const sStart = Number(s.startHour);
      const sEnd = Number(s.endHour);

      // Overlap condition: start < sEnd and end > sStart
      return (start < sEnd && end > sStart);
    });

    return conflict || null;
  };

  const addSchedule = (schData) => {
    const conflict = checkScheduleConflict(schData.machineId, schData.scheduleDate, schData.startHour, schData.endHour);
    if (conflict) {
      addToast(`SCHEDULING CONFLICT DETECTED: Machine is already booked by order ${conflict.orderNumber} between ${conflict.startHour}:00 - ${conflict.endHour}:00 on ${schData.scheduleDate}!`, 'error', 6000);
      return { success: false, conflict };
    }

    const id = `SCH-${String(schedules.length + 1).padStart(3, '0')}`;
    const newSchedule = {
      ...schData,
      id,
      allocatedHours: Number(schData.endHour) - Number(schData.startHour),
      status: 'SCHEDULED'
    };
    setSchedules((prev) => [...prev, newSchedule]);
    logAudit('Production Scheduling', 'CREATE', `Scheduled production slot on ${newSchedule.machineName} for ${newSchedule.orderNumber}`, id);
    addToast(`Schedule block assigned without conflict.`);
    return { success: true, schedule: newSchedule };
  };

  const deleteSchedule = (id) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    logAudit('Production Scheduling', 'DELETE', `Cancelled schedule block ${id}`, id);
    addToast('Schedule slot cleared.', 'info');
  };

  // ----------------------------------------------------
  // PRODUCTION EXECUTION (RUN-CARDS)
  // ----------------------------------------------------
  const updateExecutionProgress = (runId, completedQty, scrapQty, notes = '') => {
    const completed = Number(completedQty);
    const scrap = Number(scrapQty);

    setExecutionRuns((prev) => prev.map((run) => {
      if (run.id !== runId) return run;
      const progressPercent = Math.min(100, Math.round(((completed + scrap) / run.targetQuantity) * 100));
      const status = progressPercent >= 100 ? 'Completed' : 'In-Progress';

      // Also update linked production order progress
      setProductionOrders((poList) => poList.map((po) => {
        if (po.id === run.productionOrderId) {
          const scrapRate = completed + scrap > 0 ? Number(((scrap / (completed + scrap)) * 100).toFixed(1)) : 0;
          return {
            ...po,
            progressPercent,
            scrapRatePercent: scrapRate,
            status: progressPercent >= 100 ? 'Inspection' : 'In-Progress'
          };
        }
        return po;
      }));

      return {
        ...run,
        completedQuantity: completed,
        scrapQuantity: scrap,
        progressPercent,
        status,
        notes: notes || run.notes
      };
    }));

    logAudit('Production Execution', 'UPDATE', `Logged floor progress on run ${runId}: ${completed} finished, ${scrap} scrap.`, runId);
    addToast(`Floor run-card progress updated to ${Math.round(((completed + scrap) / 100) * 100)}%.`);
  };

  // ----------------------------------------------------
  // QUALITY INSPECTION (STRICT ENFORCEMENT: inspected = accepted + rejected)
  // ----------------------------------------------------
  const logQualityInspection = (inspectionData) => {
    const inspected = Number(inspectionData.inspectedQuantity || 0);
    const accepted = Number(inspectionData.acceptedQuantity || 0);
    const rejected = Number(inspectionData.rejectedQuantity || 0);

    // Strict validation requirement
    if (inspected !== (accepted + rejected)) {
      addToast(`STRICT VALIDATION FAILED: Inspected Quantity (${inspected}) must exactly equal Accepted Quantity (${accepted}) + Rejected Quantity (${rejected})!`, 'error', 6000);
      return { success: false, error: 'Validation failed: Inspected != Accepted + Rejected' };
    }

    const id = `QI-2026-${String(qualityInspections.length + 1).padStart(3, '0')}`;
    const passRate = inspected > 0 ? Number(((accepted / inspected) * 100).toFixed(1)) : 100;
    const status = rejected === 0 ? 'PASS' : (passRate >= 90 ? 'PASS' : 'FAIL');

    const newQI = {
      ...inspectionData,
      id,
      inspectionNumber: id,
      inspectedQuantity: inspected,
      acceptedQuantity: accepted,
      rejectedQuantity: rejected,
      passRatePercent: passRate,
      status,
      inspectionDate: inspectionData.inspectionDate || new Date().toISOString().split('T')[0],
      inspectorName: inspectionData.inspectorName || currentUser.name
    };

    setQualityInspections((prev) => [newQI, ...prev]);

    // Automatically generate Finished Goods receipt for accepted units!
    const po = productionOrders.find(p => p.id === newQI.productionOrderId);
    if (po && accepted > 0) {
      receiveFinishedGoods({
        productionOrderId: po.id,
        orderNumber: po.orderNumber,
        productId: po.productId,
        productName: po.productName,
        quantityReceived: accepted,
        uom: po.uom,
        qualityCertNumber: `QC-${id}`
      });
    }

    // Mark Production Order as Completed if fully inspected
    if (po) {
      updateProductionOrderStatus(po.id, 'Completed');
    }

    logAudit('Quality Inspection', 'CREATE', `Logged inspection ${id} for PO ${newQI.orderNumber}: ${accepted} Accepted, ${rejected} Rejected (${passRate}% Pass Rate).`, id);
    addToast(`Quality Inspection ${id} logged. ${accepted} units cleared for Finished Goods warehouse.`);
    return { success: true, inspection: newQI };
  };

  // ----------------------------------------------------
  // MATERIAL CONSUMPTION (STRICTLY BLOCKS CONSUMPTION > AVAILABLE STOCK)
  // ----------------------------------------------------
  const logMaterialConsumption = (consumptionData) => {
    const requestedQty = Number(consumptionData.actualQuantity || 0);
    const materialId = consumptionData.materialId;
    const warehouseId = consumptionData.warehouseId || 'WH-01';

    // Find stock item
    const stockItem = inventory.find(i => i.materialId === materialId && i.warehouseId === warehouseId);
    const availableStock = stockItem?.available || 0;

    // Strict validation requirement: block consumption exceeding available stock
    if (requestedQty > availableStock) {
      addToast(`CONSUMPTION BLOCKED: Requested quantity (${requestedQty} ${stockItem?.uom || ''}) strictly exceeds currently available inventory balance (${availableStock} ${stockItem?.uom || ''}) in warehouse ${warehouseId}!`, 'error', 7000);
      return { success: false, error: 'Consumption exceeds available stock' };
    }

    const id = `CNS-${String(materialConsumption.length + 1).padStart(3, '0')}`;
    const planned = Number(consumptionData.plannedQuantity || requestedQty);
    const variance = Number((requestedQty - planned).toFixed(2));
    const unitCost = stockItem?.unitCost || 10;
    const totalCost = Number((requestedQty * unitCost).toFixed(2));

    const newLog = {
      ...consumptionData,
      id,
      plannedQuantity: planned,
      actualQuantity: requestedQty,
      variance,
      uom: stockItem?.uom || 'units',
      unitCost,
      totalCost,
      loggedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'POSTED'
    };

    setMaterialConsumption((prev) => [newLog, ...prev]);

    // Deduct from inventory on-hand & available
    setInventory((prev) => prev.map((item) => {
      if (item.materialId === materialId && item.warehouseId === warehouseId) {
        const newOnHand = Math.max(0, item.onHand - requestedQty);
        const newAvail = Math.max(0, item.available - requestedQty);
        return {
          ...item,
          onHand: newOnHand,
          available: newAvail,
          totalValuation: Number((newOnHand * item.unitCost).toFixed(2)),
          status: newAvail <= 0 ? 'OUT_OF_STOCK' : (newAvail <= 50 ? 'LOW_STOCK' : 'IN_STOCK')
        };
      }
      return item;
    }));

    logAudit('Material Consumption', 'CREATE', `Issued & consumed ${requestedQty} ${stockItem?.uom} of ${stockItem?.materialCode} for PO ${consumptionData.orderNumber}`, id);
    addToast(`Material issue ${id} posted. Inventory balance reduced by ${requestedQty} ${stockItem?.uom}.`);
    return { success: true, log: newLog };
  };

  // ----------------------------------------------------
  // FINISHED GOODS WAREHOUSE RECEIPTS
  // ----------------------------------------------------
  const receiveFinishedGoods = (receiptData) => {
    const id = `FG-${String(finishedGoods.length + 1).padStart(3, '0')}`;
    const product = products.find(p => p.id === receiptData.productId);
    const unitCost = product?.unitCost || 650;
    const qty = Number(receiptData.quantityReceived || 0);

    const newReceipt = {
      id,
      receiptNumber: `FGR-2026-${String(finishedGoods.length + 1).padStart(3, '0')}`,
      productionOrderId: receiptData.productionOrderId,
      orderNumber: receiptData.orderNumber,
      productId: receiptData.productId,
      productCode: product?.sku || 'SKU-EBIKE',
      productName: receiptData.productName || product?.name,
      quantityReceived: qty,
      uom: receiptData.uom || 'units',
      warehouseId: 'WH-03',
      warehouseName: 'Finished Goods Logistics Center',
      binLocation: 'BAY-FG-01',
      unitCost,
      totalValuation: Number((qty * unitCost).toFixed(2)),
      qualityCertNumber: receiptData.qualityCertNumber || `QC-VAL-${Date.now().toString().slice(-4)}`,
      receivedDate: new Date().toISOString().split('T')[0],
      dispatchedQuantity: 0,
      availableBalance: qty
    };

    setFinishedGoods((prev) => [newReceipt, ...prev]);
    logAudit('Finished Goods', 'CREATE', `Received ${qty} accepted finished units of ${newReceipt.productName} into WH-03 Finished Goods Hub`, id);
    return newReceipt;
  };

  const dispatchFinishedGoods = (fgId, dispatchQty) => {
    const qty = Number(dispatchQty);
    const item = finishedGoods.find(fg => fg.id === fgId);
    if (!item || item.availableBalance < qty) {
      addToast('Dispatch blocked: Not enough available finished goods balance.', 'error');
      return false;
    }

    setFinishedGoods((prev) => prev.map((fg) => {
      if (fg.id !== fgId) return fg;
      const newDispatched = fg.dispatchedQuantity + qty;
      const newBalance = fg.availableBalance - qty;
      return {
        ...fg,
        dispatchedQuantity: newDispatched,
        availableBalance: newBalance
      };
    }));

    logAudit('Finished Goods', 'UPDATE', `Dispatched ${qty} ${item.uom} of ${item.productName} for shipping`, fgId);
    addToast(`Dispatched ${qty} units of finished product.`);
    return true;
  };

  // ----------------------------------------------------
  // MRP CALCULATION ENGINE
  // ----------------------------------------------------
  const calculateMRP = useCallback(() => {
    // Gross requirements from active demand / active production orders
    const materialRequirements = {};

    // Map each material ID to initial accumulator
    rawMaterials.forEach((rm) => {
      // Current inventory in WH-01
      const inv = inventory.find(i => i.materialId === rm.id && i.warehouseId === 'WH-01');
      const onHand = inv ? inv.onHand : 0;
      const reserved = inv ? inv.reserved : 0;
      const available = inv ? inv.available : 0;

      materialRequirements[rm.id] = {
        materialId: rm.id,
        materialCode: rm.code,
        materialName: rm.name,
        category: rm.category,
        uom: rm.uom,
        unitCost: rm.unitCost,
        safetyStock: rm.safetyStock,
        leadTimeDays: rm.leadTimeDays,
        defaultSupplierId: rm.defaultSupplierId,
        onHand,
        reserved,
        available,
        grossDemand: 0,
        netRequirement: 0,
        shortageQuantity: 0,
        status: 'OK',
        contributingOrders: []
      };
    });

    // Evaluate active demand orders (PENDING_PLANNING or IN_PRODUCTION)
    demandOrders.forEach((demand) => {
      if (demand.status === 'COMPLETED') return;
      const bom = boms.find(b => b.productId === demand.productId);
      if (!bom) return;

      const scrapFactor = 1 + (Number(bom.scrapAllowancePercent || 0) / 100);

      (bom.items || []).forEach((item) => {
        if (!materialRequirements[item.materialId]) return;

        const needed = Number(item.quantityPerUnit) * demand.quantity * scrapFactor;
        materialRequirements[item.materialId].grossDemand += needed;
        materialRequirements[item.materialId].contributingOrders.push({
          orderNumber: demand.orderNumber,
          customer: demand.customerName,
          quantity: demand.quantity,
          product: demand.productName
        });
      });
    });

    // Also factor active production orders not yet completed
    productionOrders.forEach((po) => {
      if (po.status === 'Completed' || po.status === 'Draft') return;
      const bom = boms.find(b => b.productId === po.productId);
      if (!bom) return;

      const scrapFactor = 1 + (Number(bom.scrapAllowancePercent || 0) / 100);

      (bom.items || []).forEach((item) => {
        if (!materialRequirements[item.materialId]) return;
        const needed = Number(item.quantityPerUnit) * po.batchQuantity * scrapFactor;
        // avoid double counting if linked to demand order
        if (!po.demandOrderId) {
          materialRequirements[item.materialId].grossDemand += needed;
        }
      });
    });

    // Calculate Net Requirement = (Gross Demand + Safety Stock) - On-Hand
    const mrpResults = Object.values(materialRequirements).map((mr) => {
      const gross = Number(mr.grossDemand.toFixed(1));
      const requiredBuffer = gross + mr.safetyStock;
      const net = Math.max(0, Number((requiredBuffer - mr.onHand).toFixed(1)));
      const shortage = Math.max(0, Number((gross - mr.available).toFixed(1)));

      let status = 'BALANCED';
      if (shortage > 0) {
        status = 'CRITICAL_SHORTAGE';
      } else if (net > 0 || mr.available <= mr.safetyStock) {
        status = 'REORDER_RECOMMENDED';
      }

      return {
        ...mr,
        grossDemand: gross,
        netRequirement: net,
        shortageQuantity: shortage,
        status
      };
    });

    return mrpResults;
  }, [rawMaterials, inventory, demandOrders, productionOrders, boms]);

  // One-click MRP Auto-Requisition Simulation
  const simulateAutoRequisition = useCallback((materialId, quantityToReplenish) => {
    const qty = Number(quantityToReplenish);
    const rawMat = rawMaterials.find(r => r.id === materialId);
    if (!rawMat || qty <= 0) return;

    // Simulate supplier PO receipt into WH-01
    setInventory((prev) => prev.map((item) => {
      if (item.materialId === materialId && item.warehouseId === 'WH-01') {
        const newOnHand = item.onHand + qty;
        const newAvail = item.available + qty;
        return {
          ...item,
          onHand: newOnHand,
          available: newAvail,
          totalValuation: Number((newOnHand * item.unitCost).toFixed(2)),
          status: 'IN_STOCK'
        };
      }
      return item;
    }));

    logAudit('Material Requirements Planning (MRP)', 'CREATE', `Simulated expedited PO requisition of ${qty} ${rawMat.uom} for ${rawMat.name}. Stock replenished in WH-01.`, materialId);
    addToast(`Requisition order confirmed: +${qty} ${rawMat.uom} received into warehouse WH-01.`);
  }, [rawMaterials, logAudit, addToast]);

  // ----------------------------------------------------
  // USER MANAGEMENT
  // ----------------------------------------------------
  const addUser = async (userData) => {
    const id = `usr-${Date.now().toString().slice(-4)}`;
    const newUser = {
      ...userData,
      name: userData.fullName || userData.name,
      fullName: userData.fullName || userData.name,
      id: userData.id || id,
      status: userData.isActive !== false ? 'ACTIVE' : 'INACTIVE',
      lastActive: 'Just registered'
    };
    try {
      if (isBackendConnected) {
        const payload = {
          email: userData.email,
          full_name: userData.fullName || userData.name,
          password: userData.password || 'NexFlow@123',
          role: userData.role,
          department: userData.department,
          department_id: userData.departmentId || null,
          job_title: userData.jobTitle || 'Staff Officer',
          is_active: true
        };
        const created = await usersService.create(payload);
        if (created && created.id) {
          newUser.id = created.id;
          newUser.name = created.fullName || created.name || newUser.name;
          newUser.fullName = created.fullName || created.name || newUser.fullName;
          newUser.jobTitle = created.jobTitle || newUser.jobTitle;
          newUser.department = created.department || newUser.department;
        }
      }
    } catch (err) {
      console.warn('[ERPContext] addUser live backend call failed, saving to local cache.', err?.message);
    }
    setUsers((prev) => [...prev, newUser]);
    logAudit('User Management', 'CREATE', `Provisioned new user account for ${newUser.name} (${newUser.role})`, String(newUser.id));
    addToast(`User ${newUser.name} registered.`);
    return newUser;
  };

  const updateUser = async (id, updatedFields) => {
    try {
      if (isBackendConnected && typeof id === 'number') {
        const payload = {
          full_name: updatedFields.fullName || updatedFields.name,
          role: updatedFields.role,
          department: updatedFields.department,
          department_id: updatedFields.departmentId,
          job_title: updatedFields.jobTitle,
          is_active: updatedFields.status !== 'INACTIVE'
        };
        if (updatedFields.password) {
          payload.password = updatedFields.password;
        }
        await usersService.update(id, payload);
      }
    } catch (err) {
      console.warn('[ERPContext] updateUser live backend call failed:', err?.message);
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updatedFields } : u)));
    logAudit('User Management', 'UPDATE', `Updated user credentials / permissions for ${id}`, String(id));
    addToast('User profile updated.');
  };

  const deleteUser = async (id) => {
    try {
      if (isBackendConnected && typeof id === 'number') {
        await usersService.delete(id);
      }
    } catch (err) {
      console.warn('[ERPContext] deleteUser live backend call failed:', err?.message);
      addToast(err?.response?.data?.detail || 'Failed to remove user account.', 'error');
      throw err;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAudit('User Management', 'DELETE', `Removed user account ${id}`, String(id));
    addToast('User account successfully removed.');
  };

  const toggleUserStatus = (id) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      logAudit('User Management', 'UPDATE', `Changed status of user ${u.name} to ${nextStatus}`, id);
      return { ...u, status: nextStatus };
    }));
    addToast('User active status toggled.');
  };

  return (
    <ERPContext.Provider
      value={{
        // Data Collections
        products,
        rawMaterials,
        boms,
        suppliers,
        warehouses,
        inventory,
        demandOrders,
        productionOrders,
        workCenters,
        machines,
        shifts,
        schedules,
        executionRuns,
        qualityInspections,
        materialConsumption,
        finishedGoods,
        auditLogs,
        users,

        // Products
        addProduct,
        updateProduct,
        deleteProduct,

        // Raw Materials
        addRawMaterial,
        updateRawMaterial,
        deleteRawMaterial,

        // BOM
        addBOM,
        updateBOM,
        deleteBOM,

        // Suppliers
        addSupplier,
        updateSupplier,
        deleteSupplier,

        // Inventory
        adjustStock,
        transferStock,

        // Demand Orders
        addDemandOrder,
        updateDemandOrder,
        deleteDemandOrder,
        convertDemandToProductionOrder,

        // Production Orders
        addProductionOrder,
        updateProductionOrder,
        updateProductionOrderStatus,
        deleteProductionOrder,

        // Work Centers & Machines
        addWorkCenter,
        updateWorkCenter,
        addMachine,
        updateMachine,

        // Shifts & Calendar
        addShift,
        updateShift,

        // Scheduling
        addSchedule,
        deleteSchedule,
        checkScheduleConflict,

        // Execution
        updateExecutionProgress,

        // Quality
        logQualityInspection,

        // Consumption
        logMaterialConsumption,

        // Finished Goods
        receiveFinishedGoods,
        dispatchFinishedGoods,

        // MRP
        calculateMRP,
        simulateAutoRequisition,

        // User Management
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,

        // Audit & System
        logAudit,
        resetDatabase,

        // Live Backend Integration
        isBackendConnected,
        isSyncing,
        syncWithBackend
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export default ERPProvider;

