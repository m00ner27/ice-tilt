import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { StandingsComponent } from './standings/standings.component';
import { FreeAgentsComponent } from './free-agents/free-agents.component';
import { PlayerStatsComponent } from './player-stats/player-stats.component';
import { GoalieStatsComponent } from './goalie-stats/goalie-stats.component';
import { ManagerViewComponent } from './manager-view/manager-view.component';
import { ClubComponent } from './club/club.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { LoginComponent } from './login/login.component';

// Admin Panel Components
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminAddClubToSeasonDivComponent } from './admin-add-club-to-season-div/admin-add-club-to-season-div.component';
import { AdminAddClubToSeasonDiv2Component } from './admin-add-club-to-season-div-2/admin-add-club-to-season-div-2.component';
import { AdminCreateClubComponent } from './admin-create-club/admin-create-club.component';
import { AdminCreateSeasonDivComponent } from './admin-create-season-div/admin-create-season-div.component';
import { AdminDeleteClubComponent } from './admin-delete-club/admin-delete-club.component';
import { AdminDeleteSeasonDivComponent } from './admin-delete-season-div/admin-delete-season-div.component';
import { AdminManageUsersComponent } from './admin-manage-users/admin-manage-users.component';
import { AdminManageUsers2Component } from './admin-manage-users-2/admin-manage-users-2.component';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'standings', component: StandingsComponent },
  { path: 'free-agents', component: FreeAgentsComponent },
  { path: 'player-stats', component: PlayerStatsComponent },
  { path: 'goalie-stats', component: GoalieStatsComponent },
  { path: 'manager-view', component: ManagerViewComponent },
  { path: 'club', component: ClubComponent },
  { path: 'edit-profile', component: EditProfileComponent },
  { path: 'login', component: LoginComponent },

  // Admin Panel Route with Children
  { 
    path: 'admin-panel', 
    component: AdminPanelComponent,
    children: [
      { path: 'admin-add-club-to-season-div', component: AdminAddClubToSeasonDivComponent },
      { path: 'admin-add-club-to-season-div-2', component: AdminAddClubToSeasonDiv2Component },
      { path: 'admin-create-club', component: AdminCreateClubComponent },
      { path: 'admin-create-season-div', component: AdminCreateSeasonDivComponent },
      { path: 'admin-delete-club', component: AdminDeleteClubComponent },
      { path: 'admin-delete-season-div', component: AdminDeleteSeasonDivComponent },
      { path: 'admin-manage-users', component: AdminManageUsersComponent },
      { path: 'admin-manage-users-2', component: AdminManageUsers2Component },
      { path: 'admin-panel', component: AdminPanelComponent }
    ]
  }
];

