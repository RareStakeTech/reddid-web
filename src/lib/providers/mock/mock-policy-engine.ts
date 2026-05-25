/**
 * MockPolicyEngine — evaluates all agent authorization rules.
 *
 * Implements the full evaluation order from docs/AGENT_AUTHORIZATION.md.
 * Limitation: daily/monthly cumulative spend is not tracked (reads 0).
 * This is documented prototype behavior; fixed in v0.5 with PaymentIntent aggregation.
 */

import type { PolicyEngine } from '@/lib/providers/policy-engine';
import type {
  AgentIdentity,
  Identity,
  PaymentIntent,
  ActionEnvelope,
  PolicyDecision,
  AgentAction,
  PaymentRailId,
} from '@/lib/types';

export class MockPolicyEngine implements PolicyEngine {
  evaluate(input: {
    agent: AgentIdentity;
    parent: Identity;
    action: AgentAction;
    intent?: PaymentIntent | null;
    envelope?: ActionEnvelope | null;
    rail?: PaymentRailId | null;
    amountRdd?: number | null;
    toHandle?: string | null;
  }): PolicyDecision {
    const { agent, parent, action, rail, amountRdd, toHandle } = input;
    const deny = (reason: string, rule: string): PolicyDecision => ({
      allowed: false,
      reason,
      requiresHumanApproval: false,
      violatedRule: rule,
    });

    // 1. Parent not revoked
    if (parent.revokedAt) {
      return deny('Parent identity is revoked. All agent actions are denied.', 'parent-revoked');
    }

    // 2. Agent not revoked
    if (agent.revokedAt) {
      return deny(`Agent ${agent.displayHandle} is revoked.`, 'agent-revoked');
    }

    // 3. Agent not expired
    if (agent.expiresAt && new Date(agent.expiresAt) < new Date()) {
      return deny(`Agent ${agent.displayHandle} has expired.`, 'agent-expired');
    }

    // 4. Action allowed
    if (!agent.allowedActions.includes(action)) {
      return deny(
        `Agent ${agent.displayHandle} is not authorized for action '${action}'.`,
        'action-not-allowed',
      );
    }

    // 5. Rail allowed (only for payment actions)
    if (rail && !agent.allowedRails.includes(rail)) {
      return deny(
        `Agent ${agent.displayHandle} is not authorized to use rail '${rail}'.`,
        'rail-not-allowed',
      );
    }

    const amount = amountRdd ?? 0;

    // 6. Per-transaction limit
    if (agent.perTxLimitRdd !== null && amount > agent.perTxLimitRdd) {
      return deny(
        `Transaction amount ${amount} RDD exceeds per-transaction limit of ${agent.perTxLimitRdd} RDD.`,
        'per-tx-limit',
      );
    }

    // 7. Daily limit (mock: reads 0 as current daily spend)
    if (agent.dailyLimitRdd !== null && amount > agent.dailyLimitRdd) {
      return deny(
        `Transaction amount ${amount} RDD exceeds daily limit of ${agent.dailyLimitRdd} RDD.`,
        'daily-limit',
      );
    }

    // 8. Monthly limit (mock: reads 0 as current monthly spend)
    if (agent.monthlyLimitRdd !== null && amount > agent.monthlyLimitRdd) {
      return deny(
        `Transaction amount ${amount} RDD exceeds monthly limit of ${agent.monthlyLimitRdd} RDD.`,
        'monthly-limit',
      );
    }

    // 9. Allowed recipients
    if (
      toHandle &&
      agent.allowedRecipients !== null &&
      !agent.allowedRecipients.includes(toHandle)
    ) {
      return deny(
        `Recipient @${toHandle} is not in agent ${agent.displayHandle}'s allowed recipients list.`,
        'recipient-not-allowed',
      );
    }

    // 10. Human approval threshold
    const requiresApproval =
      agent.humanApprovalThresholdRdd !== null &&
      amount > agent.humanApprovalThresholdRdd;

    return {
      allowed: true,
      reason: requiresApproval
        ? `Allowed but requires human approval: ${amount} RDD exceeds threshold of ${agent.humanApprovalThresholdRdd} RDD.`
        : `Agent ${agent.displayHandle} is authorized for this action.`,
      requiresHumanApproval: requiresApproval,
      violatedRule: null,
    };
  }
}
