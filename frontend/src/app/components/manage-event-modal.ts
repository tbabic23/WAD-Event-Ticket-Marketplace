import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';
import { AuthService } from '../services/auth.service';
import { TicketService } from '../services/ticket.service';

@Component({
    selector: 'app-manage-event-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
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
    confirmed = false;
    isAdmin = false;
    activeTab: 'info' | 'tickets' | 'scan' = 'info';
    eventTickets: any[] = [];
    scanTicketCode = '';
    scanResult: any = null;
    showScanResult = false;

    constructor(
        private eventService: EventService,
        private authService: AuthService,
        private ticketService: TicketService
    ) { }

    ngOnInit() {
        this.isAdmin = this.authService.getUser()?.role === 'admin';
        this.loadEventData();
    }

    loadEventData() {
        this.isLoading = true;
        this.eventService.getEventById(this.eventId).subscribe({
            next: (event) => {
                this.event = event;
                this.confirmed = event.confirmed;
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

    updateConfirmed() {
        this.eventService.updateConfirmed(this.eventId, this.confirmed).subscribe({
            next: () => {
            },
            error: (err) => {
                this.errorMessage = 'Failed to update confirmed status';
            }
        });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    getTotalSold(): number {
        return this.ticketStats.reduce((sum, ticket) => sum + ticket.quantity_sold, 0);
    }

    getTotalRevenue(): number {
        return this.ticketStats.reduce((sum, ticket) => sum + (ticket.quantity_sold * ticket.price), 0);
    }

    switchTab(tab: 'info' | 'tickets' | 'scan') {
        this.activeTab = tab;
        if (tab === 'tickets' && this.eventTickets.length === 0) {
            this.loadEventTickets();
        }
    }

    loadEventTickets() {
        this.ticketService.getEventTickets(this.eventId).subscribe({
            next: (tickets) => {
                this.eventTickets = tickets;
            },
            error: (err) => {
                console.error('Failed to load event tickets:', err);
            }
        });
    }

    scanTicket() {
        if (!this.scanTicketCode) {
            return;
        }

        this.ticketService.scanTicket(this.scanTicketCode, this.eventId).subscribe({
            next: (result) => {
                this.scanResult = result;
                this.showScanResult = true;
                this.scanTicketCode = '';

                if (result.success) {
                    this.loadEventTickets();
                    this.loadTicketStats();
                }

                setTimeout(() => {
                    this.showScanResult = false;
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

    useTicket(ticket: any) {
        this.scanTicketCode = ticket.ticket_code;
        this.switchTab('scan');
        setTimeout(() => {
            this.scanTicket();
        }, 500);
    }
}
