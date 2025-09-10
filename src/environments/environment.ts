export const environment = {
  production: false,
  apiUrl: '',
  apiAudience: 'http://localhost:3000',
  apiAllowedList: [
    // Public endpoints that don't require authentication
    {
      uri: '/api/seasons',
      allowAnonymous: true
    },
    // Clubs - GET requests are public, but PUT/POST/DELETE require auth
    {
      uri: '/api/clubs',
      allowAnonymous: true
    },
    {
      uri: '/api/clubs/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: '/api/games',
      allowAnonymous: true
    },
    {
      uri: '/api/divisions',
      allowAnonymous: true
    },
    {
      uri: '/api/player-profiles',
      allowAnonymous: true
    },
    // Protected endpoints that require authentication
    {
      uri: '/api/users/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: '/api/offers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    // Admin endpoints - be explicit about all possible patterns
    {
      uri: '/api/admins',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: '/api/admins/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    // Manager endpoints
    {
      uri: '/api/managers',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: '/api/managers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
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
