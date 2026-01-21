import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TicketService } from '../services/ticket.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.html',
  styleUrl: './scan.css'
})
export class ScanComponent implements OnInit {
  ticketCode: string | null = null;
  eventId: number | null = null;
  isScanning = true;
  scanResult: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.ticketCode = params['code'];
      this.eventId = params['event'] ? Number(params['event']) : null;

      if (this.ticketCode && this.eventId) {
        this.scanTicket();
      } else {
        this.scanResult = {
          success: false,
          message: 'Invalid QR code: missing ticket code or event ID'
        };
        this.isScanning = false;
      }
    });
  }

  scanTicket() {
    if (!this.ticketCode || !this.eventId) {
      return;
    }

    this.ticketService.scanTicket(this.ticketCode, this.eventId).subscribe({
      next: (result) => {
        this.scanResult = result;
        this.isScanning = false;
      },
      error: (err) => {
        this.scanResult = {
          success: false,
          message: err.error?.error || 'Failed to scan ticket'
        };
        this.isScanning = false;
      }
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToMarketplace() {
    this.router.navigate(['/tickets']);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
