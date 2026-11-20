// Comprehensive Manufacturing ERP Seed Data (SI / Metric Units Only)
// Domain: Precision Electric Commuter Bicycles & Light Electric Vehicles

export const INITIAL_PRODUCTS = [
  {
    id: 'PRD-001',
    sku: 'EBIKE-URB-250',
    name: 'EcoRide Urban Commuter 250W',
    category: 'Commuter E-Bikes',
    revision: 'Rev C.2',
    unitCost: 642.50,
    sellingPrice: 1299.00,
    uom: 'units',
    weightKg: 19.8,
    leadTimeDays: 7,
    status: 'ACTIVE',
    description: 'Lightweight urban electric bicycle with integrated 36V battery and pedal-assist cadence sensor.',
    specifications: {
      frameMaterial: 'Aluminum 6061-T6',
      motorPowerWatts: 250,
      batteryCapacityWh: 400,
      maxRangeKm: 75,
      maxSpeedKmh: 25
    }
  },
  {
    id: 'PRD-002',
    sku: 'EBIKE-TRL-500',
    name: 'VoltSport Cross-Trail 500W',
    category: 'All-Terrain E-Bikes',
    revision: 'Rev B.1',
    unitCost: 885.00,
    sellingPrice: 1799.00,
    uom: 'units',
    weightKg: 22.4,
    leadTimeDays: 10,
    status: 'ACTIVE',
    description: 'Rugged suspension e-bike with 48V mid-drive motor, hydraulic quad-piston brakes, and high-traction tires.',
    specifications: {
      frameMaterial: 'Aluminum 6061 Hydroformed',
      motorPowerWatts: 500,
      batteryCapacityWh: 624,
      maxRangeKm: 90,
      maxSpeedKmh: 32
    }
  },
  {
    id: 'PRD-003',
    sku: 'EBIKE-CRG-750',
    name: 'CargoHaul Heavy-Duty 750W',
    category: 'Commercial Cargo',
    revision: 'Rev A.4',
    unitCost: 1140.00,
    sellingPrice: 2450.00,
    uom: 'units',
    weightKg: 29.5,
    leadTimeDays: 14,
    status: 'ACTIVE',
    description: 'Long-tail commercial delivery e-bike with dual battery rack and 150 kg payload capacity.',
    specifications: {
      frameMaterial: 'Reinforced Chromoly / Alum 6061',
      motorPowerWatts: 750,
      batteryCapacityWh: 960,
      maxRangeKm: 120,
      maxSpeedKmh: 25
    }
  }
];

export const INITIAL_RAW_MATERIALS = [
  {
    id: 'MAT-101',
    code: 'RM-ALU-6061',
    name: 'Aluminum 6061-T6 Extruded Tubing',
    category: 'Metals & Frames',
    uom: 'kg',
    unitCost: 6.80,
    safetyStock: 350,
    reorderLevel: 500,
    leadTimeDays: 12,
    defaultSupplierId: 'SUP-001',
    storageCondition: 'Dry Indoor Racks',
    notes: 'Standard structural tubing for frame geometry.'
  },
  {
    id: 'MAT-102',
    code: 'RM-BAT-21700',
    name: 'Lithium Li-Ion 21700 Cell Module (48V 14Ah)',
    category: 'Electrical & Power',
    uom: 'units',
    unitCost: 185.00,
    safetyStock: 80,
    reorderLevel: 120,
    leadTimeDays: 20,
    defaultSupplierId: 'SUP-002',
    storageCondition: 'Climate Controlled (18-22°C)',
    notes: 'UN 38.3 certified high-density battery pack.'
  },
  {
    id: 'MAT-103',
    code: 'RM-MOT-HUB250',
    name: 'Brushless Geared Hub Motor (250W 36V)',
    category: 'Powertrain',
    uom: 'units',
    unitCost: 92.00,
    safetyStock: 60,
    reorderLevel: 90,
    leadTimeDays: 15,
    defaultSupplierId: 'SUP-003',
    storageCondition: 'Moisture Sealed',
    notes: 'Low-noise rear hub drive with integrated spline.'
  },
  {
    id: 'MAT-104',
    code: 'RM-MOT-MID500',
    name: 'Mid-Drive Torque Motor (500W 48V)',
    category: 'Powertrain',
    uom: 'units',
    unitCost: 175.00,
    safetyStock: 40,
    reorderLevel: 60,
    leadTimeDays: 18,
    defaultSupplierId: 'SUP-003',
    storageCondition: 'Moisture Sealed',
    notes: 'High torque 95Nm mid-axis motor unit.'
  },
  {
    id: 'MAT-105',
    code: 'RM-BRK-HYD',
    name: 'Hydraulic Disc Brake Assembly (Front & Rear)',
    category: 'Braking Systems',
    uom: 'units',
    unitCost: 48.50,
    safetyStock: 100,
    reorderLevel: 150,
    leadTimeDays: 10,
    defaultSupplierId: 'SUP-004',
    storageCondition: 'Standard Racks',
    notes: 'Dual piston hydraulic calipers with 180mm stainless steel rotors.'
  },
  {
    id: 'MAT-106',
    code: 'RM-GRS-7SPD',
    name: '7-Speed Shimano Transmission Drivetrain',
    category: 'Transmission',
    uom: 'units',
    unitCost: 38.00,
    safetyStock: 75,
    reorderLevel: 110,
    leadTimeDays: 10,
    defaultSupplierId: 'SUP-004',
    storageCondition: 'Standard Racks',
    notes: 'Rear derailleur, index shifter, and 14-28T freewheel.'
  },
  {
    id: 'MAT-107',
    code: 'RM-TIR-275',
    name: 'Puncture-Resistant Kenda Tire 27.5 x 2.1',
    category: 'Wheels & Rubber',
    uom: 'units',
    unitCost: 14.50,
    safetyStock: 150,
    reorderLevel: 220,
    leadTimeDays: 8,
    defaultSupplierId: 'SUP-005',
    storageCondition: 'Dry Store, UV protected',
    notes: 'Kevlar reinforced commuter tire tread.'
  },
  {
    id: 'MAT-108',
    code: 'RM-TUB-275',
    name: 'Reinforced Butyl Inner Tube 27.5"',
    category: 'Wheels & Rubber',
    uom: 'units',
    unitCost: 3.20,
    safetyStock: 200,
    reorderLevel: 300,
    leadTimeDays: 6,
    defaultSupplierId: 'SUP-005',
    storageCondition: 'Dry Store',
    notes: 'Schrader valve 48mm.'
  },
  {
    id: 'MAT-109',
    code: 'RM-DSP-LCD',
    name: 'Smart Color TFT LCD Display & Thumb Remote',
    category: 'Electrical & Power',
    uom: 'units',
    unitCost: 34.00,
    safetyStock: 90,
    reorderLevel: 130,
    leadTimeDays: 14,
    defaultSupplierId: 'SUP-002',
    storageCondition: 'Electrostatic Protected Area',
    notes: 'CAN-bus compatible IP66 waterproof screen.'
  },
  {
    id: 'MAT-110',
    code: 'RM-CTR-48V',
    name: 'Sine-Wave Intelligent Motor Controller',
    category: 'Electrical & Power',
    uom: 'units',
    unitCost: 42.00,
    safetyStock: 70,
    reorderLevel: 100,
    leadTimeDays: 14,
    defaultSupplierId: 'SUP-002',
    storageCondition: 'ESD Bin Storage',
    notes: '15A continuous current controller in aluminum heat sink.'
  },
  {
    id: 'MAT-111',
    code: 'RM-WRG-HARN',
    name: 'Molded Waterproof Wiring Harness',
    category: 'Electrical & Power',
    uom: 'meters',
    unitCost: 4.80,
    safetyStock: 300,
    reorderLevel: 450,
    leadTimeDays: 9,
    defaultSupplierId: 'SUP-002',
    storageCondition: 'Dry Racks',
    notes: 'Julet connector harnesses.'
  },
  {
    id: 'MAT-112',
    code: 'RM-PNT-BLK',
    name: 'Electrostatic Polyester Powder Coat - Matte Black',
    category: 'Coatings & Chemicals',
    uom: 'kg',
    unitCost: 11.20,
    safetyStock: 120,
    reorderLevel: 180,
    leadTimeDays: 7,
    defaultSupplierId: 'SUP-006',
    storageCondition: 'Sealed Drum, < 25°C',
    notes: 'Scratch-resistant industrial grade powder coating.'
  },
  {
    id: 'MAT-113',
    code: 'RM-FST-KIT',
    name: 'Precision Stainless Steel Fastener Kit (M5/M6)',
    category: 'Hardware',
    uom: 'units',
    unitCost: 7.50,
    safetyStock: 250,
    reorderLevel: 350,
    leadTimeDays: 5,
    defaultSupplierId: 'SUP-007',
    storageCondition: 'Standard Hardware Bins',
    notes: 'A2-70 grade stainless bolts, nylon locknuts, and washers.'
  },
  {
    id: 'MAT-114',
    code: 'RM-CHN-E7',
    name: 'Rust-Proof E-Bike Drive Chain (KMC)',
    category: 'Transmission',
    uom: 'meters',
    unitCost: 6.20,
    safetyStock: 150,
    reorderLevel: 220,
    leadTimeDays: 8,
    defaultSupplierId: 'SUP-004',
    storageCondition: 'Oiled Packaging',
    notes: 'High tensile strength reinforced link chain.'
  }
];

