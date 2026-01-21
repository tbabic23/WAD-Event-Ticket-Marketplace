import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://spider.foi.hr:12150/api/events';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllEvents(params?: any): Observable<any[]> {
    let url = this.apiUrl;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += `?${query}`;
    }
    return this.http.get<any[]>(url);
  }

  updateConfirmed(id: number, confirmed: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/confirmed`, { confirmed }, { headers: this.getHeaders() });
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

  getFilterOptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/filters`);
  }

  getMyEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-events`, { headers: this.getHeaders() });
  }
}
