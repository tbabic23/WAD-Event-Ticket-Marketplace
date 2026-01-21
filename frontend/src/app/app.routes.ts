import { Routes } from '@angular/router';
import { App } from './app';
import { LoginComponent } from './components/login';
import { RegisterComponent } from './components/register';
import { HomeComponent } from './components/home';
import { MarketplaceComponent } from "./components/marketplace";
import { AboutComponent } from "./components/aboutus";
import { ProfileComponent } from './components/profile';
import { AdminComponent } from './components/adminpage';
import { ScanComponent } from './components/scan';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'tickets', component: MarketplaceComponent },
    { path: 'about', component: AboutComponent },
    { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
    { path: 'scan', component: ScanComponent },
    { path: '**', redirectTo: '' }];