export const INITIAL_BOMS = [
  {
    id: 'BOM-001',
    productId: 'PRD-001',
    productName: 'EcoRide Urban Commuter 250W',
    bomCode: 'BOM-EBIKE-URB-REV2',
    version: '2.0',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01',
    scrapAllowancePercent: 3.5, // 3.5% scrap allowance
    totalCalculatedCost: 642.50,
    items: [
      { id: 'bi-1', materialId: 'MAT-101', quantityPerUnit: 6.2, uom: 'kg', unitCost: 6.80, subtotal: 42.16 },
      { id: 'bi-2', materialId: 'MAT-102', quantityPerUnit: 1.0, uom: 'units', unitCost: 185.00, subtotal: 185.00 },
      { id: 'bi-3', materialId: 'MAT-103', quantityPerUnit: 1.0, uom: 'units', unitCost: 92.00, subtotal: 92.00 },
      { id: 'bi-4', materialId: 'MAT-105', quantityPerUnit: 1.0, uom: 'units', unitCost: 48.50, subtotal: 48.50 },
      { id: 'bi-5', materialId: 'MAT-106', quantityPerUnit: 1.0, uom: 'units', unitCost: 38.00, subtotal: 38.00 },
      { id: 'bi-6', materialId: 'MAT-107', quantityPerUnit: 2.0, uom: 'units', unitCost: 14.50, subtotal: 29.00 },
      { id: 'bi-7', materialId: 'MAT-108', quantityPerUnit: 2.0, uom: 'units', unitCost: 3.20, subtotal: 6.40 },
      { id: 'bi-8', materialId: 'MAT-109', quantityPerUnit: 1.0, uom: 'units', unitCost: 34.00, subtotal: 34.00 },
      { id: 'bi-9', materialId: 'MAT-110', quantityPerUnit: 1.0, uom: 'units', unitCost: 42.00, subtotal: 42.00 },
      { id: 'bi-10', materialId: 'MAT-111', quantityPerUnit: 3.5, uom: 'meters', unitCost: 4.80, subtotal: 16.80 },
      { id: 'bi-11', materialId: 'MAT-112', quantityPerUnit: 1.4, uom: 'kg', unitCost: 11.20, subtotal: 15.68 },
      { id: 'bi-12', materialId: 'MAT-113', quantityPerUnit: 1.0, uom: 'units', unitCost: 7.50, subtotal: 7.50 },
      { id: 'bi-13', materialId: 'MAT-114', quantityPerUnit: 1.5, uom: 'meters', unitCost: 6.20, subtotal: 9.30 }
    ]
  },
  {
    id: 'BOM-002',
    productId: 'PRD-002',
    productName: 'VoltSport Cross-Trail 500W',
    bomCode: 'BOM-EBIKE-TRL-REV1',
    version: '1.2',
    status: 'ACTIVE',
    effectiveDate: '2026-02-15',
    scrapAllowancePercent: 4.0,
    totalCalculatedCost: 885.00,
    items: [
      { id: 'bi-21', materialId: 'MAT-101', quantityPerUnit: 7.5, uom: 'kg', unitCost: 6.80, subtotal: 51.00 },
      { id: 'bi-22', materialId: 'MAT-102', quantityPerUnit: 1.0, uom: 'units', unitCost: 185.00, subtotal: 185.00 },
      { id: 'bi-23', materialId: 'MAT-104', quantityPerUnit: 1.0, uom: 'units', unitCost: 175.00, subtotal: 175.00 },
      { id: 'bi-24', materialId: 'MAT-105', quantityPerUnit: 1.0, uom: 'units', unitCost: 48.50, subtotal: 48.50 },
      { id: 'bi-25', materialId: 'MAT-106', quantityPerUnit: 1.0, uom: 'units', unitCost: 38.00, subtotal: 38.00 },
      { id: 'bi-26', materialId: 'MAT-107', quantityPerUnit: 2.0, uom: 'units', unitCost: 14.50, subtotal: 29.00 },
      { id: 'bi-27', materialId: 'MAT-108', quantityPerUnit: 2.0, uom: 'units', unitCost: 3.20, subtotal: 6.40 },
      { id: 'bi-28', materialId: 'MAT-109', quantityPerUnit: 1.0, uom: 'units', unitCost: 34.00, subtotal: 34.00 },
      { id: 'bi-29', materialId: 'MAT-110', quantityPerUnit: 1.0, uom: 'units', unitCost: 42.00, subtotal: 42.00 },
      { id: 'bi-30', materialId: 'MAT-111', quantityPerUnit: 4.0, uom: 'meters', unitCost: 4.80, subtotal: 19.20 },
      { id: 'bi-31', materialId: 'MAT-112', quantityPerUnit: 1.6, uom: 'kg', unitCost: 11.20, subtotal: 17.92 },
      { id: 'bi-32', materialId: 'MAT-113', quantityPerUnit: 1.0, uom: 'units', unitCost: 7.50, subtotal: 7.50 },
      { id: 'bi-33', materialId: 'MAT-114', quantityPerUnit: 1.6, uom: 'meters', unitCost: 6.20, subtotal: 9.92 }
    ]
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'SUP-001',
    code: 'VEND-ALUMAX',
    name: 'AluMax Precision Extrusions GmbH',
    country: 'Germany',
    city: 'Stuttgart',
    contactPerson: 'Klaus Lindner',
    email: 'k.lindner@alumax-extrusions.de',
    phone: '+49 711 889201',
    rating: 4.9, // 1 to 5
    leadTimeDays: 12,
    qualityPassRate: 99.4,
    linkedCategories: ['Metals & Frames'],
    paymentTerms: 'Net 30'
  },
  {
    id: 'SUP-002',
    code: 'VEND-VOLTCELL',
    name: 'VoltCell Power Dynamics BV',
    country: 'Netherlands',
    city: 'Eindhoven',
    contactPerson: 'Sophie Van Der Meer',
    email: 'sophie@voltcell-power.nl',
    phone: '+31 40 293811',
    rating: 4.8,
    leadTimeDays: 18,
    qualityPassRate: 98.7,
    linkedCategories: ['Electrical & Power'],
    paymentTerms: 'Net 45'
  },
  {
    id: 'SUP-003',
    code: 'VEND-TORQUETECH',
    name: 'TorqueTech Electric Motors Spa',
    country: 'Italy',
    city: 'Bologna',
    contactPerson: 'Marco Rossi',
    email: 'm.rossi@torquetech-motors.it',
    phone: '+39 051 442901',
    rating: 4.7,
    leadTimeDays: 16,
    qualityPassRate: 97.9,
    linkedCategories: ['Powertrain'],
    paymentTerms: 'Net 30'
  },
  {
    id: 'SUP-004',
    code: 'VEND-VELODRIVE',
    name: 'VeloDrive Component Systems SA',
    country: 'France',
    city: 'Lyon',
    contactPerson: 'Antoine Dupont',
    email: 'adupont@velodrive-sys.fr',
    phone: '+33 4 72 38 19 00',
    rating: 4.6,
    leadTimeDays: 10,
    qualityPassRate: 98.2,
    linkedCategories: ['Braking Systems', 'Transmission'],
    paymentTerms: 'Net 30'
  },
  {
    id: 'SUP-005',
    code: 'VEND-AEROTIRE',
    name: 'AeroTire Rubber & Polymers Ltd',
    country: 'United Kingdom',
    city: 'Birmingham',
    contactPerson: 'David Miller',
    email: 'dmiller@aerotire.co.uk',
    phone: '+44 121 496 0192',
    rating: 4.5,
    leadTimeDays: 8,
    qualityPassRate: 99.1,
    linkedCategories: ['Wheels & Rubber'],
    paymentTerms: 'Net 15'
  },
  {
    id: 'SUP-006',
    code: 'VEND-NANOPOWDER',
    name: 'NanoPowder Surface Finishes SA',
    country: 'Switzerland',
    city: 'Basel',
    contactPerson: 'Beatrix Meyer',
    email: 'b.meyer@nanopowder.ch',
    phone: '+41 61 228 9010',
    rating: 4.9,
    leadTimeDays: 7,
    qualityPassRate: 99.8,
    linkedCategories: ['Coatings & Chemicals'],
    paymentTerms: 'Net 30'
  },
  {
    id: 'SUP-007',
    code: 'VEND-FASTENEX',
    name: 'Fastenex Precision Hardware Sp. z o.o.',
    country: 'Poland',
    city: 'Katowice',
    contactPerson: 'Jan Kowalski',
    email: 'j.kowalski@fastenex.pl',
    phone: '+48 32 770 1234',
    rating: 4.6,
    leadTimeDays: 5,
    qualityPassRate: 99.0,
    linkedCategories: ['Hardware'],
    paymentTerms: 'Net 30'
  }
];

