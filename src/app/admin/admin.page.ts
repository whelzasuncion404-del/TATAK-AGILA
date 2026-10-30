import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  departmentName?: string | null;
}

export interface Department {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminPage implements OnInit {
  // --- Form Fields ---
  editingProductId: string | null = null;
  productName: string = '';
  category: string = '';
  quantity: number | null = null;
  unit: string = '';
  location: string = '';
  departmentName: string | null = null;

  // --- Filtering & Search ---
  searchText: string = '';

  // --- Options & Reference Data ---
  categories: string[] = [
    'Office Supplies',
    'Equipment',
    'Cleaning Supplies',
    'Electronics',
    'Furniture',
    'General'
  ];

  departments: Department[] = [
    { id: '1', name: 'Business Office' },
    { id: '2', name: 'College of Information and Computing Sciences' },
    { id: '3', name: 'College Student Council' },
    { id: '4', name: 'Property & Supply Office' }
  ];

  // --- Inventory State ---
  products: Product[] = [
    {
      id: 'prod-1',
      name: 'Bond Paper A4',
      category: 'Office Supplies',
      quantity: 50,
      unit: 'reams',
      location: 'Main Supply Room',
      departmentName: null
    },
    {
      id: 'prod-2',
      name: 'Epson EcoTank L3210 Ink (Black)',
      category: 'Electronics',
      quantity: 12,
      unit: 'bottles',
      location: 'Supply Office - Shelf B',
      departmentName: 'Business Office'
    },
    {
      id: 'prod-3',
      name: 'LCD Projector',
      category: 'Equipment',
      quantity: 4,
      unit: 'pcs',
      location: 'AVR Storage',
      departmentName: 'College of Information and Computing Sciences'
    }
  ];

  ngOnInit() {}

  // --- Computed Metrics ---
  get availableCount(): number {
    return this.products.filter(p => !p.departmentName).length;
  }

  get assignedCount(): number {
    return this.products.filter(p => !!p.departmentName).length;
  }

  // --- Filtered Product List for View ---
  get filteredProducts(): Product[] {
    if (!this.searchText || !this.searchText.trim()) {
      return this.products;
    }
    const query = this.searchText.toLowerCase().trim();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.location.toLowerCase().includes(query) ||
      (product.departmentName && product.departmentName.toLowerCase().includes(query))
    );
  }

  // --- Form Handlers ---
  saveProduct(): void {
    if (!this.productName.trim() || !this.quantity || this.quantity < 0) {
      alert('Please fill in all required fields properly.');
      return;
    }

    if (this.editingProductId) {
      // Update existing product
      const index = this.products.findIndex(p => p.id === this.editingProductId);
      if (index !== -1) {
        this.products[index] = {
          ...this.products[index],
          name: this.productName.trim(),
          category: this.category || 'General',
          quantity: Number(this.quantity),
          unit: this.unit.trim() || 'pcs',
          location: this.location.trim(),
          departmentName: this.departmentName || null
        };
      }
    } else {
      // Add new product
      const newProduct: Product = {
        id: 'prod-' + Date.now(),
        name: this.productName.trim(),
        category: this.category || 'General',
        quantity: Number(this.quantity),
        unit: this.unit.trim() || 'pcs',
        location: this.location.trim(),
        departmentName: this.departmentName || null
      };
      this.products.unshift(newProduct);
    }

    this.resetForm();
  }

  editProduct(product: Product): void {
    this.editingProductId = product.id;
    this.productName = product.name;
    this.category = product.category;
    this.quantity = product.quantity;
    this.unit = product.unit;
    this.location = product.location;
    this.departmentName = product.departmentName ?? null;
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.products = this.products.filter(p => p.id !== product.id);
      if (this.editingProductId === product.id) {
        this.resetForm();
      }
    }
  }

  resetForm(): void {
    this.editingProductId = null;
    this.productName = '';
    this.category = '';
    this.quantity = null;
    this.unit = '';
    this.location = '';
    this.departmentName = null;
  }

  logout(): void {
    // Implement logout redirection/auth clear logic here
    console.log('Admin logged out.');
  }
}