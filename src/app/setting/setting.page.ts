import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AlertController,
  IonButton,
  IonContent,
  IonToggle,
  ToastController
} from '@ionic/angular';
import { AppDataService } from '../core/app-data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonContent, IonToggle]
})
export class SettingsPage {
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly appData = inject(AppDataService);
  private readonly destroyRef = inject(DestroyRef);

  userName = 'Demo user';
  email = '';
  role = 'user';
  notificationsEnabled = true;
  compactView = false;

  constructor() {
    this.appData.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.userName = user?.name ?? 'Guest User';
        this.email = user?.email ?? '';
        this.role = user?.role ?? 'guest';
      });
  }

  go(path: string): void { this.router.navigate([`/${path}`]); }

  async savePreferences(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Preferences updated for this demo session.',
      duration: 1800,
      position: 'bottom'
    });
    await toast.present();
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Log out?',
      message: 'You will return to the welcome screen.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Log out', role: 'destructive' }
      ]
    });
    await alert.present();
    const { role: confirmation } = await alert.onDidDismiss();
    if (confirmation !== 'destructive') {
      return;
    }
    try {
      await this.appData.signOut();
      await this.router.navigate(['/']);
    } catch (error) {
      const toast = await this.toastController.create({
        message: error instanceof Error ? error.message : 'Could not log out.',
        duration: 2200,
        position: 'bottom'
      });
      await toast.present();
    }
  }
}
