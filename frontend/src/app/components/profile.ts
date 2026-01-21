import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { TicketService } from '../services/ticket.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  user: any = null;
  activeTab: 'profile' | 'tickets' | 'orders' | 'events' = 'profile';
  tickets: any[] = [];
  orders: any[] = [];
  myEvents: any[] = [];
  isLoading = false;
  selectedTicketQR: string | null = null;
  selectedTicketCode: string | null = null;

  showScanModal = false;
  selectedEventForScan: any = null;
  scanTicketCode = '';
  scanResult: any = null;
  showScanResult = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private ticketService: TicketService,
    private eventService: EventService
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  isCreatorOrAdmin(): boolean {
    return this.user && (this.user.role === 'creator' || this.user.role === 'admin');
  }

  switchTab(tab: 'profile' | 'tickets' | 'orders' | 'events') {
    this.activeTab = tab;
    if (tab === 'tickets' && this.tickets.length === 0) {
      this.loadTickets();
    } else if (tab === 'orders' && this.orders.length === 0) {
      this.loadOrders();
    } else if (tab === 'events' && this.myEvents.length === 0) {
      this.loadMyEvents();
    }
  }

  loadTickets() {
    this.isLoading = true;
    this.ticketService.getMyTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tickets:', err);
        this.isLoading = false;
      }
    });
  }

  loadOrders() {
    this.isLoading = true;
    this.ticketService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.isLoading = false;
      }
    });
  }

  generateQR(ticket: any) {
    this.ticketService.generateQRCode(ticket.id).subscribe({
      next: (response) => {
        this.selectedTicketQR = response.qrCode;
        this.selectedTicketCode = response.ticketCode;
      },
      error: (err) => {
        console.error('Failed to generate QR code:', err);
      }
    });
  }

  closeQR() {
    this.selectedTicketQR = null;
    this.selectedTicketCode = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'valid': return 'status-valid';
      case 'used': return 'status-used';
      case 'cancelled': return 'status-cancelled';
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  loadMyEvents() {
    this.isLoading = true;
    this.eventService.getMyEvents().subscribe({
      next: (events) => {
        this.myEvents = events;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.isLoading = false;
      }
    });
  }

  openScanModal(event: any) {
    this.selectedEventForScan = event;
    this.showScanModal = true;
    this.scanTicketCode = '';
    this.scanResult = null;
    this.showScanResult = false;
  }

  closeScanModal() {
    this.showScanModal = false;
    this.selectedEventForScan = null;
    this.scanTicketCode = '';
    this.scanResult = null;
    this.showScanResult = false;
  }

  scanTicket() {
    if (!this.scanTicketCode || !this.selectedEventForScan) {
      return;
    }

    this.ticketService.scanTicket(this.scanTicketCode, this.selectedEventForScan.id).subscribe({
      next: (result) => {
        this.scanResult = result;
        this.showScanResult = true;
        this.scanTicketCode = '';

        setTimeout(() => {
          this.showScanResult = false;
          if (result.success) {
            setTimeout(() => {
              this.closeScanModal();
            }, 1000);
          }
        }, 3000);
      },
      error: (err) => {
        this.scanResult = {
          success: false,
          message: err.error?.error || 'Failed to scan ticket'
        };
        this.showScanResult = true;
        setTimeout(() => {
          this.showScanResult = false;
        }, 3000);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
