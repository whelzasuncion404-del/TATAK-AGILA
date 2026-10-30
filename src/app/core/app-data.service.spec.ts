import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppDataService } from './app-data.service';

describe('AppDataService', () => {
  let service: AppDataService;

  beforeEach(() => {
    localStorage.clear();
    service = new AppDataService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads the local inventory and reports its browser-only scope', () => {
    service.initialize();
    expect(service.getProducts().length).toBeGreaterThan(0);
    expect(service.connectionError$.value).toContain('do not sync to other devices');
  });

  it('includes all requested colleges in the department list', () => {
    const names = service.getDepartments().map((department) => department.name);

    expect(names).toEqual(expect.arrayContaining([
      'College of Natural Science and Mathematics',
      'College of Humanities and Social Sciences',
      'College of Public Administration',
      'College of Information and Computing Sciences',
      'College of Law',
      'College of Engineering and Architecture',
      'College of Industrial Technology',
      'College of Human Kinetics',
      'College of Veterinary Medicine',
      'College of Medicine',
      'College of Nursing'
    ]));
  });

  it('signs into the separate CSU Admin account with the configured credentials', async () => {
    const user = await service.signInAdmin('csucarig', '1234');

    expect(user).toEqual({
      name: 'CSU Admin',
      email: 'csucarig@tatakagila.local',
      role: 'admin'
    });
  });

  it('rejects invalid CSU Admin credentials', async () => {
    await expect(service.signInAdmin('csucarig', 'wrong')).rejects.toThrow(
      'Invalid CSU Admin username or password.'
    );
  });

  it('reserves the admin username for the CSU Admin sign-in', async () => {
    await expect(service.signIn('csucarig', '1234')).rejects.toThrow(
      'Use the CSU Admin sign-in for this username.'
    );
  });

  it('restores a valid saved admin session', () => {
    localStorage.setItem('tatakAgilaUser', JSON.stringify({
      name: 'CSU Carig Admin',
      email: 'csucarig@tatakagila.local',
      role: 'admin'
    }));

    service.initialize();

    expect(service.getCurrentUser()?.role).toBe('admin');
    expect(localStorage.getItem('tatakAgilaUser')).not.toBeNull();
  });

  it('allows the admin to add, edit, and delete shared inventory', async () => {
    await service.signInAdmin('csucarig', '1234');
    const added = service.addProduct({
      name: 'Test laptop',
      category: 'Equipment',
      quantity: 4,
      unit: 'units',
      location: 'IT Storage',
      departmentName: 'College of Information and Computing Sciences'
    });

    expect(service.getProducts()).toContainEqual(added);

    service.updateProduct(added.id, { ...added, quantity: 3 });
    expect(service.getProducts().find((product) => product.id === added.id)?.quantity).toBe(3);

    service.deleteProduct(added.id);
    expect(service.getProducts().some((product) => product.id === added.id)).toBe(false);
  });

  it('prevents non-admin users from changing shared inventory', async () => {
    await service.signIn('student@example.com', 'demo');

    expect(() => service.addProduct({
      name: 'Unauthorized item',
      category: 'Equipment',
      quantity: 1,
      unit: 'unit',
      location: 'Storage',
      departmentName: null
    })).toThrow('Only the CSU Admin can manage inventory.');
  });

  it('starts without an authenticated account', () => {
    expect(service.getCurrentUser()).toBeNull();
    service.setGuest();
    expect(service.getCurrentUser()).toEqual({
      name: 'Guest User',
      email: 'guest@tatakagila.local',
      role: 'guest'
    });
  });
});
