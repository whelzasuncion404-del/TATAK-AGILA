import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type UserRole = 'student' | 'guest' | 'admin';

export interface AppUser {
  name: string;
  email: string;
  role: UserRole;
}

export interface InventoryDepartment {
  name: string;
  code: string;
  manager: string;
  initials: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  departmentName: string | null;
}

const USER_STORAGE_KEY = 'tatakAgilaUser';
const PRODUCT_STORAGE_KEY = 'tatakAgilaProducts';
const PRODUCT_CHANNEL = 'tatak-agila-inventory';
const ADMIN_USERNAME = 'csucarig';
const ADMIN_PASSWORD = '1234';
const ADMIN_EMAIL = 'csucarig@tatakagila.local';
const DEPARTMENTS: InventoryDepartment[] = [
  { name: 'Business Office', code: 'BO-001', manager: 'Office Administrator', initials: 'BO' },
  { name: 'Records Office', code: 'RO-002', manager: 'Records Custodian', initials: 'RO' },
  { name: 'Supply Room', code: 'SR-004', manager: 'Supply Custodian', initials: 'SR' },
  { name: 'College of Natural Science and Mathematics', code: 'CNSM', manager: 'Inventory Custodian', initials: 'CN' },
  { name: 'College of Humanities and Social Sciences', code: 'CHSS', manager: 'Inventory Custodian', initials: 'CH' },
  { name: 'College of Public Administration', code: 'CPA', manager: 'Inventory Custodian', initials: 'CP' },
  { name: 'College of Information and Computing Sciences', code: 'CICS', manager: 'Inventory Custodian', initials: 'CI' },
  { name: 'College of Law', code: 'COL', manager: 'Inventory Custodian', initials: 'CL' },
  { name: 'College of Engineering and Architecture', code: 'CEA', manager: 'Inventory Custodian', initials: 'CE' },
  { name: 'College of Industrial Technology', code: 'CIT', manager: 'Inventory Custodian', initials: 'CI' },
  { name: 'College of Human Kinetics', code: 'CHK', manager: 'Inventory Custodian', initials: 'CH' },
  { name: 'College of Veterinary Medicine', code: 'CVM', manager: 'Inventory Custodian', initials: 'CV' },
  { name: 'College of Medicine', code: 'COM', manager: 'Inventory Custodian', initials: 'CM' },
  { name: 'College of Nursing', code: 'CON', manager: 'Inventory Custodian', initials: 'CN' }
];

const DEFAULT_PRODUCTS: InventoryProduct[] = [
  { id: 'sample-1', name: 'Bond Paper (A4)', category: 'Office Supplies', quantity: 24, unit: 'reams', location: 'Supply Room', departmentName: null },
  { id: 'sample-2', name: 'Ballpoint Pens', category: 'Office Supplies', quantity: 50, unit: 'pieces', location: 'Supply Room', departmentName: null },
  { id: 'sample-3', name: 'Printer Ink', category: 'Office Supplies', quantity: 12, unit: 'cartridges', location: 'Records Office', departmentName: null },
  { id: 'sample-4', name: 'Desktop Computer', category: 'Equipment', quantity: 6, unit: 'units', location: 'Business Office', departmentName: null },
  { id: 'sample-5', name: 'Projector', category: 'Equipment', quantity: 2, unit: 'units', location: 'Conference Room', departmentName: null },
  { id: 'sample-6', name: 'Disinfectant', category: 'Cleaning Supplies', quantity: 9, unit: 'bottles', location: 'Janitorial Storage', departmentName: null }
];

function isInventoryProduct(value: unknown): value is InventoryProduct {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const product = value as Record<string, unknown>;
  return typeof product['id'] === 'string' &&
    typeof product['name'] === 'string' &&
    typeof product['category'] === 'string' &&
    typeof product['quantity'] === 'number' &&
    Number.isInteger(product['quantity']) &&
    typeof product['unit'] === 'string' &&
    typeof product['location'] === 'string' &&
    (product['departmentName'] === null || typeof product['departmentName'] === 'string');
}

@Injectable({ providedIn: 'root' })
export class AppDataService {
  readonly products$ = new BehaviorSubject<InventoryProduct[]>([]);
  readonly currentUser$ = new BehaviorSubject<AppUser | null>(null);
  readonly connectionError$ = new BehaviorSubject<string | null>(null);

  private channel: BroadcastChannel | null = null;
  private initialized = false;