export const INITIAL_WAREHOUSES = [
  { id: 'WH-01', name: 'Central Raw Material Depot', location: 'Building A, North Wing', type: 'RAW_MATERIALS' },
  { id: 'WH-02', name: 'Shop Floor Staging & WIP Buffer', location: 'Building B, Ground Floor', type: 'WIP_BUFFER' },
  { id: 'WH-03', name: 'Finished Goods Logistics Center', location: 'Building C, Bay 1-4', type: 'FINISHED_GOODS' }
];

export const INITIAL_INVENTORY = [
  {
    id: 'INV-101',
    materialId: 'MAT-101',
    materialCode: 'RM-ALU-6061',
    materialName: 'Aluminum 6061-T6 Extruded Tubing',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'RACK-A1-04',
    onHand: 850.0,
    reserved: 120.0,
    available: 730.0, // onHand - reserved
    uom: 'kg',
    unitCost: 6.80,
    totalValuation: 5780.00,
    lastCountDate: '2026-11-01',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-102',
    materialId: 'MAT-102',
    materialCode: 'RM-BAT-21700',
    materialName: 'Lithium Li-Ion 21700 Cell Module',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'CLIM-B2-01',
    onHand: 140.0,
    reserved: 50.0,
    available: 90.0,
    uom: 'units',
    unitCost: 185.00,
    totalValuation: 25900.00,
    lastCountDate: '2026-11-02',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-103',
    materialId: 'MAT-103',
    materialCode: 'RM-MOT-HUB250',
    materialName: 'Brushless Geared Hub Motor (250W)',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'BIN-M3-12',
    onHand: 110.0,
    reserved: 40.0,
    available: 70.0,
    uom: 'units',
    unitCost: 92.00,
    totalValuation: 10120.00,
    lastCountDate: '2026-11-03',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-104',
    materialId: 'MAT-104',
    materialCode: 'RM-MOT-MID500',
    materialName: 'Mid-Drive Torque Motor (500W)',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'BIN-M3-15',
    onHand: 35.0,
    reserved: 20.0,
    available: 15.0, // Below safety stock (40) -> SHORTAGE ALERT
    uom: 'units',
    unitCost: 175.00,
    totalValuation: 6125.00,
    lastCountDate: '2026-11-04',
    status: 'LOW_STOCK'
  },
  {
    id: 'INV-105',
    materialId: 'MAT-105',
    materialCode: 'RM-BRK-HYD',
    materialName: 'Hydraulic Disc Brake Assembly',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'RACK-D1-08',
    onHand: 180.0,
    reserved: 50.0,
    available: 130.0,
    uom: 'units',
    unitCost: 48.50,
    totalValuation: 8730.00,
    lastCountDate: '2026-11-01',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-106',
    materialId: 'MAT-106',
    materialCode: 'RM-GRS-7SPD',
    materialName: '7-Speed Shimano Transmission',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'RACK-D2-04',
    onHand: 95.0,
    reserved: 30.0,
    available: 65.0,
    uom: 'units',
    unitCost: 38.00,
    totalValuation: 3610.00,
    lastCountDate: '2026-11-02',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-107',
    materialId: 'MAT-107',
    materialCode: 'RM-TIR-275',
    materialName: 'Puncture-Resistant Kenda Tire 27.5"',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'BAY-T1-01',
    onHand: 320.0,
    reserved: 100.0,
    available: 220.0,
    uom: 'units',
    unitCost: 14.50,
    totalValuation: 4640.00,
    lastCountDate: '2026-11-05',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-108',
    materialId: 'MAT-108',
    materialCode: 'RM-TUB-275',
    materialName: 'Reinforced Butyl Inner Tube 27.5"',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'BIN-T2-09',
    onHand: 420.0,
    reserved: 100.0,
    available: 320.0,
    uom: 'units',
    unitCost: 3.20,
    totalValuation: 1344.00,
    lastCountDate: '2026-11-05',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-109',
    materialId: 'MAT-109',
    materialCode: 'RM-DSP-LCD',
    materialName: 'Smart Color TFT LCD Display',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'ESD-E1-04',
    onHand: 130.0,
    reserved: 40.0,
    available: 90.0,
    uom: 'units',
    unitCost: 34.00,
    totalValuation: 4420.00,
    lastCountDate: '2026-11-02',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-110',
    materialId: 'MAT-110',
    materialCode: 'RM-CTR-48V',
    materialName: 'Sine-Wave Intelligent Motor Controller',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'ESD-E2-02',
    onHand: 85.0,
    reserved: 30.0,
    available: 55.0, // Below safety stock (70)
    uom: 'units',
    unitCost: 42.00,
    totalValuation: 3570.00,
    lastCountDate: '2026-11-04',
    status: 'LOW_STOCK'
  },
  {
    id: 'INV-111',
    materialId: 'MAT-111',
    materialCode: 'RM-WRG-HARN',
    materialName: 'Molded Waterproof Wiring Harness',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'CAB-W1-01',
    onHand: 620.0,
    reserved: 180.0,
    available: 440.0,
    uom: 'meters',
    unitCost: 4.80,
    totalValuation: 2976.00,
    lastCountDate: '2026-11-03',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-112',
    materialId: 'MAT-112',
    materialCode: 'RM-PNT-BLK',
    materialName: 'Electrostatic Polyester Powder Coat',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'DRUM-P1-02',
    onHand: 240.0,
    reserved: 70.0,
    available: 170.0,
    uom: 'kg',
    unitCost: 11.20,
    totalValuation: 2688.00,
    lastCountDate: '2026-11-01',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-113',
    materialId: 'MAT-113',
    materialCode: 'RM-FST-KIT',
    materialName: 'Precision Stainless Steel Fastener Kit',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'BIN-F1-08',
    onHand: 480.0,
    reserved: 90.0,
    available: 390.0,
    uom: 'units',
    unitCost: 7.50,
    totalValuation: 3600.00,
    lastCountDate: '2026-11-04',
    status: 'IN_STOCK'
  },
  {
    id: 'INV-114',
    materialId: 'MAT-114',
    materialCode: 'RM-CHN-E7',
    materialName: 'Rust-Proof E-Bike Drive Chain',
    warehouseId: 'WH-01',
    warehouseName: 'Central Raw Material Depot',
    locationBin: 'RACK-C1-11',
    onHand: 280.0,
    reserved: 80.0,
    available: 200.0,
    uom: 'meters',
    unitCost: 6.20,
    totalValuation: 1736.00,
    lastCountDate: '2026-11-03',
    status: 'IN_STOCK'
  }
];

