import { GeoLocation } from './geo-location';

export interface DeviceInfo {
  deviceType: string; // Desktop, Mobile, Tablet
  os: string;
  browser: string;
  location: GeoLocation;
}