  get inventorySourceLabel(): string {
    return 'LOCAL INVENTORY';
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.loadProductsFromStorage();
    this.loadUserFromStorage();
    window.addEventListener('storage', this.handleStorageChange);
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(PRODUCT_CHANNEL);
      this.channel.addEventListener('message', this.handleChannelMessage);
    }
    this.connectionError$.next(
      'Local demo mode: changes are saved in this browser and update other tabs on this device. They do not sync to other devices.'
    );
  }

  getProducts(): InventoryProduct[] {
    return this.products$.value;
  }

  getDepartments(): InventoryDepartment[] {
    const departments = DEPARTMENTS.map((department) => ({ ...department }));
    const knownNames = new Set(departments.map((department) => department.name.toLowerCase()));

    for (const product of this.products$.value) {
      const name = product.departmentName?.trim();
      if (name && !knownNames.has(name.toLowerCase())) {
        knownNames.add(name.toLowerCase());
        departments.push({
          name,
          code: `UNIT-${departments.length + 1}`,
          manager: 'Inventory Custodian',
          initials: name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()
        });
      }
    }

    return departments;
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser$.value;
  }

  async signIn(identifier: string, password: string): Promise<AppUser> {
    this.initialize();
    const username = identifier.trim();
    if (!username || !password) {
      throw new Error('Enter your email and password.');
    }
    if (username.toLowerCase() === ADMIN_USERNAME || username.toLowerCase() === ADMIN_EMAIL) {
      throw new Error('Use the CSU Admin sign-in for this username.');
    }

    const student: AppUser = {
      name: username.includes('@') ? username.split('@')[0] : username,
      email: username.includes('@') ? username : `${username}@tatakagila.local`,
      role: 'student'
    };
    this.setCurrentUser(student);
    return student;
  }

  async signInAdmin(username: string, password: string): Promise<AppUser> {
    this.initialize();
    if (username.trim().toLowerCase() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      throw new Error('Invalid CSU Admin username or password.');
    }

    const admin: AppUser = {
      name: 'CSU Admin',
      email: ADMIN_EMAIL,
      role: 'admin'
    };
    this.setCurrentUser(admin);
    return admin;
  }

  addProduct(product: Omit<InventoryProduct, 'id'>): InventoryProduct {
    this.requireAdmin();
    this.validateProduct(product);

    const newProduct: InventoryProduct = {
      ...product,
      id: globalThis.crypto?.randomUUID?.() ?? `product-${Date.now()}-${Math.random().toString(36).slice(2)}`
    };
    this.saveProducts([...this.products$.value, newProduct]);
    return newProduct;
  }

  updateProduct(id: string, changes: Omit<InventoryProduct, 'id'>): void {
    this.requireAdmin();
    this.validateProduct(changes);
    const existing = this.products$.value.find((product) => product.id === id);
    if (!existing) {
      throw new Error('That inventory item could not be found.');
    }

    this.saveProducts(this.products$.value.map((product) =>
      product.id === id ? { ...changes, id } : product
    ));
  }

  deleteProduct(id: string): void {
    this.requireAdmin();
    if (!this.products$.value.some((product) => product.id === id)) {
      throw new Error('That inventory item could not be found.');
    }
    this.saveProducts(this.products$.value.filter((product) => product.id !== id));
  }

  async signUp(name: string, email: string, password: string): Promise<boolean> {
    if (!name.trim() || !email.trim() || !password) {
      throw new Error('Complete all account fields.');
    }
    return false;
  }

  async resetPassword(email: string): Promise<void> {
    if (!email.trim()) {
      throw new Error('Enter your account email first.');
    }
    throw new Error('Password reset is unavailable in local demo mode.');
  }

  async signOut(): Promise<void> {
    this.clearCurrentUser();
  }

  setGuest(): void {
    this.setCurrentUser({
      name: 'Guest User',
      email: 'guest@tatakagila.local',
      role: 'guest'
    });
  }

  setCurrentUser(user: AppUser): void {
    this.currentUser$.next(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  clearCurrentUser(): void {
    this.currentUser$.next(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (event.key === PRODUCT_STORAGE_KEY) {
      this.loadProductsFromStorage();
    } else if (event.key === USER_STORAGE_KEY) {
      this.loadUserFromStorage();
    }
  };

  private readonly handleChannelMessage = (event: MessageEvent<unknown>): void => {
    if (event.data === 'inventory-updated') {
      this.loadProductsFromStorage();
    }
  };

  private loadProductsFromStorage(): void {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (stored === null) {
      const initialProducts = DEFAULT_PRODUCTS.map((product) => ({ ...product }));
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(initialProducts));
      this.products$.next(initialProducts);
      return;
    }

    try {
      const products: unknown = JSON.parse(stored);
      if (!Array.isArray(products) || !products.every(isInventoryProduct)) {
        throw new Error('Saved inventory data is invalid.');
      }
      this.products$.next(products);
    } catch (error) {
      this.connectionError$.next(
        error instanceof Error ? error.message : 'Could not read saved inventory data.'
      );
      this.products$.next([]);
    }
  }

  private loadUserFromStorage(): void {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) {
      this.currentUser$.next(null);
      return;
    }

    try {
      const user: unknown = JSON.parse(stored);
      if (
        typeof user !== 'object' ||
        user === null ||
        !('name' in user) ||
        !('email' in user) ||
        !('role' in user) ||
        typeof user.name !== 'string' ||
        typeof user.email !== 'string' ||
        (user.role !== 'student' && user.role !== 'guest' && user.role !== 'admin')
      ) {
        throw new Error('Saved user session is invalid. Please sign in again.');
      }
      this.currentUser$.next({
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      this.currentUser$.next(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      this.connectionError$.next(
        error instanceof Error ? error.message : 'Could not read the saved user session.'
      );
    }
  }

  private saveProducts(products: InventoryProduct[]): void {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
    this.products$.next(products);
    this.channel?.postMessage('inventory-updated');
  }

  private requireAdmin(): void {
    if (this.currentUser$.value?.role !== 'admin') {
      throw new Error('Only the CSU Admin can manage inventory.');
    }
  }

  private validateProduct(product: Omit<InventoryProduct, 'id'>): void {
    if (!product.name.trim() || !product.category.trim() || !product.unit.trim() || !product.location.trim()) {
      throw new Error('Complete all required product fields.');
    }
    if (!Number.isInteger(product.quantity) || product.quantity < 0) {
      throw new Error('Quantity must be a whole number of zero or more.');
    }
    if (product.departmentName !== null && !this.getDepartments().some(
      (department) => department.name === product.departmentName
    )) {
      throw new Error('Select a valid department.');
    }
  }

}
