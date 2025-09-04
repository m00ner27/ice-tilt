import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../store/services/api.service';



interface SkaterEntry {
  gamertag: string;
  position: 'C' | 'LW' | 'RW' | 'LD' | 'RD';
  goals: number;
  assists: number;
  hits: number;
  penaltyMinutes: number;
  shots: number;
  blockedShots: number;
  plusMinus: number;
  giveaways: number;
  takeaways: number;
  interceptions: number;
  faceoffsWon: number;
  faceoffsLost: number;
  passAttempts: number;
  passesCompleted: number;
  timeOnIceMinutes: number;
  timeOnIceSeconds: number;
}

interface GoalieEntry {
  gamertag: string;
  shotsAgainst: number;
  goalsAgainst: number;
  penaltyMinutes: number;
  goals: number;
  assists: number;
  saves: number;
  timeOnIceMinutes: number;
  timeOnIceSeconds: number;
}

interface ManualGameStats {
  homeTeam: string;
  awayTeam: string;
  date: string;
  isOvertime: boolean;
  homeSkaters: SkaterEntry[];
  awaySkaters: SkaterEntry[];
  homeGoalies: GoalieEntry[];
  awayGoalies: GoalieEntry[];
}

@Component({
  selector: 'app-manual-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="manual-stats-container">
      <h2>Manually Enter Stats</h2>
      
      <form [formGroup]="statsForm" (ngSubmit)="onSubmit()">
        
        <!-- Game Information -->
        <div class="game-info-section">
          <div class="teams-row">
            <div class="team-input">
              <label>Away</label>
              <input type="text" formControlName="awayTeam" class="team-name-input" />
            </div>
            <div class="team-input">
              <label>Home</label>
              <input type="text" formControlName="homeTeam" class="team-name-input" />
            </div>
            <div class="date-section">
              <label>Date</label>
              <input type="text" formControlName="date" class="date-input" readonly />
              <div class="overtime-checkbox">
                <label>
                  <input type="checkbox" formControlName="isOvertime" />
                  Overtime Game?
                </label>
              </div>
            </div>
          </div>
        </div>



        <!-- Skater Statistics -->
        <div class="skater-stats-section">
          <div class="stats-container">
            <div class="team-stats-table">
              <h3>{{ statsForm.get('awayTeam')?.value || 'Away Team' }} Skaters</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>SKATER</th>
                    <th>POS</th>
                    <th>G</th>
                    <th>A</th>
                    <th>HITS</th>
                    <th>PIM</th>
                    <th>S</th>
                    <th>BS</th>
                    <th>+/-</th>
                    <th>GVA</th>
                    <th>TKA</th>
                    <th>INT</th>
                    <th>FOW</th>
                    <th>FO</th>
                    <th>PA</th>
                    <th>PC</th>
                    <th>TOI</th>
                  </tr>
                </thead>
                <tbody formArrayName="awaySkaters">
                  <tr *ngFor="let skater of awaySkatersArray.controls; let i = index" [formGroupName]="i">
                    <td><input type="text" formControlName="gamertag" placeholder="Gamertag" /></td>
                    <td>
                      <select formControlName="position">
                        <option value="C">C</option>
                        <option value="LW">LW</option>
                        <option value="RW">RW</option>
                        <option value="LD">LD</option>
                        <option value="RD">RD</option>
                      </select>
                    </td>
                    <td><input type="number" formControlName="goals" min="0" /></td>
                    <td><input type="number" formControlName="assists" min="0" /></td>
                    <td><input type="number" formControlName="hits" min="0" /></td>
                    <td><input type="number" formControlName="penaltyMinutes" min="0" /></td>
                    <td><input type="number" formControlName="shots" min="0" /></td>
                    <td><input type="number" formControlName="blockedShots" min="0" /></td>
                    <td><input type="number" formControlName="plusMinus" /></td>
                    <td><input type="number" formControlName="giveaways" min="0" /></td>
                    <td><input type="number" formControlName="takeaways" min="0" /></td>
                    <td><input type="number" formControlName="interceptions" min="0" /></td>
                    <td><input type="number" formControlName="faceoffsWon" min="0" /></td>
                    <td><input type="number" formControlName="faceoffsLost" min="0" /></td>
                    <td><input type="number" formControlName="passAttempts" min="0" /></td>
                    <td><input type="number" formControlName="passesCompleted" min="0" /></td>
                    <td>
                      <div class="time-inputs">
                        <input type="number" formControlName="timeOnIceMinutes" min="0" max="60" />
                        <span>:</span>
                        <input type="number" formControlName="timeOnIceSeconds" min="0" max="59" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="team-stats-table">
              <h3>{{ statsForm.get('homeTeam')?.value || 'Home Team' }} Skaters</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>SKATER</th>
                    <th>POS</th>
                    <th>G</th>
                    <th>A</th>
                    <th>HITS</th>
                    <th>PIM</th>
                    <th>S</th>
                    <th>BS</th>
                    <th>+/-</th>
                    <th>GVA</th>
                    <th>TKA</th>
                    <th>INT</th>
                    <th>FOW</th>
                    <th>FO</th>
                    <th>PA</th>
                    <th>PC</th>
                    <th>TOI</th>
                  </tr>
                </thead>
                <tbody formArrayName="homeSkaters">
                  <tr *ngFor="let skater of homeSkatersArray.controls; let i = index" [formGroupName]="i">
                    <td><input type="text" formControlName="gamertag" placeholder="Gamertag" /></td>
                    <td>
                      <select formControlName="position">
                        <option value="C">C</option>
                        <option value="LW">LW</option>
                        <option value="RW">RW</option>
                        <option value="LD">LD</option>
                        <option value="RD">RD</option>
                      </select>
                    </td>
                    <td><input type="number" formControlName="goals" min="0" /></td>
                    <td><input type="number" formControlName="assists" min="0" /></td>
                    <td><input type="number" formControlName="hits" min="0" /></td>
                    <td><input type="number" formControlName="penaltyMinutes" min="0" /></td>
                    <td><input type="number" formControlName="shots" min="0" /></td>
                    <td><input type="number" formControlName="blockedShots" min="0" /></td>
                    <td><input type="number" formControlName="plusMinus" /></td>
                    <td><input type="number" formControlName="giveaways" min="0" /></td>
                    <td><input type="number" formControlName="takeaways" min="0" /></td>
                    <td><input type="number" formControlName="interceptions" min="0" /></td>
                    <td><input type="number" formControlName="faceoffsWon" min="0" /></td>
                    <td><input type="number" formControlName="faceoffsLost" min="0" /></td>
                    <td><input type="number" formControlName="passAttempts" min="0" /></td>
                    <td><input type="number" formControlName="passesCompleted" min="0" /></td>
                    <td>
                      <div class="time-inputs">
                        <input type="number" formControlName="timeOnIceMinutes" min="0" max="60" />
                        <span>:</span>
                        <input type="number" formControlName="timeOnIceSeconds" min="0" max="59" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Goalie Statistics -->
        <div class="goalie-stats-section">
          <div class="stats-container">
            <div class="team-stats-table">
              <h3>{{ statsForm.get('awayTeam')?.value || 'Away Team' }} Goalies</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>GOALIE</th>
                    <th>SA</th>
                    <th>GA</th>
                    <th>PIM</th>
                    <th>G</th>
                    <th>A</th>
                    <th>SV</th>
                    <th>TOI</th>
                  </tr>
                </thead>
                <tbody formArrayName="awayGoalies">
                  <tr *ngFor="let goalie of awayGoaliesArray.controls; let i = index" [formGroupName]="i">
                    <td><input type="text" formControlName="gamertag" placeholder="Gamertag" /></td>
                    <td><input type="number" formControlName="shotsAgainst" min="0" /></td>
                    <td><input type="number" formControlName="goalsAgainst" min="0" /></td>
                    <td><input type="number" formControlName="penaltyMinutes" min="0" /></td>
                    <td><input type="number" formControlName="goals" min="0" /></td>
                    <td><input type="number" formControlName="assists" min="0" /></td>
                    <td><input type="number" formControlName="saves" min="0" /></td>
                    <td>
                      <div class="time-inputs">
                        <input type="number" formControlName="timeOnIceMinutes" min="0" max="60" />
                        <span>:</span>
                        <input type="number" formControlName="timeOnIceSeconds" min="0" max="59" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="team-stats-table">
              <h3>{{ statsForm.get('homeTeam')?.value || 'Home Team' }} Goalies</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>GOALIE</th>
                    <th>SA</th>
                    <th>GA</th>
                    <th>PIM</th>
                    <th>G</th>
                    <th>A</th>
                    <th>SV</th>
                    <th>TOI</th>
                  </tr>
                </thead>
                <tbody formArrayName="homeGoalies">
                  <tr *ngFor="let goalie of homeGoaliesArray.controls; let i = index" [formGroupName]="i">
                    <td><input type="text" formControlName="gamertag" placeholder="Gamertag" /></td>
                    <td><input type="number" formControlName="shotsAgainst" min="0" /></td>
                    <td><input type="number" formControlName="goalsAgainst" min="0" /></td>
                    <td><input type="number" formControlName="penaltyMinutes" min="0" /></td>
                    <td><input type="number" formControlName="goals" min="0" /></td>
                    <td><input type="number" formControlName="assists" min="0" /></td>
                    <td><input type="number" formControlName="saves" min="0" /></td>
                    <td>
                      <div class="time-inputs">
                        <input type="number" formControlName="timeOnIceMinutes" min="0" max="60" />
                        <span>:</span>
                        <input type="number" formControlName="timeOnIceSeconds" min="0" max="59" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="save-btn" [disabled]="statsForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Enter Stats' }}
          </button>
          <button type="button" class="cancel-btn" (click)="cancel()">Cancel</button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .manual-stats-container {
      max-width: 1400px;
      margin: 20px auto;
      background: #23293a;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
      color: white;
    }

    h2 {
      color: #90caf9;
      margin-bottom: 24px;
      text-align: center;
      font-size: 2rem;
    }

    h3 {
      color: #90caf9;
      margin: 20px 0 16px;
      font-size: 1.3rem;
    }

    /* Game Information Section */
    .game-info-section {
      background: #1a1f2e;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .teams-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .team-input {
      display: flex;
      flex-direction: column;
    }

    .team-input label {
      color: #90caf9;
      font-size: 0.9rem;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .team-name-input {
      background: #2c3446;
      border: 1px solid #394867;
      color: white;
      padding: 12px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
    }

    .date-section {
      display: flex;
      flex-direction: column;
    }

    .date-section label {
      color: #90caf9;
      font-size: 0.9rem;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .date-input {
      background: #2c3446;
      border: 1px solid #394867;
      color: white;
      padding: 12px;
      border-radius: 6px;
      font-size: 1rem;
      margin-bottom: 12px;
    }

    .overtime-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .overtime-checkbox label {
      color: #90caf9;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .overtime-checkbox input[type="checkbox"] {
      accent-color: #2196f3;
      width: 18px;
      height: 18px;
    }



    /* Skater and Goalie Statistics */
    .skater-stats-section,
    .goalie-stats-section {
      margin-bottom: 32px;
    }

    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .team-stats-table {
      background: #1a1f2e;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #394867;
    }

    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    .stats-table th {
      background: #2c3446;
      color: #90caf9;
      padding: 8px 2px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
      border-bottom: 1px solid #394867;
    }

    .stats-table td {
      padding: 6px 2px;
      border-bottom: 1px solid #394867;
      text-align: center;
    }

    /* Column width adjustments */
    .stats-table th:nth-child(1), /* SKATER */
    .stats-table td:nth-child(1) {
      min-width: 100px;
      max-width: 120px;
    }

    .stats-table th:nth-child(2), /* POS */
    .stats-table td:nth-child(2) {
      min-width: 50px;
      max-width: 60px;
    }

    .stats-table th:nth-child(3), /* G */
    .stats-table td:nth-child(3),
    .stats-table th:nth-child(4), /* A */
    .stats-table td:nth-child(4),
    .stats-table th:nth-child(5), /* HITS */
    .stats-table td:nth-child(5),
    .stats-table th:nth-child(6), /* PIM */
    .stats-table td:nth-child(6),
    .stats-table th:nth-child(7), /* S */
    .stats-table td:nth-child(7),
    .stats-table th:nth-child(8), /* BS */
    .stats-table td:nth-child(8),
    .stats-table th:nth-child(9), /* +/- */
    .stats-table td:nth-child(9),
    .stats-table th:nth-child(10), /* GVA */
    .stats-table td:nth-child(10),
    .stats-table th:nth-child(11), /* TKA */
    .stats-table td:nth-child(11),
    .stats-table th:nth-child(12), /* INT */
    .stats-table td:nth-child(12),
    .stats-table th:nth-child(13), /* FOW */
    .stats-table td:nth-child(13),
    .stats-table th:nth-child(14), /* FO */
    .stats-table td:nth-child(14),
    .stats-table th:nth-child(15), /* PA */
    .stats-table td:nth-child(15),
    .stats-table th:nth-child(16), /* PC */
    .stats-table td:nth-child(16) {
      min-width: 35px;
      max-width: 45px;
    }

    .stats-table th:nth-child(17), /* TOI */
    .stats-table td:nth-child(17) {
      min-width: 80px;
      max-width: 90px;
    }

    .stats-table input,
    .stats-table select {
      background: #2c3446;
      border: 1px solid #394867;
      color: white;
      padding: 4px 4px;
      border-radius: 4px;
      font-size: 0.8rem;
      width: 100%;
      text-align: center;
      box-sizing: border-box;
    }

    /* Specific input sizing for different column types */
    .stats-table td:nth-child(1) input { /* SKATER */
      text-align: left;
      padding: 4px 6px;
    }

    .stats-table td:nth-child(2) select { /* POS */
      padding: 4px 2px;
    }

    .stats-table td:nth-child(17) .time-inputs { /* TOI */
      justify-content: center;
      gap: 4px;
    }

    .stats-table td:nth-child(17) .time-inputs input {
      width: 35px;
      padding: 2px 4px;
      text-align: center;
    }

    .stats-table input:focus,
    .stats-table select:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
    }

    .stats-table input[type="text"] {
      text-align: left;
    }

    .stats-table select {
      min-width: 60px;
    }

    .stats-table .time-inputs {
      justify-content: center;
    }

    .stats-table .time-inputs input {
      width: 40px;
      padding: 2px 4px;
    }

    /* Actions */
    .actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #394867;
    }

    .save-btn,
    .cancel-btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      min-width: 120px;
    }

    .save-btn {
      background: #43a047;
      color: #fff;
    }

    .save-btn:hover:not(:disabled) {
      background: #388e3c;
    }

    .save-btn:disabled {
      background: #666;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #d32f2f;
      color: #fff;
    }

    .cancel-btn:hover {
      background: #b71c1c;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .stats-table th,
      .stats-table td {
        font-size: 0.75rem;
        padding: 4px 1px;
      }

      .stats-table input,
      .stats-table select {
        font-size: 0.75rem;
        padding: 2px 2px;
      }

      /* Adjust column widths for medium screens */
      .stats-table th:nth-child(1),
      .stats-table td:nth-child(1) {
        min-width: 80px;
        max-width: 100px;
      }

      .stats-table th:nth-child(17),
      .stats-table td:nth-child(17) {
        min-width: 70px;
        max-width: 80px;
      }

      .stats-table td:nth-child(17) .time-inputs input {
        width: 30px;
      }
    }

    @media (max-width: 768px) {
      .manual-stats-container {
        margin: 10px;
        padding: 16px;
      }

      .teams-row {
        grid-template-columns: 1fr;
        gap: 16px;
      }



      .stats-table {
        font-size: 0.7rem;
      }

      .stats-table th,
      .stats-table td {
        padding: 2px 1px;
      }

      .actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class ManualStatsComponent implements OnInit {
  game: any;
  statsForm: FormGroup;
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.statsForm = this.fb.group({
      homeTeam: [''],
      awayTeam: [''],
      date: [''],
      isOvertime: [false],
      homeSkaters: this.fb.array([]),
      awaySkaters: this.fb.array([]),
      homeGoalies: this.fb.array([]),
      awayGoalies: this.fb.array([])
    });
  }

  ngOnInit() {
    const gameId = this.route.snapshot.paramMap.get('gameId');
    if (gameId) {
      this.loadGame(gameId);
    }

    // Initialize with default entries
    this.initializeDefaultEntries();
  }

  initializeDefaultEntries() {
    // Add 10 skaters for each team
    for (let i = 0; i < 10; i++) {
      this.addSkaterEntry('home');
      this.addSkaterEntry('away');
    }

    // Add 2 goalies for each team
    for (let i = 0; i < 2; i++) {
      this.addGoalieEntry('home');
      this.addGoalieEntry('away');
    }
  }

  get homeSkatersArray() {
    return this.statsForm.get('homeSkaters') as FormArray;
  }

  get awaySkatersArray() {
    return this.statsForm.get('awaySkaters') as FormArray;
  }

  get homeGoaliesArray() {
    return this.statsForm.get('homeGoalies') as FormArray;
  }

  get awayGoaliesArray() {
    return this.statsForm.get('awayGoalies') as FormArray;
  }

  addSkaterEntry(team: 'home' | 'away') {
    const skaterGroup = this.fb.group({
      gamertag: [''],
      position: ['C'],
      goals: [0],
      assists: [0],
      hits: [0],
      penaltyMinutes: [0],
      shots: [0],
      blockedShots: [0],
      plusMinus: [0],
      giveaways: [0],
      takeaways: [0],
      interceptions: [0],
      faceoffsWon: [0],
      faceoffsLost: [0],
      passAttempts: [0],
      passesCompleted: [0],
      timeOnIceMinutes: [0],
      timeOnIceSeconds: [0]
    });

    if (team === 'home') {
      this.homeSkatersArray.push(skaterGroup);
    } else {
      this.awaySkatersArray.push(skaterGroup);
    }
  }

  addGoalieEntry(team: 'home' | 'away') {
    const goalieGroup = this.fb.group({
      gamertag: [''],
      shotsAgainst: [0],
      goalsAgainst: [0],
      penaltyMinutes: [0],
      goals: [0],
      assists: [0],
      saves: [0],
      timeOnIceMinutes: [0],
      timeOnIceSeconds: [0]
    });

    if (team === 'home') {
      this.homeGoaliesArray.push(goalieGroup);
    } else {
      this.awayGoaliesArray.push(goalieGroup);
    }
  }

  loadGame(gameId: string) {
    this.api.getGame(gameId).subscribe({
      next: (game) => {
        this.game = game;
        console.log('Game loaded:', game);
        
        // Populate form with game data
        this.statsForm.patchValue({
          homeTeam: (game as any).homeClubId?.name || game.homeTeam?.name || game.homeTeam || '',
          awayTeam: (game as any).awayClubId?.name || game.awayTeam?.name || game.awayTeam || '',
          date: game.date ? new Date(game.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '',
          isOvertime: game.isOvertime || false
        });
      },
      error: (error) => {
        console.error('Failed to load game:', error);
      }
    });
  }

  onSubmit() {
    if (this.statsForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.statsForm.value;

    this.saveManualStats(formData).subscribe({
      next: (response) => {
        console.log('Stats saved successfully:', response);
        this.router.navigate(['/admin/schedule']);
      },
      error: (error) => {
        console.error('Failed to save stats:', error);
        this.isSubmitting = false;
      }
    });
  }

  private saveManualStats(formData: any) {
    const gameStats = {
      gameId: this.game._id,
      manualStats: {
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        date: formData.date,
        isOvertime: formData.isOvertime,
        homeSkaters: formData.homeSkaters.filter((s: any) => s.gamertag.trim() !== ''),
        awaySkaters: formData.awaySkaters.filter((s: any) => s.gamertag.trim() !== ''),
        homeGoalies: formData.homeGoalies.filter((g: any) => g.gamertag.trim() !== ''),
        awayGoalies: formData.awayGoalies.filter((g: any) => g.gamertag.trim() !== '')
      }
    };

    return this.api.saveManualGameStats(gameStats);
  }

  cancel() {
    this.router.navigate(['/admin/schedule']);
  }
} 