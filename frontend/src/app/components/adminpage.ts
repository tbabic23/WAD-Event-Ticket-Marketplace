import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserService, User } from '../services/user.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule],
    templateUrl: './adminpage.html',
    styleUrls: ['./adminpage.css']
})
export class AdminComponent implements OnInit {
    menuItems = [
        { title: 'Manage Events', content: 'View, edit, or delete events.' },
        { title: 'Manage Users', content: 'View users, edit details, and manage roles.' },
        { title: 'Site Settings', content: 'Update global site settings.' }
    ];

    selectedIndex = 1; // по умолчанию Manage Users
    sidebarOpen = true;

    users: User[] = [];
    selectedUser: User | null = null;
    newPassword = '';

    constructor(private userService: UserService) { }

    ngOnInit() {
        this.loadUsers();
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    selectMenu(index: number) {
        this.selectedIndex = index;
        if (this.menuItems[index].title === 'Manage Users') this.loadUsers();
        this.selectedUser = null;
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

        // Сначала обновляем основные данные
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

        // Если введён новый пароль, обновляем его
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
}