export const INITIAL_DEMAND_ORDERS = [
  {
    id: 'SO-2026-001',
    orderNumber: 'SO-2026-001',
    customerName: 'Nordic Velocity Mobility AS',
    customerType: 'Distributor',
    customerEmail: 'procurement@nordicvelocity.no',
    destination: 'Oslo Hub, Norway',
    productId: 'PRD-001',
    productName: 'EcoRide Urban Commuter 250W',
    quantity: 100,
    uom: 'units',
    orderDate: '2026-11-05',
    requestedDeliveryDate: '2026-11-28',
    priority: 'Urgent',
    status: 'PENDING_PLANNING', // PENDING_PLANNING, IN_PRODUCTION, COMPLETED
    totalValue: 129900.00,
    linkedProductionOrderId: null,
    notes: 'Primary end-to-end benchmark batch. Customer requested expedited dispatch.'
  },
  {
    id: 'SO-2026-002',
    orderNumber: 'SO-2026-002',
    customerName: 'Berlin Metro Fleet Services',
    customerType: 'Municipal Fleet',
    customerEmail: 'fleet@berlin-mobility.de',
    destination: 'Berlin Depot West, Germany',
    productId: 'PRD-001',
    productName: 'EcoRide Urban Commuter 250W',
    quantity: 60,
    uom: 'units',
    orderDate: '2026-11-06',
    requestedDeliveryDate: '2026-12-05',
    priority: 'Normal',
    status: 'IN_PRODUCTION',
    totalValue: 77940.00,
    linkedProductionOrderId: 'PO-2026-101',
    notes: 'Municipal micro-mobility replenishment.'
  },
  {
    id: 'SO-2026-003',
    orderNumber: 'SO-2026-003',
    customerName: 'Alpine Trails E-Sports AG',
    customerType: 'Retail Chain',
    customerEmail: 'orders@alpinetrails.ch',
    destination: 'Zurich Central, Switzerland',
    productId: 'PRD-002',
    productName: 'VoltSport Cross-Trail 500W',
    quantity: 40,
    uom: 'units',
    orderDate: '2026-11-07',
    requestedDeliveryDate: '2026-12-12',
    priority: 'Normal',
    status: 'IN_PRODUCTION',
    totalValue: 71960.00,
    linkedProductionOrderId: 'PO-2026-102',
    notes: 'Winter promotional inventory.'
  },
  {
    id: 'SO-2026-004',
    orderNumber: 'SO-2026-004',
    customerName: 'GreenLastMile Logistics SAS',
    customerType: 'Courier Fleet',
    customerEmail: 'dispatch@greenlastmile.fr',
    destination: 'Paris Distribution Bay 3',
    productId: 'PRD-003',
    productName: 'CargoHaul Heavy-Duty 750W',
    quantity: 25,
    uom: 'units',
    orderDate: '2026-11-08',
    requestedDeliveryDate: '2026-12-20',
    priority: 'Low',
    status: 'PENDING_PLANNING',
    totalValue: 61250.00,
    linkedProductionOrderId: null,
    notes: 'Equipped with commercial rear container rack.'
  }
];

