export const environment = {
  production: false,
  apiUrl: '',
  apiAudience: 'http://localhost:3000',
  apiAllowedList: [
    {
      uri: '/api/*',
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
