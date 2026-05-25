# Agent Authorization — ReddID Delegation Model

**Last updated:** 2026-05-25
**Status:** AgentIdentity types defined. PolicyEngine interface defined. MockPolicyEngine implemented.

---

## Design philosophy

Agents in ReddID have **explicit, bounded, revocable permissions**. They do not inherit ambient authority from their parent. They cannot expand their own permissions. They cannot delegate to other agents.

Authorization is **policy-based, not key-based.** The question is not "does this request have a valid signature?" but "does this action fall within the explicit policy attached to this agent?"

This design is inspired by Gajumaru Generalised Accounts' policy framework and capability-based authorization principles.

---

## Agent types

| Type | Meaning |
|------|---------|
| `bot` | Automated non-AI script (scheduled tasks, webhooks) |
| `ai-agent` | LLM/ML-backed agent with autonomous decision-making |
| `service` | API service or infrastructure acting on behalf of the owner |
| `automation` | Scheduled or event-driven automation |
| `human-delegate` | Another human acting with explicit bounded authority |
| `org-delegate` | Organizational sub-entity (team member, department) |

---

## Permission model

Every agent has an explicit allowlist for every dimension of authority:

```typescript
interface AgentIdentity {
  allowedActions: AgentAction[];
  // 'tip' | 'read-profile' | 'post-proof' | 'create-intent' | 'read-balance'

  allowedRails: PaymentRailId[];
  // 'native-rdd' | 'bsc-wrdd' | 'base-wrdd' | 'gajumaru-rail' | 'mock'

  perTxLimitRdd: number | null;       // null = any
  dailyLimitRdd: number | null;       // null = any
  monthlyLimitRdd: number | null;     // null = any
  allowedRecipients: string[] | null; // null = any registered handle
  humanApprovalThresholdRdd: number | null;
  // transactions above this require the parent owner to approve explicitly
}
```

If a field is `null`, the constraint is unconstrained for that dimension only. The action must still be in `allowedActions`.

---

## PolicyEngine

The `PolicyEngine` is the single gatekeeper for all agent actions. Nothing executes without passing a policy evaluation.

```typescript
interface PolicyEngine {
  evaluate(
    agent: AgentIdentity,
    parent: Identity,
    intent: PaymentIntent | null,
    envelope: ActionEnvelope | null,
  ): PolicyDecision;
}

interface PolicyDecision {
  allowed: boolean;
  reason: string;
  requiresHumanApproval: boolean;
  violatedRule: string | null;
}
```

### Evaluation order

The `PolicyEngine.evaluate()` checks in this order, stopping at the first `allowed: false`:

1. **Parent not revoked** — if `parent.revokedAt` is set, all agent actions are denied
2. **Agent not revoked** — if `agent.revokedAt` is set, deny
3. **Agent not expired** — if `agent.expiresAt` is in the past, deny
4. **Action allowed** — if the requested action is not in `agent.allowedActions`, deny
5. **Rail allowed** — if the payment rail is not in `agent.allowedRails`, deny
6. **Per-transaction limit** — if `perTxLimitRdd` is set and `amount > perTxLimitRdd`, deny
7. **Daily limit** — if `dailyLimitRdd` is set and today's total + amount > dailyLimitRdd, deny
8. **Monthly limit** — if `monthlyLimitRdd` is set and this month's total + amount > monthlyLimitRdd, deny
9. **Allowed recipients** — if `allowedRecipients` is set and `toHandle` not in the list, deny
10. **Human approval threshold** — if `humanApprovalThresholdRdd` is set and `amount > threshold`, allow but set `requiresHumanApproval: true`

Result: `{ allowed: true/false, reason: "...", requiresHumanApproval: false/true, violatedRule: null/"..." }`

### MockPolicyEngine

The mock implementation evaluates all rules but does not track cumulative daily/monthly spend (it reads 0 for current totals). This means daily and monthly limits only block a single transaction that individually exceeds the limit.

**This is documented behavior.** Cumulative spend tracking requires `PaymentIntent` persistence and aggregation by agentId. Implemented in v0.5.

---

## Agent credentials

Each agent is associated with an `AgentAuthorizationCredential`:
- `claims`: agentId, allowedActions, allowedRails, spend limits (private)
- `issuer`: parent handle
- `subject`: `@parent.agentSlug` display handle
- `source`: `self-asserted`
- `visibility`: `public` for the public fields; `private` for spend limits

This allows the agent's authorization to be presented in a `Presentation` without exposing the full `AgentIdentity` record.

---

## Credential separation from editToken

| Operation | Authorization | Notes |
|-----------|--------------|-------|
| Edit profile | `editToken` | Human, single-device |
| Add/revoke wallet | `editToken` | Human, single-device |
| Revoke agent | `editToken` | Human, acts on agent record |
| Agent action | `agent.controllerKey` (future) | Machine credential, scoped |
| Human approval | `editToken` | Owner reviews agent action above threshold |

The parent `editToken` **never authorizes agent actions**. In v0.4, agent operations use the editToken as a temporary placeholder credential (prototype only). v0.5 will require a scoped `controllerKey` credential.

---

## Namespace rules

- Root handles: `[a-z0-9-]{3,30}` — no dots allowed
- Agent slugs: `[a-z0-9-]{3,30}` — same rules as root handles
- `displayHandle`: `@parent.agentSlug` — for display only, not registerable
- Dotted handles cannot be registered at the root level
- An agent cannot outlive its parent: revoking the parent revokes all agents

---

## Public disclosure

Agent authorization is transparent by design. All active agents are listed at `/[handle]/agents`.

**Public fields:**
- `displayHandle`, `agentType`, `displayPurpose`, `allowedActions`, `expiresAt`

**Private fields (never in public response):**
- `controllerKey`, `perTxLimitRdd`, `dailyLimitRdd`, `monthlyLimitRdd`, `allowedRecipients`, `humanApprovalThresholdRdd`

Spend limits are private to prevent adversarial exploitation: an attacker who knows `humanApprovalThresholdRdd` can craft requests that stay just below the threshold to avoid triggering human review.

---

## Future: GRIDS compatibility

When Gajumaru GRIDS signing is live, agent actions will use `ActionEnvelope` with `signatureType: 'gajumaru-grids'`. The `PolicyEngine` check happens before the envelope is created. The GRIDS signature is the proof that the right key authorized the action within the approved scope.

See `docs/GRIDS_COMPATIBILITY.md` for the integration plan.

---

## Future: multi-agent coordination

Not planned for MVP. Agents cannot currently delegate to sub-agents or coordinate across parent identities. This is intentional — the complexity and attack surface of multi-agent hierarchies is out of scope for the current threat model.
