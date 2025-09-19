export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
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
      uri: 'http://localhost:3000/api/clubs/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/games',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: '/api/divisions',
      allowAnonymous: true
    },
    {
      uri: '/api/player-profiles',
      allowAnonymous: true
    },
    {
      uri: '/api/regions',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3000/api/upload',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
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
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/offers/*',
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
      uri: 'http://localhost:3000/api/admins',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/admins/*',
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
      uri: 'http://localhost:3000/api/managers',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/managers/*',
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

