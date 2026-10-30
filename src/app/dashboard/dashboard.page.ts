import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppDataService, InventoryProduct } from '../core/app-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [IonContent]
})
export class DashboardPage {
  private readonly router = inject(Router);
  private readonly appData = inject(AppDataService);
  private readonly destroyRef = inject(DestroyRef);

  userName = 'Demo user';
  products: InventoryProduct[] = [];

  recentActivity = [
    { action: 'Office paper added', detail: 'Bond paper · 5 reams', time: 'Today, 9:40 AM', type: 'add' },
    { action: 'Equipment assigned', detail: 'Projector · Records Office', time: 'Yesterday, 3:15 PM', type: 'assign' },
    { action: 'Stock level updated', detail: 'Printer ink · 2 units remaining', time: 'Oct 11, 2026', type: 'warning' }
  ];

  constructor() {
    this.appData.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => this.userName = user?.name ?? 'Guest User');
    this.appData.products$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => this.products = products);
  }

  get totalItems(): number { return this.products.length; }
  get availableItems(): number { return this.products.filter((product) => product.quantity > 0).length; }
  get lowStockItems(): number { return this.products.filter((product) => product.quantity > 0 && product.quantity <= 2).length; }
  get departments(): number { return this.appData.getDepartments().length; }

  go(path: string): void {
    this.router.navigate([`/${path}`]);
  }

  async logout(): Promise<void> {
    await this.appData.signOut();
    this.router.navigate(['/']);
  }
}
