import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserService, User } from '../services/user.service';
import { TicketService } from '../services/ticket.service';
import { EventService } from '../services/event.service';
import { ManageEventModalComponent } from './manage-event-modal';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule, ManageEventModalComponent],
    templateUrl: './adminpage.html',
    styleUrls: ['./adminpage.css']
})
export class AdminComponent implements OnInit {
    menuItems = [
        { title: 'Manage Events', content: 'View, edit, or delete events.' },
        { title: 'Manage Users', content: 'View users, edit details, and manage roles.' },
        { title: 'Manage Tickets', content: 'View and manage all tickets in the system.' }
    ];

    selectedIndex = 1;
    sidebarOpen = true;

    users: User[] = [];
    selectedUser: User | null = null;
    newPassword = '';

    allTickets: any[] = [];
    filteredTickets: any[] = [];
    searchQuery = '';
    selectedEventFilter = '';
    selectedStatusFilter = '';
    scanTicketCode = '';
    scanResult: any = null;
    showScanResult = false;

    allEvents: any[] = [];
    showManageModal = false;
    selectedEventId: number | null = null;

    constructor(
        private userService: UserService,
        private ticketService: TicketService,
        private eventService: EventService
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    selectMenu(index: number) {
        this.selectedIndex = index;
        if (this.menuItems[index].title === 'Manage Users') this.loadUsers();
        if (this.menuItems[index].title === 'Manage Tickets') this.loadAllTickets();
        if (this.menuItems[index].title === 'Manage Events') this.loadAllEvents();
        this.selectedUser = null;
    }

    loadAllEvents() {
        this.eventService.getAllEvents().subscribe({
            next: (events) => {
                this.allEvents = events;
            },
            error: (err) => console.error('Failed to load events:', err)
        });
    }

    openEditEvent(eventId: number) {
        this.selectedEventId = eventId;
        this.showManageModal = true;
    }

    closeManageModal() {
        this.showManageModal = false;
        this.selectedEventId = null;
        this.loadAllEvents();
    }

    deleteEvent(event: any) {
        if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
            this.eventService.deleteEvent(event.id).subscribe({
                next: () => {
                    alert('Event deleted successfully');
                    this.loadAllEvents();
                },
                error: (err) => {
                    console.error('Failed to delete event:', err);
                    alert('Failed to delete event');
                }
            });
        }
    }

    loadUsers() {
        this.userService.getUsers().subscribe({
            next: (data) => (this.users = data),
            error: (err) => console.error('Error loading users:', err)
        });
    }

    editUser(user: User) {
        this.selectedUser = { ...user };
        this.newPassword = '';
    }

    saveUser() {
        if (!this.selectedUser) return;

        this.userService.updateUser(this.selectedUser.id, {
            first_name: this.selectedUser.first_name,
            last_name: this.selectedUser.last_name,
            role: this.selectedUser.role
        }).subscribe({
            next: () => {
                alert('User updated successfully');
                this.loadUsers();
                this.selectedUser = null;
            },
            error: (err) => {
                console.error('Failed to update user:', err);
                alert('Failed to update user');
            }
        });

        if (this.newPassword) {
            this.userService.updateUserPassword(this.selectedUser.id, this.newPassword).subscribe({
                next: () => {
                    console.log('Password updated successfully');
                    this.newPassword = '';
                },
                error: (err) => console.error('Failed to update password:', err)
            });
        }
    }

    cancelEdit() {
        this.selectedUser = null;
        this.newPassword = '';
    }

    loadAllTickets() {
        this.ticketService.getAllTickets().subscribe({
            next: (tickets) => {
                this.allTickets = tickets;
                this.filteredTickets = tickets;
            },
            error: (err) => console.error('Failed to load tickets:', err)
        });
    }

    filterTickets() {
        this.filteredTickets = this.allTickets.filter(ticket => {
            const matchesSearch = !this.searchQuery ||
                ticket.ticket_code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                ticket.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                ticket.event_title.toLowerCase().includes(this.searchQuery.toLowerCase());

            const matchesEvent = !this.selectedEventFilter || ticket.event_title === this.selectedEventFilter;
            const matchesStatus = !this.selectedStatusFilter || ticket.status === this.selectedStatusFilter;

            return matchesSearch && matchesEvent && matchesStatus;
        });
    }

    getUniqueEvents(): string[] {
        return [...new Set(this.allTickets.map(t => t.event_title))];
    }

    scanTicketAdmin(ticketCode: string, eventId: number) {
        this.ticketService.scanTicket(ticketCode, eventId).subscribe({
            next: (result) => {
                this.scanResult = result;
                this.showScanResult = true;

                if (result.success) {
                    this.loadAllTickets();
                }

                setTimeout(() => {
                    this.showScanResult = false;
                    this.scanTicketCode = '';
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

    useTicketAdmin(ticket: any) {
        this.scanTicketAdmin(ticket.ticket_code, ticket.event_id);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
