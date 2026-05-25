/**
 * PolicyEngine — evaluates agent authorization before any action executes.
 *
 * Every agent action must pass a PolicyEngine.evaluate() call.
 * The engine checks all constraints: status, expiry, allowed actions/rails,
 * spend limits, allowed recipients, and human approval threshold.
 *
 * See docs/AGENT_AUTHORIZATION.md for the full evaluation order.
 */

import type {
  AgentIdentity,
  Identity,
  PaymentIntent,
  ActionEnvelope,
  PolicyDecision,
  AgentAction,
  PaymentRailId,
} from '@/lib/types';

export interface PolicyEngine {
  /**
   * Evaluate whether an agent may proceed with the described action.
   * All parameters that are not relevant to the action may be null.
   */
  evaluate(input: {
    agent: AgentIdentity;
    parent: Identity;
    action: AgentAction;
    intent?: PaymentIntent | null;
    envelope?: ActionEnvelope | null;
    rail?: PaymentRailId | null;
    amountRdd?: number | null;
    toHandle?: string | null;
  }): PolicyDecision;
}

export type { PolicyDecision } from '@/lib/types';
