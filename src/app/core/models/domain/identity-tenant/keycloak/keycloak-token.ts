export interface KeycloakToken {
  accessToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  refreshToken: string;
  tokenType: string;
  idToken: string;
  notBeforePolicy: number;
  sessionState: string;
  scope: string;
}
