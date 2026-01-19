import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';
import { AuthService } from '../services/auth.service';

interface TicketType {
  name: string;
  price: number | null;
  quantity: number | null;
}

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-modal.html',
  styleUrls: ['./event-modal.css']
})
export class EventModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() eventCreated = new EventEmitter<void>();

  title = '';
  description = '';
  venue = '';
  address = '';
  city = '';
  country = '';
  event_date = '';
  event_end_date = '';
  category = '';
  image_url = '';
  errorMessage = '';
  isLoading = false;

  ticketTypes: TicketType[] = [{ name: '', price: null, quantity: null }];

  constructor(
    private eventService: EventService,
    private authService: AuthService
  ) {}

  closeModal() {
    this.close.emit();
  }

  addTicketType() {
    this.ticketTypes.push({ name: '', price: null, quantity: null });
  }

  removeTicketType(index: number) {
    if (this.ticketTypes.length > 1) {
      this.ticketTypes.splice(index, 1);
    }
  }

  createEvent() {
    this.errorMessage = '';

    if (!this.title || !this.venue || !this.event_date) {
      this.errorMessage = 'Title, venue, and event date are required';
      return;
    }

    const validTicketTypes = this.ticketTypes.filter(
      tt => tt.name && tt.price !== null && tt.quantity !== null
    );

    if (validTicketTypes.length === 0) {
      this.errorMessage = 'At least one ticket type is required';
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'You must be logged in to create an event';
      return;
    }

    this.isLoading = true;

    const eventData = {
      creator_id: user.id,
      title: this.title,
      description: this.description,
      venue: this.venue,
      address: this.address,
      city: this.city,
      country: this.country,
      event_date: this.event_date,
      event_end_date: this.event_end_date || null,
      category: this.category || null,
      image_url: this.image_url || null,
      ticket_types: validTicketTypes
    };

    this.eventService.createEvent(eventData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.eventCreated.emit();
        this.closeModal();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Failed to create event. Please try again.';
      }
    });
  }
}
