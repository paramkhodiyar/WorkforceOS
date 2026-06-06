export interface JwtPayload {
  userId: string;
  email: string;
  systemRole: string;
  organizationId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
