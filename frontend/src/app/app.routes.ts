import { Routes } from '@angular/router';
import { ApiService } from './services/message';
import { App } from './app';
import { LoginComponent } from './components/login';
import { HomeComponent } from './components/home';
import { MarketplaceComponent } from "./components/marketplace";
import { AboutComponent } from "./components/aboutus";

export const routes: Routes = [ 
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'tickets', component: MarketplaceComponent },
    { path: 'about', component: AboutComponent },
    { path: '**', redirectTo: '' }];
