import { Component, signal, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'], // fixed typo: styleUrls
})
export class App implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  user: any = null;
  hideLogo = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Auth status
    this.authService.isAuthenticated$.subscribe((isAuth) => {
      this.isLoggedIn = isAuth;
      if (isAuth) {
        this.user = this.authService.getUser();
        this.isAdmin = this.user?.role === 'admin';
      } else {
        this.user = null;
        this.isAdmin = false;
      }
    });

    // Watch route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Hide logo if on admin or marketplace page
        const currentUrl = event.urlAfterRedirects;
        this.hideLogo = currentUrl.startsWith('/admin') || currentUrl.startsWith('/tickets');
      });
  }

  protected readonly title = signal('frontend');
}
