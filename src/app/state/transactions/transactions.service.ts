import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from './transactions.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private apiUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(seasonId: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/season/${seasonId}`);
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }
} 