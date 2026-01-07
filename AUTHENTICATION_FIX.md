# Authentication Fix for Admin Panel

## Problem
The admin panel was getting 401 Unauthorized errors when trying to:
- Link stats (`bulkUpdateGames`)
- Delete games (`deleteGame`)
- Other admin operations

## Root Cause
Several API methods in `ApiService` were not using authentication headers, while others were properly authenticated.

## Fixed Methods
The following methods now include proper authentication:

### 1. `deleteGame(gameId: string)`
- **Before**: Direct HTTP call without auth headers
- **After**: Gets Auth0 access token and includes `Authorization: Bearer {token}` header

### 2. `bulkUpdateGames(updates: any[])`
- **Before**: Direct HTTP call without auth headers  
- **After**: Gets Auth0 access token and includes `Authorization: Bearer {token}` header

### 3. `mergeGames(primaryGameId: string, secondaryGameId: string)`
- **Before**: Direct HTTP call without auth headers
- **After**: Gets Auth0 access token and includes `Authorization: Bearer {token}` header

### 4. `unlinkGameStats(gameId: string)`
- **Before**: Direct HTTP call without auth headers
- **After**: Gets Auth0 access token and includes `Authorization: Bearer {token}` header

### 5. `getGameEashlData(gameId: string)`
- **Before**: Direct HTTP call without auth headers
- **After**: Gets Auth0 access token and includes `Authorization: Bearer {token}` header
- **Note**: This method is called after bulk updates to fetch EASHL data

### 6. Admin Management Methods
- `addAdmin(payload)`
- `removeAdmin(auth0Id)`
- `setSuperAdmin(auth0Id, superAdmin)`

## How It Works
All fixed methods now follow this pattern:

```typescript
return this.auth.getAccessTokenSilently({
  authorizationParams: { audience: environment.apiAudience }
}).pipe(
  switchMap(token => {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.[method](url, data, { headers });
  })
);
```

## Testing
1. **Login to Admin Panel**: Make sure you're logged in with proper admin credentials
2. **Try Linking Stats**: The bulk update should now work without 401 errors
3. **Try Deleting Games**: Game deletion should now work without 401 errors
4. **Check Console**: Look for authentication success messages in browser console

## Debug Information
The methods now include console logging to help debug authentication issues:
- `ApiService: [method] called` - When method is invoked
- `ApiService: Got access token for [method], making authenticated request` - When token is obtained
- Any errors will be logged to console

## Additional Notes
- Make sure your Auth0 configuration is correct in `environment.ts`
- Ensure the API audience matches between frontend and backend
- Check that the backend is properly validating the JWT tokens
