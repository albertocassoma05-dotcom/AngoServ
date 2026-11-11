import firebaseConfig from '../../firebase-applet-config.json';

// In AI Studio, the demo project key provisioned via ProvisionMapsDemoProjectKey
// is stored in the cloud project environment or shares the project web API key.
export const GOOGLE_MAPS_API_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (firebaseConfig as any)?.apiKey ||
  '';
