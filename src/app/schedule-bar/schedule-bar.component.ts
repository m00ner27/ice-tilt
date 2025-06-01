import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Match {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

@Component({
  selector: 'app-schedule-bar',
  standalone: true,
  templateUrl: './schedule-bar.component.html',
  styleUrls: ['./schedule-bar.component.css'],
  imports: [CommonModule, RouterModule]
})
export class ScheduleBarComponent implements OnInit {
  matches: Match[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Match[]>('assets/data/mock_matches.json').subscribe(data => {
      this.matches = data;
    });
  }

  getTeamLogo(team: string): string {
    if (!team) return 'assets/images/square-default.png';
    // Map for special cases
    const teamMap: { [key: string]: string } = {
      'roosters': 'square-iserlohnroosters.png',
      // Add more mappings as needed
    };
    const key = team.replace(/\s+/g, '').toLowerCase();
    if (teamMap[key]) {
      return 'assets/images/' + teamMap[key];
    }
    return 'assets/images/square-' + key + '.png';
  }
}
