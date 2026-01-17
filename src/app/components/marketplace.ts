import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [CommonModule], 
    templateUrl: './marketplace.html',
    styleUrls: ['./marketplace.css']
})
export class MarketplaceComponent {
    tickets = [
        { title: 'Music Festival', date: 'June 20, 2026', city: 'LA', price: 59 },
        { title: 'Tech Conference', date: 'July 12, 2026', city: 'NY', price: 120 },
        { title: 'Football Finals', date: 'August 5, 2026', city: 'London', price: 90 }
    ];

    buy(ticket: any) {
        console.log('Buying:', ticket);
    }
}
