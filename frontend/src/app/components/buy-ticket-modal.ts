import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-buy-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buy-ticket-modal.html',
  styleUrls: ['./buy-ticket-modal.css']
})
export class BuyTicketModalComponent implements OnInit {
  @Input() event: any;
  @Output() close = new EventEmitter<void>();
  @Output() purchaseComplete = new EventEmitter<void>();

  step = 1;
  ticketTypes: any[] = [];
  selectedTicketType: any = null;
  quantity = 1;
  isLoading = false;
  errorMessage = '';
  showSuccess = false;

  cardNumber = '';
  expiryMonth = '';
  expiryYear = '';
  cvv = '';
  cardholderName = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTicketTypes();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadTicketTypes() {
    this.isLoading = true;
    this.http.get<any[]>(`http://spider.foi.hr:12150/api/events/${this.event.id}/ticket-types`).subscribe({
      next: (types) => {
        this.ticketTypes = types;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load ticket types';
        this.isLoading = false;
      }
    });
  }

  selectTicketType(type: any) {
    this.selectedTicketType = type;
  }

  nextStep() {
    if (!this.selectedTicketType || this.quantity < 1) {
      this.errorMessage = 'Please select a ticket type and quantity';
      return;
    }
    if (this.quantity > this.selectedTicketType.quantity_available - this.selectedTicketType.quantity_sold) {
      this.errorMessage = 'Not enough tickets available';
      return;
    }
    this.step = 2;
    this.errorMessage = '';
  }

  previousStep() {
    this.step = 1;
  }

  finishPurchase() {
    if (!this.cardNumber || !this.expiryMonth || !this.expiryYear || !this.cvv || !this.cardholderName) {
      this.errorMessage = 'Please fill all payment fields';
      return;
    }

    this.isLoading = true;
    const payment = {
      cardNumber: this.cardNumber,
      expiryMonth: this.expiryMonth,
      expiryYear: this.expiryYear,
      cvv: this.cvv,
      cardholderName: this.cardholderName
    };

    this.http.post(`http://spider.foi.hr:12150/api/events/${this.event.id}/buy`, {
      ticketTypeId: this.selectedTicketType.id,
      quantity: this.quantity,
      payment
    }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess = true;
        setTimeout(() => {
          this.purchaseComplete.emit();
          this.close.emit();
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Purchase failed';
        this.isLoading = false;
      }
    });
  }

  getTotalPrice(): number {
    return this.selectedTicketType ? this.selectedTicketType.price * this.quantity : 0;
  }
}