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
import { RecentTransactionsComponent } from './recent-transactions/recent-transactions.component';
import { InboxComponent } from './inbox/inbox.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { authGuard, adminGuard, superAdminGuard } from './core/guards/auth.guard';
import { ManagerGuard } from './core/guards/manager.guard';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminDashboardComponent } from './admin-panel/dashboard/admin-dashboard.component';
import { SeasonsComponent } from './admin-panel/seasons/seasons.component';
import { ClubsComponent } from './admin-panel/clubs/clubs.component';
import { AddGamesComponent } from './admin-panel/add-games/add-games.component';
import { AdminScheduleComponent } from './admin-panel/admin-schedule/admin-schedule.component';
import { EashlStatsComponent } from './components/eashl-stats/eashl-stats.component';
import { UsersComponent } from './admin-panel/users/users.component';
import { ManualStatsComponent } from './admin-panel/manual-stats/manual-stats.component';
import { CreateUserComponent } from './admin-panel/create-user/create-user.component';
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
  { path: 'manager-view', component: ManagerViewComponent, canActivate: [authGuard, ManagerGuard] },
  { path: 'clubs', component: ClubListComponent },
  { path: 'clubs/:id', component: ClubDetailSimpleComponent },
  { path: 'match/:id', component: MatchDetailComponent },
  { path: 'standings', component: StandingsComponent },
  { path: 'article/:slug', component: ArticleComponent },
  { path: 'transactions', component: RecentTransactionsComponent },
  { path: 'inbox', component: InboxComponent, canActivate: [authGuard] },
  { path: 'profile', component: ViewProfileComponent, canActivate: [authGuard] },
  { path: 'edit-profile', component: EditProfileComponent, canActivate: [authGuard] },
  { path: 'test', component: TestComponent },
  { path: 'real-data', component: RealDataComponent },
  { path: 'eashl-stats', component: EashlStatsComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard], children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: AdminDashboardComponent },
    { path: 'seasons', component: SeasonsComponent },
    { path: 'clubs', component: ClubsComponent },
    { path: 'add-games', component: AddGamesComponent },
    { path: 'schedule', component: AdminScheduleComponent },
    { path: 'users', component: UsersComponent },
    { path: 'create-user', component: CreateUserComponent },
    { path: 'admins', component: AdminsComponent, canActivate: [superAdminGuard] },
  ]},
  {
    path: 'admin/manual-stats/:gameId',
    component: ManualStatsComponent
  }
];

