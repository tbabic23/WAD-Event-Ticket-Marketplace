import { Routes } from '@angular/router';
import { ApiService } from './services/message';
import { App } from './app';
import { LoginComponent } from './components/login';
import { HomeComponent } from './components/home';
import { MarketplaceComponent } from "./components/marketplace";
import { AboutComponent } from "./components/aboutus";
import { ProfileComponent } from './components/profile';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'tickets', component: MarketplaceComponent },
    { path: 'about', component: AboutComponent },
    { path: '**', redirectTo: '' }];
