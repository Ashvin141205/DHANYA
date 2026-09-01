/**
 * Dhanya Server-Side Token Revocation Store
 * Application: backend
 * 
 * Tracks revoked token unique identifiers (jti) to invalidate stateless Bearer tokens
 * immediately upon user logout, administrative revocation, or session invalidation.
 */

export class TokenRevocationStore {
  private revokedTokens: Map<string, number> = new Map(); // jti -> exp (unix seconds)

  /**
   * Records a token as revoked until its cryptographic expiry timestamp.
   */
  public revoke(jti: string, exp: number): void {
    if (!jti) return;
    this.revokedTokens.set(jti, exp);
    this.prune();
  }

  /**
   * Checks if a jti is in the revocation list.
   */
  public isRevoked(jti: string): boolean {
    if (!jti) return false;
    const exp = this.revokedTokens.get(jti);
    if (!exp) return false;

    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) {
      this.revokedTokens.delete(jti);
      return false;
    }

    return true;
  }

  /**
   * Prunes expired revocation records to keep memory footprint bounded.
   */
  public prune(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.revokedTokens.entries()) {
      if (exp <= now) {
        this.revokedTokens.delete(jti);
      }
    }
  }

  /**
   * Resets the revocation store (used in test setup).
   */
  public clear(): void {
    this.revokedTokens.clear();
  }

  /**
   * Returns current count of active revoked tokens.
   */
  public size(): number {
    this.prune();
    return this.revokedTokens.size;
  }
}

export const tokenRevocationStore = new TokenRevocationStore();
