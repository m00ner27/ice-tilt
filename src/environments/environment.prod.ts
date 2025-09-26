export const environment = {
  production: true,
  apiPlayerProfilesUrl: 'http://localhost:3001/api/player-profiles',
  apiUrl: 'http://localhost:3001',
  apiAudience: 'http://localhost:3001',
  apiAllowedList: [
    // Public endpoints that don't require authentication
    {
      uri: 'http://localhost:3001/api/seasons',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*/roster*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/clubs/*/roster',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/games',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/divisions',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/player-profiles',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/regions',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/skater-data',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/standings',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/standings/*',
      allowAnonymous: true
    },
    {
      uri: 'http://localhost:3001/api/games/*',
      allowAnonymous: true
    },
    // Protected endpoints that require authentication
    {
      uri: 'http://localhost:3001/api/users/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3001',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/offers/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3001',
          scope: 'openid profile email offline_access'
        }
      }
    },
    // Admin endpoints - be explicit about all possible patterns
    {
      uri: 'http://localhost:3001/api/admins',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3001',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3001/api/admins/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3001',
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
