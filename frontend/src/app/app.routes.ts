import { Routes } from '@angular/router';
import { ApiService } from './services/message';
import { App } from './app';
import { LoginComponent } from './components/login';
import { HomeComponent } from './components/home';

export const routes: Routes = [ 
{ path: '', component: HomeComponent },
{ path: 'login', component: LoginComponent },];
