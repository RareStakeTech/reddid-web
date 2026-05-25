/**
 * MockPresentationProvider — creates credential presentations without signing.
 *
 * Presentations are generated on demand and not persisted.
 * All presentations are unsigned (proof: null) in MVP.
 */

import crypto from 'crypto';
import type {
  PresentationProvider,
  CreatePresentationInput,
} from '@/lib/providers/presentation-provider';
import type { Presentation, Credential } from '@/lib/types';
import { MockCredentialProvider } from './mock-credential-provider';

const credentialProvider = new MockCredentialProvider();

export class MockPresentationProvider implements PresentationProvider {
  create(input: CreatePresentationInput): Presentation {
    const now = new Date();
    const ttl = input.ttlSeconds ?? 3600;
    return {
      id: crypto.randomBytes(8).toString('hex'),
      holder: input.holder,
      credentialIds: input.credentialIds,
      purpose: input.purpose,
      audience: input.audience,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
      proof: null, // unsigned in MVP
    };
  }

  resolve(presentation: Presentation): Credential[] {
    return presentation.credentialIds
      .map(id => credentialProvider.get(id))
      .filter((c): c is Credential => c !== null);
  }

  verify(presentation: Presentation): { valid: boolean; reason: string } {
    if (presentation.expiresAt && new Date(presentation.expiresAt) < new Date()) {
      return { valid: false, reason: 'Presentation has expired.' };
    }
    const credentials = this.resolve(presentation);
    const missing = presentation.credentialIds.length - credentials.length;
    if (missing > 0) {
      return { valid: false, reason: `${missing} credential(s) could not be resolved.` };
    }
    const revoked = credentials.filter(c => c.status === 'revoked');
    if (revoked.length > 0) {
      return { valid: false, reason: `${revoked.length} credential(s) are revoked.` };
    }
    return { valid: true, reason: 'All credentials are valid.' };
  }
}
