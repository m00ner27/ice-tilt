import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction } from '../models/models/transaction.interface';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/api/transactions`);
  }

  createTransaction(transaction: Omit<Transaction, '_id' | 'date'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/api/transactions`, transaction);
  }

  logPlayerSigning(clubId: string, clubName: string, clubLogoUrl: string, playerId: string, playerName: string, seasonId: string, seasonName: string, createdBy?: string): Observable<Transaction> {
    const transaction: Omit<Transaction, '_id' | 'date'> = {
      clubId,
      clubName,
      clubLogoUrl,
      playerId,
      playerName,
      transactionType: 'sign',
      seasonId,
      seasonName,
      createdBy
    };
    return this.createTransaction(transaction);
  }

  logPlayerRelease(clubId: string, clubName: string, clubLogoUrl: string, playerId: string, playerName: string, seasonId: string, seasonName: string, createdBy?: string): Observable<Transaction> {
    const transaction: Omit<Transaction, '_id' | 'date'> = {
      clubId,
      clubName,
      clubLogoUrl,
      playerId,
      playerName,
      transactionType: 'release',
      seasonId,
      seasonName,
      createdBy
    };
    return this.createTransaction(transaction);
  }
} 