import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppDataService, InventoryProduct } from '../core/app-data.service';
import {
  IonContent,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular';

@Component({
  selector: 'app-available',
  standalone: true,
  templateUrl: './available.page.html',
  styleUrls: ['./available.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonLabel,
    IonSearchbar,
    IonSegment,
    IonSegmentButton
  ]
})
export class AvailablePage {
  private readonly router = inject(Router);
  private readonly appData = inject(AppDataService);
  private readonly destroyRef = inject(DestroyRef);

  searchText = '';
  selectedCategory = 'All';
  categories = ['All', 'Office Supplies', 'Equipment', 'Cleaning Supplies'];
  products: InventoryProduct[] = [];

  get inventorySourceLabel(): string {
    return this.appData.inventorySourceLabel;
  }

  constructor() {
    this.appData.products$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => this.products = products);
  }

  get filteredItems(): InventoryProduct[] {
    const search = this.searchText.toLowerCase().trim();
    return this.products.filter((item) => item.departmentName === null).filter(item =>
      (this.selectedCategory === 'All' || item.category === this.selectedCategory) &&
      (!search || item.name.toLowerCase().includes(search) || item.location.toLowerCase().includes(search))
    );
  }

  go(path: string): void { this.router.navigate([`/${path}`]); }
}
