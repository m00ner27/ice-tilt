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

  getTransactions(page: number = 1, limit: number = 50, seasonName?: string, clubName?: string): Observable<{transactions: Transaction[], pagination: any}> {
    let url = `${this.apiUrl}/api/transactions?page=${page}&limit=${limit}`;
    if (seasonName && seasonName !== 'All') {
      url += `&seasonName=${encodeURIComponent(seasonName)}`;
    }
    if (clubName && clubName !== 'All') {
      url += `&clubName=${encodeURIComponent(clubName)}`;
    }
    return this.http.get<{transactions: Transaction[], pagination: any}>(url);
  }

  getClubsWithTransactions(seasonName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/api/transactions/clubs/${encodeURIComponent(seasonName)}`);
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