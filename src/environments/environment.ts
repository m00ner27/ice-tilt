export const environment = {
  production: false,
  apiPlayerProfilesUrl: 'http://localhost:3000/api/player-profiles',
  apiUrl: 'http://localhost:3000',
  apiAudience: 'http://localhost:3000',
  apiAllowedList: [
    {
      uri: 'http://localhost:3000/api/*',
      allowAnonymous: false
    }
  ],
  auth0: {
    domain: 'dev-51tl555qz78d354r.us.auth0.com',
    clientId: 'WgWpaLK0yww0VSuHQuvcKBAUWPCJcO4e'
  }
};
