import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { FreeAgentsComponent } from './free-agents/free-agents.component';
import { PlayerStatsComponent } from './player-stats/player-stats.component';
import { GoalieStatsComponent } from './goalie-stats/goalie-stats.component';
import { ManagerViewComponent } from './manager-view/manager-view.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { TestComponent } from './test-component/test-component';
import { ClubListComponent } from './club-list/club-list.component';
import { ClubDetailSimpleComponent } from './club-detail/club-detail.component';
import { MatchDetailComponent } from './match-detail/match-detail.component';
import { StandingsComponent } from './standings/standings.component';
import { ArticleComponent } from './article/article.component';
import { PlayersComponent } from './players/players.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';
import { RealDataComponent } from './real-data/real-data.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { InboxComponent } from './inbox/inbox.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { authGuard, adminGuard, superAdminGuard } from './core/guards/auth.guard';
import { ManagerGuard } from './core/guards/manager.guard';
import { AdminPasswordGuard } from './guards/admin-password.guard';
import { AdminPasswordComponent } from './admin-password/admin-password.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminDashboardComponent } from './admin-panel/dashboard/admin-dashboard.component';
import { SeasonsComponent } from './admin-panel/seasons/seasons.component';
import { ClubsComponent } from './admin-panel/clubs/clubs.component';
import { AddGamesComponent } from './admin-panel/add-games/add-games.component';
import { AdminScheduleComponent } from './admin-panel/admin-schedule/admin-schedule.component';
import { EashlStatsComponent } from './components/eashl-stats/eashl-stats.component';
import { UsersComponent } from './admin-panel/users/users.component';
import { ManualStatsComponent } from './admin-panel/manual-stats/manual-stats.component';
import { CreatePlayerComponent } from './admin-panel/create-player/create-player.component';
import { PlayersComponent as AdminPlayersComponent } from './admin-panel/players/players.component';
import { AdminsComponent } from './admin-panel/admins/admins.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'free-agents', component: FreeAgentsComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'players/:id', component: PlayerProfileComponent },
  { path: 'player-stats', component: PlayerStatsComponent },
  { path: 'goalie-stats', component: GoalieStatsComponent },
  // TODO: Manager feature temporarily disabled
  // { path: 'manager-view', component: ManagerViewComponent, canActivate: [authGuard, ManagerGuard] },
  { path: 'clubs', component: ClubListComponent },
  { path: 'clubs/:id', component: ClubDetailSimpleComponent },
  { path: 'match/:id', component: MatchDetailComponent },
  { path: 'standings', component: StandingsComponent },
  { path: 'article/:slug', component: ArticleComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'inbox', component: InboxComponent, canActivate: [authGuard] },
  { path: 'profile', component: ViewProfileComponent, canActivate: [authGuard] },
  { path: 'edit-profile', component: EditProfileComponent, canActivate: [authGuard] },
  { path: 'test', component: TestComponent },
  { path: 'real-data', component: RealDataComponent },
  { path: 'eashl-stats', component: EashlStatsComponent, canActivate: [authGuard] },
  { path: 'admin-password', component: AdminPasswordComponent },
  { path: 'admin', component: AdminPanelComponent, canActivate: [AdminPasswordGuard], children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: AdminDashboardComponent, canActivate: [AdminPasswordGuard] },
    { path: 'seasons', component: SeasonsComponent, canActivate: [AdminPasswordGuard] },
    { path: 'clubs', component: ClubsComponent, canActivate: [AdminPasswordGuard] },
    { path: 'add-games', component: AddGamesComponent, canActivate: [AdminPasswordGuard] },
    { path: 'schedule', component: AdminScheduleComponent, canActivate: [AdminPasswordGuard] },
    { path: 'users', component: UsersComponent, canActivate: [AdminPasswordGuard] },
    { path: 'players', component: AdminPlayersComponent, canActivate: [AdminPasswordGuard] },
    { path: 'create-player', component: CreatePlayerComponent, canActivate: [AdminPasswordGuard] },
    { path: 'admins', component: AdminsComponent, canActivate: [AdminPasswordGuard, superAdminGuard] },
  ]},
  {
    path: 'admin/manual-stats/:gameId',
    component: ManualStatsComponent
  }
];

