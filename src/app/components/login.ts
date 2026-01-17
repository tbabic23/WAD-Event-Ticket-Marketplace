import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  username = '';
  password = '';
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    console.log('Attempting login with', this.username, this.password);
    this.http.post<any>('http://localhost:3000/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.message = res.message;
        localStorage.removeItem('username')
        localStorage.setItem('username', this.username);
        this.router.navigate(['/']); 
      },
      error: (err) => {
        this.message = err.error?.message || 'Login failed';
      }
    });
  }
}