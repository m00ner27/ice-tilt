export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiAudience: 'http://localhost:3000',
  apiAllowedList: [
    {
      uri: 'http://localhost:3000/api/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: '/api/*',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/users/auth0-sync',
      httpMethod: 'POST',
      allowAnonymous: false,
      tokenOptions: {
        authorizationParams: {
          audience: 'http://localhost:3000',
          scope: 'openid profile email offline_access'
        }
      }
    },
    {
      uri: 'http://localhost:3000/api/users/me',
      httpMethod: 'GET',
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
