import { Component, signal, OnInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit{
  username: string | null = null;

  ngOnInit() {
    this.username = localStorage.getItem('username');
  }
  protected readonly title = signal('frontend');
}
