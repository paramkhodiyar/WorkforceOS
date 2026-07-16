export interface JwtPayload {
  userId: string;
  email: string;
  systemRole: string;
  organizationId: string;
  originalRole?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
