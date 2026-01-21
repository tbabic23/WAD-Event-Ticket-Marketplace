import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://spider.foi.hr:12150/api/tickets';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getMyTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-tickets`, { headers: this.getHeaders() });
  }

  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, { headers: this.getHeaders() });
  }

  generateQRCode(ticketId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${ticketId}/qr`, { headers: this.getHeaders() });
  }

  scanTicket(ticketCode: string, eventId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/scan`, { ticketCode, eventId }, { headers: this.getHeaders() });
  }

  getEventTickets(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/event/${eventId}`, { headers: this.getHeaders() });
  }

  getAllTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`, { headers: this.getHeaders() });
  }
}
