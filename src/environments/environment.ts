export const environment = {
  production: false,
  apiUrl: 'https://ice-tilt-backend.onrender.com', // Use production backend for uploads
  apiAudience: 'https://ice-tilt-backend.onrender.com', // Use production audience for Auth0
  apiAllowedList: [
    // Public endpoints that don't require authentication
    {
      uri: 'http://localhost:3000/api/seasons',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/seasons',
      allowAnonymous: true
    },
    // Clubs - GET requests are public, but PUT/POST/DELETE require auth
    {
      uri: 'http://localhost:3000/api/clubs',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/clubs/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/clubs/*/roster*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*/roster*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/clubs/*/roster',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*/roster',
      allowAnonymous: true
    },
    // More specific patterns for club roster endpoints
    {
      uri: 'http://localhost:3000/api/clubs/*/roster?*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*/roster?*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/games',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/games',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/games/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/games/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/divisions',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/divisions',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/player-profiles',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/player-profiles',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/regions',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/regions',
      allowAnonymous: true
    },
    // Player stats endpoints - public for viewing
    {
      uri: 'http://localhost:3000/api/skater-data',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/skater-data',
      allowAnonymous: true
    },
    // Standings and stats endpoints - public for viewing
    {
      uri: 'http://localhost:3000/api/standings',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/standings',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/standings/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/standings/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/upload',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/upload',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    // Protected endpoints that require authentication
    {
      uri: 'http://localhost:3000/api/users/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/users/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/offers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/offers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    // Admin endpoints - be explicit about all possible patterns
    {
      uri: 'http://localhost:3000/api/admins',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/admins',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/admins/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/admins/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    // Manager endpoints
    {
      uri: 'http://localhost:3000/api/managers',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/managers',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/managers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/managers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    }
  ],
  auth0: {
    domain: 'dev-51tl555qz78d354r.us.auth0.com',
    clientId: 'WgWpaLK0yww0VSuHQuvcKBAUWPCJcO4e'
  }
};

