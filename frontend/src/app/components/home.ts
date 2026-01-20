import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div *ngIf="user" class="welcome-message">
        <h1>Welcome back, {{ user.first_name || user.username }}!</h1>
        <p>You are logged in as <strong>{{ user.role }}</strong></p>
      </div>
      <div *ngIf="!user" class="welcome-message">
        <h1>Welcome to TicketMarket</h1>
        <p>Please log in to continue</p>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .welcome-message {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .welcome-message h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #333;
    }
    .welcome-message p {
      font-size: 18px;
      color: #666;
    }
    .welcome-message strong {
      color: #2563eb;
      text-transform: capitalize;
    }
  `]
})
export class HomeComponent implements OnInit {
  user: any = null;

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  }
}