export const INITIAL_PRODUCTION_ORDERS = [
  {
    id: 'PO-2026-101',
    orderNumber: 'PO-2026-101',
    demandOrderId: 'SO-2026-002',
    productId: 'PRD-001',
    productName: 'EcoRide Urban Commuter 250W',
    batchQuantity: 60,
    uom: 'units',
    priority: 'Normal',
    status: 'In-Progress', // Draft -> Released -> In-Progress -> Inspection -> Completed
    progressPercent: 65,
    workCenterId: 'WC-04',
    workCenterName: 'Final Mechanical Assembly Line',
    machineId: 'MC-05',
    machineName: 'Assembly Line Rig A',
    startDate: '2026-11-08',
    dueDate: '2026-11-20',
    actualStartDate: '2026-11-08',
    completedDate: null,
    scrapRatePercent: 1.5,
    operatorNotes: 'Frame and wiring complete. Final brake tuning underway.'
  },
  {
    id: 'PO-2026-102',
    orderNumber: 'PO-2026-102',
    demandOrderId: 'SO-2026-003',
    productId: 'PRD-002',
    productName: 'VoltSport Cross-Trail 500W',
    batchQuantity: 40,
    uom: 'units',
    priority: 'Normal',
    status: 'Released',
    progressPercent: 20,
    workCenterId: 'WC-01',
    workCenterName: 'Frame Fabrication & TIG Welding',
    machineId: 'MC-02',
    machineName: 'Robotic TIG Welder RW-02',
    startDate: '2026-11-10',
    dueDate: '2026-11-25',
    actualStartDate: '2026-11-10',
    completedDate: null,
    scrapRatePercent: 0.0,
    operatorNotes: 'Materials staged. CNC cut tubes delivered to jig.'
  },
  {
    id: 'PO-2026-103',
    orderNumber: 'PO-2026-103',
    demandOrderId: null,
    productId: 'PRD-001',
    productName: 'EcoRide Urban Commuter 250W',
    batchQuantity: 50,
    uom: 'units',
    priority: 'Normal',
    status: 'Inspection',
    progressPercent: 100,
    workCenterId: 'WC-05',
    workCenterName: 'QA Dyno Testing & Packaging',
    machineId: 'MC-06',
    machineName: 'Dyno Bike Tester & Calibration',
    startDate: '2026-11-02',
    dueDate: '2026-11-09',
    actualStartDate: '2026-11-02',
    completedDate: null,
    scrapRatePercent: 2.0,
    operatorNotes: 'Assembly finished. 50 units awaiting Quality Inspector sign-off.'
  },
  {
    id: 'PO-2026-104',
    orderNumber: 'PO-2026-104',
    demandOrderId: null,
    productId: 'PRD-001',
    productName: 'EcoRide Urban Commuter 250W',
    batchQuantity: 30,
    uom: 'units',
    priority: 'Low',
    status: 'Completed',
    progressPercent: 100,
    workCenterId: 'WC-05',
    workCenterName: 'QA Dyno Testing & Packaging',
    machineId: 'MC-06',
    machineName: 'Dyno Bike Tester & Calibration',
    startDate: '2026-10-25',
    dueDate: '2026-11-02',
    actualStartDate: '2026-10-25',
    completedDate: '2026-11-03',
    scrapRatePercent: 1.2,
    operatorNotes: 'Fully cleared through QA inspection and transferred to Finished Goods WH-03.'
  }
];

export const INITIAL_WORK_CENTERS = [
  {
    id: 'WC-01',
    code: 'WC-FAB',
    name: 'Frame Fabrication & TIG Welding',
    department: 'Metal Fabrication',
    location: 'Shop Floor - Sector A',
    maxCapacityHoursPerDay: 16.0,
    hourlyOperatingCost: 85.00,
    efficiencyRating: 94.5, // %
    headcountAssigned: 8,
    status: 'ACTIVE',
    activeMachinesCount: 2
  },
  {
    id: 'WC-02',
    code: 'WC-COAT',
    name: 'Automated Powder Coating & Curing',
    department: 'Finishing',
    location: 'Shop Floor - Sector B',
    maxCapacityHoursPerDay: 16.0,
    hourlyOperatingCost: 65.00,
    efficiencyRating: 96.0,
    headcountAssigned: 4,
    status: 'ACTIVE',
    activeMachinesCount: 1
  },
  {
    id: 'WC-03',
    code: 'WC-ELEC',
    name: 'Battery & Electronics Subassembly',
    department: 'Electrical Engineering',
    location: 'Shop Floor - Cleanroom C',
    maxCapacityHoursPerDay: 16.0,
    hourlyOperatingCost: 95.00,
    efficiencyRating: 98.2,
    headcountAssigned: 6,
    status: 'ACTIVE',
    activeMachinesCount: 2
  },
  {
    id: 'WC-04',
    code: 'WC-ASSY',
    name: 'Final Mechanical Assembly Line',
    department: 'Final Integration',
    location: 'Shop Floor - Main Line D',
    maxCapacityHoursPerDay: 20.0,
    hourlyOperatingCost: 110.00,
    efficiencyRating: 92.8,
    headcountAssigned: 14,
    status: 'ACTIVE',
    activeMachinesCount: 2
  },
  {
    id: 'WC-05',
    code: 'WC-QA-PACK',
    name: 'QA Dyno Testing & Packaging',
    department: 'Quality & Dispatch',
    location: 'Shop Floor - Sector E',
    maxCapacityHoursPerDay: 16.0,
    hourlyOperatingCost: 75.00,
    efficiencyRating: 97.5,
    headcountAssigned: 5,
    status: 'ACTIVE',
    activeMachinesCount: 1
  }
];

