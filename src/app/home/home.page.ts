import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppDataService } from '../core/app-data.service';
import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  ToastController
} from '@ionic/angular';

type AuthScreen = 'welcome' | 'login' | 'register' | 'admin-login';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [FormsModule, IonButton, IonContent, IonInput, IonLabel]
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly appData = inject(AppDataService);

  screen: AuthScreen = 'welcome';
  loginEmail = '';
  loginPassword = '';
  adminUsername = '';
  adminPassword = '';
  fullName = '';
  registerEmail = '';
  registerPassword = '';
  confirmPassword = '';
  showLoginPassword = false;
  showRegisterPassword = false;

  openLogin(): void {
    this.screen = 'login';
  }

  openRegister(): void {
    this.screen = 'register';
  }

  backToWelcome(): void {
    this.screen = 'welcome';
  }

  openAdminLogin(): void {
    this.screen = 'admin-login';
  }

  async login(): Promise<void> {
    if (!this.loginEmail.trim() || !this.loginPassword.trim()) {
      await this.showToast('Please enter your email and password.');
      return;
    }

    try {
      await this.appData.signIn(this.loginEmail, this.loginPassword);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'Sign-in failed. Please try again.'
      );
    }
  }

  async adminLogin(): Promise<void> {
    if (!this.adminUsername.trim() || !this.adminPassword) {
      await this.showToast('Enter the CSU Admin username and password.');
      return;
    }

    try {
      await this.appData.signInAdmin(this.adminUsername, this.adminPassword);
      await this.router.navigate(['/admin']);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'Admin sign-in failed. Please try again.'
      );
    }
  }

  async register(): Promise<void> {
    if (!this.fullName.trim() || !this.registerEmail.trim() ||
        !this.registerPassword || !this.confirmPassword) {
      await this.showToast('Please complete all fields.');
      return;
    }

    if (this.registerPassword.length < 6) {
      await this.showToast('Password must be at least 6 characters.');
      return;
    }

    if (this.registerPassword !== this.confirmPassword) {
      await this.showToast('Passwords do not match.');
      return;
    }

    try {
      await this.appData.signUp(
        this.fullName,
        this.registerEmail,
        this.registerPassword
      );
      this.loginEmail = this.registerEmail;
      this.loginPassword = '';
      this.screen = 'login';
      await this.showToast('Demo registration is not saved. Use the login form to continue.');
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'Account creation failed. Please try again.'
      );
    }
  }

  async forgotPassword(): Promise<void> {
    if (!this.loginEmail.trim() || !this.loginEmail.includes('@')) {
      await this.showToast('Enter your account email first to request a password reset.');
      return;
    }
    try {
      await this.appData.resetPassword(this.loginEmail);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'Password reset could not be requested.'
      );
    }
  }

  async continueAsGuest(): Promise<void> {
    try {
      await this.appData.setGuest();
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      await this.showToast(
        error instanceof Error ? error.message : 'Could not continue as guest.'
      );
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom'
    });
    await toast.present();
  }
}