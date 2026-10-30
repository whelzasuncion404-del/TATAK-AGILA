import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular';
import { AppDataService, InventoryDepartment, InventoryProduct } from '../core/app-data.service';

@Component({
  selector: 'app-department',
  standalone: true,
  templateUrl: './department.page.html',
  styleUrls: ['./department.page.scss'],
  imports: [IonContent]
})
export class DepartmentPage {
  private readonly router = inject(Router);
  private readonly appData = inject(AppDataService);
  private readonly destroyRef = inject(DestroyRef);

  products: InventoryProduct[] = [];
  selectedDepartment: InventoryDepartment | null = null;

  constructor() {
    this.appData.products$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => this.products = products);
  }

  get departments(): InventoryDepartment[] {
    return this.appData.getDepartments();
  }

  getProductsForDepartment(departmentName: string): InventoryProduct[] {
    return this.products.filter((product) => product.departmentName === departmentName);
  }

  openDepartment(department: InventoryDepartment): void {
    this.selectedDepartment = department;
  }

  showDepartments(): void {
    this.selectedDepartment = null;
  }

  go(path: string): void { this.router.navigate([`/${path}`]); }
}
