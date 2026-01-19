import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
import { AuthService } from '../services/auth.service';
import { EventModalComponent } from './event-modal';
import { ManageEventModalComponent } from './manage-event-modal';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [CommonModule, EventModalComponent, ManageEventModalComponent],
    templateUrl: './marketplace.html',
    styleUrls: ['./marketplace.css']
})
export class MarketplaceComponent implements OnInit {
    events: any[] = [];
    showModal = false;
    showManageModal = false;
    selectedEventId: number | null = null;
    user: any = null;
    canCreateEvents = false;

    constructor(
        private eventService: EventService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.loadEvents();
        this.user = this.authService.getUser();
        this.canCreateEvents = this.user && (this.user.role === 'admin' || this.user.role === 'creator');
    }

    loadEvents() {
        this.eventService.getAllEvents().subscribe({
            next: (events) => {
                this.events = events;
            },
            error: (err) => {
                console.error('Failed to load events:', err);
            }
        });
    }

    openCreateModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    closeManageModal() {
        this.showManageModal = false;
        this.selectedEventId = null;
    }

    onEventCreated() {
        this.loadEvents();
    }

    onEventDeleted() {
        this.loadEvents();
    }

    openManageModal(eventId: number) {
        this.selectedEventId = eventId;
        this.showManageModal = true;
    }

    buyTicket(event: any) {
        console.log('Buying ticket for:', event);
    }

    isEventCreator(event: any): boolean {
        return this.user && event.creator_id === this.user.id;
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatEventDate(startDate: string, endDate?: string): string {
        const start = new Date(startDate);
        const startFormatted = start.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        if (endDate) {
            const end = new Date(endDate);
            const endFormatted = end.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            return `${startFormatted} - ${endFormatted}`;
        }

        return startFormatted;
    }
}