export const INITIAL_MACHINES = [
  {
    id: 'MC-01',
    code: 'CNC-BEND-01',
    name: 'CNC 5-Axis Tube Bender TB-01',
    workCenterId: 'WC-01',
    workCenterName: 'Frame Fabrication & TIG Welding',
    model: 'Crippa Linear 55',
    status: 'Running', // Running, Idle, Maintenance
    runtimeHours: 3410.5,
    lastMaintenanceDate: '2026-10-15',
    nextMaintenanceDate: '2026-12-15',
    efficiencyPct: 96.2,
    dailyPowerConsumptionKwh: 48.0
  },
  {
    id: 'MC-02',
    code: 'ROB-WELD-02',
    name: 'Robotic TIG Welder RW-02',
    workCenterId: 'WC-01',
    workCenterName: 'Frame Fabrication & TIG Welding',
    model: 'Fanuc ARC Mate 100iD',
    status: 'Running',
    runtimeHours: 4120.0,
    lastMaintenanceDate: '2026-10-20',
    nextMaintenanceDate: '2026-12-20',
    efficiencyPct: 98.0,
    dailyPowerConsumptionKwh: 64.5
  },
  {
    id: 'MC-03',
    code: 'POWD-BOOTH-01',
    name: 'Electrostatic Powder Booth PB-01',
    workCenterId: 'WC-02',
    workCenterName: 'Automated Powder Coating & Curing',
    model: 'Gema MagicCompact EquiFlow',
    status: 'Running',
    runtimeHours: 2980.0,
    lastMaintenanceDate: '2026-10-28',
    nextMaintenanceDate: '2026-12-28',
    efficiencyPct: 95.0,
    dailyPowerConsumptionKwh: 85.0
  },
  {
    id: 'MC-04',
    code: 'BAT-TEST-01',
    name: 'Battery Cell Spot Welder & Tester BS-01',
    workCenterId: 'WC-03',
    workCenterName: 'Battery & Electronics Subassembly',
    model: 'Miyachi Unitek Hi-Cap',
    status: 'Idle',
    runtimeHours: 1870.0,
    lastMaintenanceDate: '2026-10-05',
    nextMaintenanceDate: '2026-12-05',
    efficiencyPct: 99.1,
    dailyPowerConsumptionKwh: 32.0
  },
  {
    id: 'MC-05',
    code: 'ASSY-RIG-A',
    name: 'Assembly Line Rig A',
    workCenterId: 'WC-04',
    workCenterName: 'Final Mechanical Assembly Line',
    model: 'Park Tool Heavy-Duty Conveyor Rig',
    status: 'Running',
    runtimeHours: 5210.0,
    lastMaintenanceDate: '2026-10-18',
    nextMaintenanceDate: '2026-11-18',
    efficiencyPct: 93.4,
    dailyPowerConsumptionKwh: 22.0
  },
  {
    id: 'MC-06',
    code: 'DYNO-QA-01',
    name: 'Dyno Bike Tester & Calibration DT-01',
    workCenterId: 'WC-05',
    workCenterName: 'QA Dyno Testing & Packaging',
    model: 'Gomedi Electromotive DynoBench Pro',
    status: 'Idle',
    runtimeHours: 2140.0,
    lastMaintenanceDate: '2026-10-10',
    nextMaintenanceDate: '2026-12-10',
    efficiencyPct: 98.5,
    dailyPowerConsumptionKwh: 36.0
  },
  {
    id: 'MC-07',
    code: 'CNC-MILL-02',
    name: 'Vertical CNC Milling Station VM-02',
    workCenterId: 'WC-01',
    workCenterName: 'Frame Fabrication & TIG Welding',
    model: 'Haas VF-2SS Super Speed',
    status: 'Maintenance',
    runtimeHours: 6240.0,
    lastMaintenanceDate: '2026-11-09',
    nextMaintenanceDate: '2026-11-12',
    efficiencyPct: 88.0,
    dailyPowerConsumptionKwh: 52.0
  }
];

export const INITIAL_SHIFTS = [
  {
    id: 'SH-01',
    code: 'SHIFT-MORN',
    name: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    durationHours: 8.0,
    supervisor: 'Heinrich Weber',
    assignedTeam: 'Alpha Crew',
    workerCount: 22,
    status: 'ACTIVE',
    colorHex: '#3b82f6'
  },
  {
    id: 'SH-02',
    code: 'SHIFT-AFTN',
    name: 'Afternoon Shift',
    startTime: '14:00',
    endTime: '22:00',
    durationHours: 8.0,
    supervisor: 'Elena Rostova',
    assignedTeam: 'Bravo Crew',
    workerCount: 18,
    status: 'ACTIVE',
    colorHex: '#10b981'
  },
  {
    id: 'SH-03',
    code: 'SHIFT-NGHT',
    name: 'Night Shift (Maintenance & Heavy Runs)',
    startTime: '22:00',
    endTime: '06:00',
    durationHours: 8.0,
    supervisor: 'Viktor Dahl',
    assignedTeam: 'Charlie Crew',
    workerCount: 8,
    status: 'ACTIVE',
    colorHex: '#8b5cf6'
  }
];

export const INITIAL_SCHEDULES = [
  {
    id: 'SCH-001',
    productionOrderId: 'PO-2026-101',
    orderNumber: 'PO-2026-101',
    workCenterId: 'WC-04',
    workCenterName: 'Final Mechanical Assembly Line',
    machineId: 'MC-05',
    machineName: 'Assembly Line Rig A',
    shiftId: 'SH-01',
    shiftName: 'Morning Shift',
    scheduleDate: '2026-11-10',
    startHour: 8,
    endHour: 14,
    allocatedHours: 6.0,
    plannedUnits: 30,
    status: 'SCHEDULED'
  },
  {
    id: 'SCH-002',
    productionOrderId: 'PO-2026-102',
    orderNumber: 'PO-2026-102',
    workCenterId: 'WC-01',
    workCenterName: 'Frame Fabrication & TIG Welding',
    machineId: 'MC-02',
    machineName: 'Robotic TIG Welder RW-02',
    shiftId: 'SH-01',
    shiftName: 'Morning Shift',
    scheduleDate: '2026-11-10',
    startHour: 9,
    endHour: 15,
    allocatedHours: 6.0,
    plannedUnits: 20,
    status: 'SCHEDULED'
  },
  {
    id: 'SCH-003',
    productionOrderId: 'PO-2026-101',
    orderNumber: 'PO-2026-101',
    workCenterId: 'WC-04',
    workCenterName: 'Final Mechanical Assembly Line',
    machineId: 'MC-05',
    machineName: 'Assembly Line Rig A',
    shiftId: 'SH-02',
    shiftName: 'Afternoon Shift',
    scheduleDate: '2026-11-10',
    startHour: 14,
    endHour: 20,
    allocatedHours: 6.0,
    plannedUnits: 30,
    status: 'SCHEDULED'
  }
];

