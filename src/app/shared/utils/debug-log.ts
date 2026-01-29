import { environment } from '../../../environments/environment';

export function debugLog(...args: any[]) {
  // eslint-disable-next-line no-console
  if (!environment.production) console.log(...args);
}


