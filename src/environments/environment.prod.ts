export const environment = {
  production: true,
  apiPlayerProfilesUrl: 'https://ice-tilt-backend.onrender.com/api/player-profiles',
  apiUrl: 'https://ice-tilt-backend.onrender.com',
  apiAudience: 'https://ice-tilt-backend.onrender.com',
  apiAllowedList: [
    // Public endpoints that don't require authentication
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/seasons',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/clubs',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/clubs/*',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/clubs/*/roster*',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/clubs/*/roster',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/games',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/divisions',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/player-profiles',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/regions',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/skater-data',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/standings',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/standings/*',
      allowAnonymous: true
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/games/*',
      allowAnonymous: true
    },
    // Protected endpoints that require authentication
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/users/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/offers/*',
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
      uri: 'https://ice-tilt-backend.onrender.com/api/admins',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'https://ice-tilt-backend.onrender.com',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'https://ice-tilt-backend.onrender.com/api/admins/*',
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