export const INITIAL_EXECUTION_RUNS = [
  {
    id: 'RUN-101',
    productionOrderId: 'PO-2026-101',
    orderNumber: 'PO-2026-101',
    productName: 'EcoRide Urban Commuter 250W',
    operationCode: 'OP-40-FINAL',
    operationName: 'Final Mechanical & Electrical Line Assembly',
    workCenterId: 'WC-04',
    workCenterName: 'Final Mechanical Assembly Line',
    targetQuantity: 60,
    completedQuantity: 39,
    scrapQuantity: 1,
    progressPercent: 65,
    status: 'In-Progress', // In-Progress, Paused, Completed
    startTime: '2026-11-08 08:30',
    assignedOperator: 'Lukas Meyer',
    notes: 'Wiring harness routing validated. 39 units mounted with torque checked.'
  },
  {
    id: 'RUN-102',
    productionOrderId: 'PO-2026-102',
    orderNumber: 'PO-2026-102',
    productName: 'VoltSport Cross-Trail 500W',
    operationCode: 'OP-10-WELD',
    operationName: 'Precision Frame TIG Welding & Alignment',
    workCenterId: 'WC-01',
    workCenterName: 'Frame Fabrication & TIG Welding',
    targetQuantity: 40,
    completedQuantity: 8,
    scrapQuantity: 0,
    progressPercent: 20,
    status: 'In-Progress',
    startTime: '2026-11-10 09:15',
    assignedOperator: 'Jan Nowak',
    notes: 'Jig alignment verified on first 8 frames.'
  }
];

export const INITIAL_QUALITY_INSPECTIONS = [
  {
    id: 'QI-2026-001',
    inspectionNumber: 'QI-2026-001',
    productionOrderId: 'PO-2026-104',
    orderNumber: 'PO-2026-104',
    productName: 'EcoRide Urban Commuter 250W',
    inspectedQuantity: 30, // Strict rule: inspected = accepted + rejected
    acceptedQuantity: 29,
    rejectedQuantity: 1,
    defectReason: 'Minor paint scratch on down-tube (re-powder coated)',
    inspectionDate: '2026-11-03',
    inspectorName: 'Dr. Clara Lindqvist (Lead QA)',
    status: 'PASS',
    passRatePercent: 96.7,
    disposition: 'Accepted 29 to WH-03. 1 routed for cosmetic touch-up.'
  },
  {
    id: 'QI-2026-002',
    inspectionNumber: 'QI-2026-002',
    productionOrderId: 'PO-2026-103',
    orderNumber: 'PO-2026-103',
    productName: 'EcoRide Urban Commuter 250W',
    inspectedQuantity: 50,
    acceptedQuantity: 48,
    rejectedQuantity: 2,
    defectReason: 'Disc brake rotor wobble > 0.2mm on test dyno',
    inspectionDate: '2026-11-09',
    inspectorName: 'Marco Vane (Senior Inspector)',
    status: 'PASS',
    passRatePercent: 96.0,
    disposition: '48 cleared for finished goods packaging. 2 rotors replaced.'
  }
];

export const INITIAL_MATERIAL_CONSUMPTION = [
  {
    id: 'CNS-001',
    productionOrderId: 'PO-2026-104',
    orderNumber: 'PO-2026-104',
    materialId: 'MAT-101',
    materialCode: 'RM-ALU-6061',
    materialName: 'Aluminum 6061-T6 Extruded Tubing',
    warehouseId: 'WH-01',
    plannedQuantity: 186.0, // 30 units * 6.2 kg
    actualQuantity: 189.5, // 3.5 kg scrap/cut buffer
    variance: 3.5,
    uom: 'kg',
    unitCost: 6.80,
    totalCost: 1288.60,
    loggedAt: '2026-10-26 11:30',
    type: 'BACKFLUSH',
    status: 'POSTED'
  },
  {
    id: 'CNS-002',
    productionOrderId: 'PO-2026-104',
    orderNumber: 'PO-2026-104',
    materialId: 'MAT-102',
    materialCode: 'RM-BAT-21700',
    materialName: 'Lithium Li-Ion 21700 Cell Module',
    warehouseId: 'WH-01',
    plannedQuantity: 30.0,
    actualQuantity: 30.0,
    variance: 0.0,
    uom: 'units',
    unitCost: 185.00,
    totalCost: 5550.00,
    loggedAt: '2026-10-27 14:15',
    type: 'BACKFLUSH',
    status: 'POSTED'
  },
  {
    id: 'CNS-003',
    productionOrderId: 'PO-2026-101',
    orderNumber: 'PO-2026-101',
    materialId: 'MAT-101',
    materialCode: 'RM-ALU-6061',
    materialName: 'Aluminum 6061-T6 Extruded Tubing',
    warehouseId: 'WH-01',
    plannedQuantity: 372.0, // 60 units * 6.2 kg
    actualQuantity: 375.0,
    variance: 3.0,
    uom: 'kg',
    unitCost: 6.80,
    totalCost: 2550.00,
    loggedAt: '2026-11-08 09:45',
    type: 'MANUAL_ISSUE',
    status: 'POSTED'
  }
];

export const INITIAL_FINISHED_GOODS = [
  {
    id: 'FG-001',
    receiptNumber: 'FGR-2026-001',
    productionOrderId: 'PO-2026-104',
    orderNumber: 'PO-2026-104',
    productId: 'PRD-001',
    productCode: 'EBIKE-URB-250',
    productName: 'EcoRide Urban Commuter 250W',
    quantityReceived: 29,
    uom: 'units',
    warehouseId: 'WH-03',
    warehouseName: 'Finished Goods Logistics Center',
    binLocation: 'BAY-FG-04',
    unitCost: 642.50,
    totalValuation: 18632.50,
    qualityCertNumber: 'QC-CERT-2026-8812',
    receivedDate: '2026-11-04',
    dispatchedQuantity: 0,
    availableBalance: 29
  },
  {
    id: 'FG-002',
    receiptNumber: 'FGR-2026-002',
    productionOrderId: 'PO-2026-098',
    orderNumber: 'PO-2026-098',
    productId: 'PRD-002',
    productCode: 'EBIKE-TRL-500',
    productName: 'VoltSport Cross-Trail 500W',
    quantityReceived: 20,
    uom: 'units',
    warehouseId: 'WH-03',
    warehouseName: 'Finished Goods Logistics Center',
    binLocation: 'BAY-FG-02',
    unitCost: 885.00,
    totalValuation: 17700.00,
    qualityCertNumber: 'QC-CERT-2026-8790',
    receivedDate: '2026-10-30',
    dispatchedQuantity: 15,
    availableBalance: 5
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-001',
    timestamp: '2026-11-10 08:30:15',
    userRole: 'Production Planner',
    userId: 'usr-planner',
    module: 'Production Orders',
    actionType: 'STATUS_CHANGE',
    targetId: 'PO-2026-102',
    changeNotes: 'Production Order PO-2026-102 transitioned from Draft to Released.'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-11-09 16:45:00',
    userRole: 'Quality Inspector',
    userId: 'usr-qa',
    module: 'Quality Inspection',
    actionType: 'CREATE',
    targetId: 'QI-2026-002',
    changeNotes: 'Logged QA inspection for PO-2026-103: 48 Accepted, 2 Rejected.'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-11-08 09:12:30',
    userRole: 'Production Supervisor',
    userId: 'usr-supervisor',
    module: 'Production Execution',
    actionType: 'UPDATE',
    targetId: 'PO-2026-101',
    changeNotes: 'Started execution for PO-2026-101 on Work Center WC-04.'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-11-05 14:10:00',
    userRole: 'Administrator',
    userId: 'usr-admin',
    module: 'Demand / Sales Orders',
    actionType: 'CREATE',
    targetId: 'SO-2026-001',
    changeNotes: 'Created sales demand order for Nordic Velocity Mobility AS (100 units).'
  }
];

