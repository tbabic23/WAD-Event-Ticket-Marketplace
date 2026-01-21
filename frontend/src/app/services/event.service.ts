import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:12150/api/events';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createEvent(eventData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, eventData, { headers: this.getHeaders() });
    }

    updateEvent(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
    }



  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getEventStats(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/stats`);
  }
}
