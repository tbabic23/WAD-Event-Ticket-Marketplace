import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
import { AuthService } from '../services/auth.service';
import { EventModalComponent } from './event-modal';
import { ManageEventModalComponent } from './manage-event-modal';
import { BuyTicketModalComponent } from './buy-ticket-modal';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [CommonModule, EventModalComponent, ManageEventModalComponent, BuyTicketModalComponent, RouterLink, FormsModule],
    templateUrl: './marketplace.html',
    styleUrls: ['./marketplace.css']
})
export class MarketplaceComponent implements OnInit {
    events: any[] = [];
    showModal = false;
    showManageModal = false;
    showBuyModal = false;
    selectedEventId: number | null = null;
    selectedEvent: any = null;
    user: any = null;
    canCreateEvents = false;

    search = '';
    selectedLocation = '';
    selectedDate = '';
    selectedDateUntil = '';
    confirmedOnly = false;
    selectedCategory = '';
    sortBy = 'soonest';
    locations: string[] = [];
    categories: string[] = [];

    constructor(
        private eventService: EventService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadFilterOptions();
        this.loadEvents();
        this.user = this.authService.getUser();
        this.canCreateEvents = this.user && (this.user.role === 'admin' || this.user.role === 'creator');
    }

    loadFilterOptions() {
        this.eventService.getFilterOptions().subscribe({
            next: (options) => {
                this.locations = options.locations || [];
                this.categories = options.categories || [];
            },
            error: (err) => {
                console.error('Failed to load filter options:', err);
            }
        });
    }

    loadEvents() {
        const params: any = {};
        if (this.search) params.search = this.search;
        if (this.selectedLocation) params.location = this.selectedLocation;
        if (this.selectedDate) params.date = this.selectedDate;
        if (this.selectedDateUntil) params.date_until = this.selectedDateUntil;
        if (this.confirmedOnly) params.confirmed = 'true';
        if (this.selectedCategory) params.category = this.selectedCategory;
        params.sort = this.sortBy;

        this.eventService.getAllEvents(params).subscribe({
            next: (events) => {
                this.events = events;
            },
            error: (err) => {
                console.error('Failed to load events:', err);
            }
        });
    }

    onFilterChange() {
        this.loadEvents();
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

    closeBuyModal() {
        this.showBuyModal = false;
        this.selectedEvent = null;
    }

    onEventCreated() {
        this.loadEvents();
    }

    onEventDeleted() {
        this.loadEvents();
    }

    onPurchaseComplete() {
        this.loadEvents();
    }

    openManageModal(eventId: number) {
        this.selectedEventId = eventId;
        this.showManageModal = true;
    }

    buyTicket(event: any) {
        if (!this.user) {
            this.router.navigate(['/login']);
            return;
        }
        this.selectedEvent = event;
        this.showBuyModal = true;
    }

    isEventCreator(event: any): boolean {
        return this.user && event.creator_id === this.user.id;
    }

    isAdmin(): boolean {
        return this.user && this.user.role === 'admin';
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
