import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { authGuard, adminGuard, superAdminGuard } from './core/guards/auth.guard';
import { ManagerGuard } from './core/guards/manager.guard';
import { AdminPasswordGuard } from './guards/admin-password.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  
  // Lazy loaded routes - Schedule
  { 
    path: 'schedule', 
    loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent)
  },
  
  // Lazy loaded routes - Free Agents
  { 
    path: 'free-agents', 
    loadComponent: () => import('./free-agents/free-agents.component').then(m => m.FreeAgentsComponent),
    canActivate: [authGuard]
  },
  
  // Lazy loaded routes - Players
  { 
    path: 'players', 
    loadComponent: () => import('./players/players.component').then(m => m.PlayersComponent)
  },
  { 
    path: 'players/:id', 
    loadComponent: () => import('./player-profile/player-profile.component').then(m => m.PlayerProfileComponent)
  },
  
  // Lazy loaded routes - Stats
  { 
    path: 'player-stats', 
    loadComponent: () => import('./player-stats/player-stats.component').then(m => m.PlayerStatsComponent)
  },
  { 
    path: 'goalie-stats', 
    loadComponent: () => import('./goalie-stats/goalie-stats.component').then(m => m.GoalieStatsComponent)
  },
  
  // TODO: Manager feature temporarily disabled
  // { 
  //   path: 'manager-view', 
  //   loadComponent: () => import('./manager-view/manager-view.component').then(m => m.ManagerViewComponent),
  //   canActivate: [authGuard, ManagerGuard] 
  // },
  
  // Lazy loaded routes - Clubs
  { 
    path: 'clubs', 
    loadComponent: () => import('./club-list/club-list.component').then(m => m.ClubListComponent)
  },
  { 
    path: 'clubs/:id', 
    loadComponent: () => import('./club-detail/club-detail.component').then(m => m.ClubDetailSimpleComponent)
  },
  
  // Lazy loaded routes - Match
  { 
    path: 'match/:id', 
    loadComponent: () => import('./match-detail/match-detail.component').then(m => m.MatchDetailComponent)
  },
  
  // Lazy loaded routes - Standings
  { 
    path: 'standings', 
    loadComponent: () => import('./standings/standings.component').then(m => m.StandingsComponent)
  },
  { 
    path: 'rankings', 
    loadComponent: () => import('./rankings/rankings.component').then(m => m.RankingsComponent)
  },
  
  // Lazy loaded routes - Playoffs
  // More specific routes must come first
  { 
    path: 'playoffs/series/:id', 
    loadComponent: () => import('./playoffs/playoff-series/playoff-series.component').then(m => m.PlayoffSeriesComponent)
  },
  { 
    path: 'playoffs/:id', 
    loadComponent: () => import('./playoffs/playoff-bracket/playoff-bracket.component').then(m => m.PlayoffBracketComponent)
  },
  { 
    path: 'playoffs', 
    loadComponent: () => import('./playoffs/playoff-bracket/playoff-bracket.component').then(m => m.PlayoffBracketComponent)
  },
  
  // Lazy loaded routes - Champions
  { 
    path: 'champions', 
    loadComponent: () => import('./champions/champions.component').then(m => m.ChampionsComponent)
  },
  
  // Lazy loaded routes - Tournaments
  // More specific routes must come first
  { 
    path: 'tournaments/series/:id', 
    loadComponent: () => import('./tournaments/tournament-series/tournament-series.component').then(m => m.TournamentSeriesComponent)
  },
  { 
    path: 'tournaments/:id', 
    loadComponent: () => import('./tournaments/tournament-bracket/tournament-bracket.component').then(m => m.TournamentBracketComponent)
  },
  { 
    path: 'tournaments', 
    loadComponent: () => import('./tournaments/tournament-bracket/tournament-bracket.component').then(m => m.TournamentBracketComponent)
  },
  
  // Lazy loaded routes - Articles
  { 
    path: 'articles', 
    loadComponent: () => import('./articles/articles.component').then(m => m.ArticlesComponent)
  },
  { 
    path: 'article/:slug', 
    loadComponent: () => import('./article/article.component').then(m => m.ArticleComponent)
  },
  
  // Lazy loaded routes - Transactions
  { 
    path: 'transactions', 
    loadComponent: () => import('./transactions/transactions.component').then(m => m.TransactionsComponent)
  },
  
  // Lazy loaded routes - Inbox
  { 
    path: 'inbox', 
    loadComponent: () => import('./inbox/inbox.component').then(m => m.InboxComponent),
    canActivate: [authGuard]
  },
  
  // Lazy loaded routes - Profile
  { 
    path: 'profile', 
    loadComponent: () => import('./view-profile/view-profile.component').then(m => m.ViewProfileComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'edit-profile', 
    loadComponent: () => import('./edit-profile/edit-profile.component').then(m => m.EditProfileComponent),
    canActivate: [authGuard]
  },
  
  // Lazy loaded routes - Test
  { 
    path: 'test', 
    loadComponent: () => import('./test-component/test-component').then(m => m.TestComponent)
  },
  
  // Lazy loaded routes - Real Data
  { 
    path: 'real-data', 
    loadComponent: () => import('./real-data/real-data.component').then(m => m.RealDataComponent)
  },
  
  // Lazy loaded routes - EASHL Stats
  { 
    path: 'eashl-stats', 
    loadComponent: () => import('./components/eashl-stats/eashl-stats.component').then(m => m.EashlStatsComponent),
    canActivate: [authGuard]
  },
  
  // Lazy loaded routes - Admin Password
  { 
    path: 'admin-password', 
    loadComponent: () => import('./admin-password/admin-password.component').then(m => m.AdminPasswordComponent)
  },
  
  // Lazy loaded routes - Admin Panel (parent and children)
  { 
    path: 'admin', 
    loadComponent: () => import('./admin-panel/admin-panel.component').then(m => m.AdminPanelComponent),
    canActivate: [AdminPasswordGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./admin-panel/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'seasons', 
        loadComponent: () => import('./admin-panel/seasons/seasons.component').then(m => m.SeasonsComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'clubs', 
        loadComponent: () => import('./admin-panel/clubs/clubs.component').then(m => m.ClubsComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'add-games', 
        loadComponent: () => import('./admin-panel/add-games/add-games.component').then(m => m.AddGamesComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'schedule', 
        loadComponent: () => import('./admin-panel/admin-schedule/admin-schedule.component').then(m => m.AdminScheduleComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'users', 
        loadComponent: () => import('./admin-panel/users/users.component').then(m => m.UsersComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'players', 
        loadComponent: () => import('./admin-panel/players/players.component').then(m => m.PlayersComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'create-player', 
        loadComponent: () => import('./admin-panel/create-player/create-player.component').then(m => m.CreatePlayerComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'admins', 
        loadComponent: () => import('./admin-panel/admins/admins.component').then(m => m.AdminsComponent),
        canActivate: [AdminPasswordGuard, superAdminGuard]
      },
      { 
        path: 'playoff-setup', 
        loadComponent: () => import('./admin-panel/playoff-setup/playoff-setup.component').then(m => m.PlayoffSetupComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'tournaments', 
        loadComponent: () => import('./admin-panel/tournaments/tournaments.component').then(m => m.TournamentsComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'tournament-setup', 
        loadComponent: () => import('./admin-panel/tournament-setup/tournament-setup.component').then(m => m.TournamentSetupComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'rankings', 
        loadComponent: () => import('./admin-panel/rankings/rankings.component').then(m => m.RankingsAdminComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'club-deletion', 
        loadComponent: () => import('./admin-panel/club-deletion/club-deletion.component').then(m => m.ClubDeletionComponent),
        canActivate: [AdminPasswordGuard]
      },
      { 
        path: 'articles', 
        loadComponent: () => import('./admin-panel/articles/articles.component').then(m => m.ArticlesComponent),
        canActivate: [AdminPasswordGuard]
      },
    ]
  },
  {
    path: 'admin/manual-stats/:gameId',
    loadComponent: () => import('./admin-panel/manual-stats/manual-stats.component').then(m => m.ManualStatsComponent)
  }
];

