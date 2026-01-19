import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-manage-event-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-event-modal.html',
  styleUrls: ['./manage-event-modal.css']
})
export class ManageEventModalComponent implements OnInit {
  @Input() eventId!: number;
  @Output() close = new EventEmitter<void>();

  event: any = null;
  ticketStats: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.loadEventData();
  }

  loadEventData() {
    this.isLoading = true;

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loadTicketStats();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load event data';
        this.isLoading = false;
      }
    });
  }

  loadTicketStats() {
    this.eventService.getEventStats(this.eventId).subscribe({
      next: (stats) => {
        this.ticketStats = stats;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load ticket statistics';
        this.isLoading = false;
      }
    });
  }

  closeModal() {
    this.close.emit();
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

  getTotalSold(): number {
    return this.ticketStats.reduce((sum, ticket) => sum + ticket.quantity_sold, 0);
  }

  getTotalRevenue(): number {
    return this.ticketStats.reduce((sum, ticket) => sum + (ticket.quantity_sold * ticket.price), 0);
  }
}