export const INITIAL_USERS = [
  {
    id: 'usr-admin',
    name: 'Alexander Vance',
    fullName: 'Alexander Vance',
    email: 'admin@nexflow.mfg',
    role: 'Administrator',
    jobTitle: 'Plant Operations Administrator',
    department: 'Plant Operations & IT',
    status: 'ACTIVE',
    lastActive: 'Just now',
    permissions: ['*'],
    permissionsSummary: 'Full System R/W on all 20 modules'
  },
  {
    id: 'usr-planner',
    name: 'Diana',
    fullName: 'Diana',
    email: 'e.rostova@mfg-nexflow.com',
    role: 'Production Planner',
    jobTitle: 'Production Planner',
    department: 'Supply Chain & Planning',
    status: 'ACTIVE',
    lastActive: '5 mins ago',
    permissions: ['bom.view', 'materials.view', 'demand.view', 'production.view', 'mrp.view', 'scheduling.view'],
    permissionsSummary: 'BOM, Raw Materials, Demand, Production Orders, MRP, Scheduling'
  },
  {
    id: 'usr-inventory',
    name: 'Santhosh',
    fullName: 'Santhosh',
    email: 'd.oconnor@mfg-nexflow.com',
    role: 'Store / Inventory Officer',
    jobTitle: 'Store / Inventory Officer',
    department: 'Warehouse & Logistics',
    status: 'ACTIVE',
    lastActive: '12 mins ago',
    permissions: [
      'dashboard',
      'products.read',
      'raw_materials.read',
      'raw_materials.write',
      'suppliers.read',
      'suppliers.write',
      'inventory.read',
      'inventory.write',
      'consumption.write',
      'finished_goods.read',
      'finished_goods.write',
      'reports.read'
    ],
    permissionsSummary: 'Raw Materials, Suppliers, Inventory, Receipts, Consumption, Products, Reports'
  },
  {
    id: 'usr-supervisor',
    name: 'Barry Allen',
    fullName: 'Barry Allen',
    email: 'h.weber@mfg-nexflow.com',
    role: 'Production Supervisor',
    jobTitle: 'Production Supervisor',
    department: 'Shop Floor Operations',
    status: 'ACTIVE',
    lastActive: '2 mins ago',
    permissions: ['workcenters.view', 'execution.view', 'execution.manage'],
    permissionsSummary: 'Work Centers, Machines, Shifts, Execution, Floor Progress'
  },
  {
    id: 'usr-qa',
    name: 'Clark kent',
    fullName: 'Clark kent',
    email: 'c.lindqvist@mfg-nexflow.com',
    role: 'Quality Inspector',
    jobTitle: 'Quality Inspector',
    department: 'Quality Assurance',
    status: 'ACTIVE',
    lastActive: '25 mins ago',
    permissions: ['quality.view', 'quality.manage'],
    permissionsSummary: 'Inspections, NCR, Dispositions, QA Reports'
  },
  {
    id: 'usr-mgmt',
    name: 'Bruce Wayne',
    fullName: 'Bruce Wayne',
    email: 'm.sterling@mfg-nexflow.com',
    role: 'Management Viewer',
    jobTitle: 'Executive Manager',
    department: 'Executive Board',
    status: 'ACTIVE',
    lastActive: '1 hour ago',
    permissions: ['dashboard.view', 'reports.view'],
    permissionsSummary: 'Read-only Dashboards, Executive KPI Reports, Audit Logs'
  }
];

export const ROLES_LIST = [
  {
    id: 'Administrator',
    name: 'Administrator',
    badge: 'Full Access',
    description: 'Complete operational visibility & read/write privilege across all 20 modules.',
    allowedModules: ['*'] // all 20 modules
  },
  {
    id: 'Production Planner',
    name: 'Production Planner',
    badge: 'Planning Focus',
    description: 'BOM, Raw Materials, Demand Orders, Production Orders, MRP, and Scheduling.',
    allowedModules: [
      'dashboard', 'products', 'bom', 'raw-materials', 'demand-orders',
      'production-orders', 'mrp', 'scheduling', 'reports'
    ]
  },
  {
    id: 'Store / Inventory Officer',
    name: 'Store / Inventory Officer',
    badge: 'Stores & Stock',
    description: 'Raw Materials, Suppliers, Multi-Warehouse Inventory, Receipts, and Material Consumption.',
    allowedModules: [
      'dashboard', 'products', 'raw-materials', 'suppliers', 'inventory',
      'material-consumption', 'finished-goods', 'reports'
    ]
  },
  {
    id: 'Production Supervisor',
    name: 'Production Supervisor',
    badge: 'Shop Floor',
    description: 'Work Centers, Machines, Shifts & Calendar, Production Execution, and Line Progress.',
    allowedModules: [
      'dashboard', 'work-centers', 'machines', 'shifts-calendar',
      'scheduling', 'production-execution', 'reports'
    ]
  },
  {
    id: 'Quality Inspector',
    name: 'Quality Inspector',
    badge: 'QA & Compliance',
    description: 'Quality Inspections, Non-Conformance, and Disposition Logs.',
    allowedModules: [
      'dashboard', 'quality-inspection', 'finished-goods', 'reports'
    ]
  },
  {
    id: 'Management Viewer',
    name: 'Management Viewer',
    badge: 'Read-Only Exec',
    description: 'Read-only access to Executive Dashboards, KPI Reports, and Audit Trails.',
    allowedModules: [
      'dashboard', 'reports', 'audit-logs'
    ]
  }
];

