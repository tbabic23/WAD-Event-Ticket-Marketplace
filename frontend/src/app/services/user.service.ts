import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'creator' | 'buyer';
    first_name?: string;
    last_name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private apiUrl = 'http://localhost:12150/api/user';

    constructor(private http: HttpClient) { }

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    updateUser(id: number, data: Partial<User>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    updateUserPassword(id: number, password: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/password`, { password });
    }


    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}