import type { NextRequest } from 'next/server';
import { getStore } from '@/lib/store';
import { sanitizeHandle } from '@/lib/validation';
import type { AgentIdentity, AgentAction, PaymentRailId, AgentType } from '@/lib/types';
import { AGENT_ACTIONS } from '@/lib/types';

/**
 * Public view of an agent — strips private spend limit fields.
 *
 * Private fields (perTxLimitRdd, dailyLimitRdd, monthlyLimitRdd,
 * allowedRecipients, humanApprovalThresholdRdd) are only visible to the
 * parent identity owner via the management interface.
 */
function publicAgent(
  agent: AgentIdentity,
): Omit<AgentIdentity, 'perTxLimitRdd' | 'dailyLimitRdd' | 'monthlyLimitRdd' | 'allowedRecipients' | 'humanApprovalThresholdRdd'> {
  const {
    perTxLimitRdd: _ptx,
    dailyLimitRdd: _day,
    monthlyLimitRdd: _mon,
    allowedRecipients: _rec,
    humanApprovalThresholdRdd: _hat,
    ...pub
  } = agent;
  return pub;
}

interface Props {
  params: Promise<{ handle: string }>;
}

const VALID_AGENT_TYPES: AgentType[] = ['bot', 'ai-agent', 'service', 'automation', 'human-delegate', 'org-delegate'];
const VALID_RAILS = ['native-rdd', 'bsc-wrdd', 'base-wrdd', 'gajumaru-rail', 'mock'] as const satisfies PaymentRailId[];

/**
 * GET /api/agents/[handle]
 * Returns the public list of active agents for a handle.
 * Private spend limits are stripped. Revoked agents are excluded.
 */
export async function GET(_req: NextRequest, { params }: Props) {
  const { handle } = await params;
  const h = sanitizeHandle(handle);
  if (!h) return Response.json({ error: 'Invalid handle.' }, { status: 400 });

  try {
    const agents = getStore().getAgents(h);
    return Response.json({ agents: agents.map(publicAgent) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND') return Response.json({ error: `@${h} not found.` }, { status: 404 });
    return Response.json({ error: 'Failed to retrieve agents.' }, { status: 500 });
  }
}

/**
 * POST /api/agents/[handle]
 * Body: { editToken, agentSlug, agentType, displayPurpose, allowedActions,
 *         allowedRails?, controllerKey?, perTxLimitRdd?, dailyLimitRdd?,
 *         monthlyLimitRdd?, allowedRecipients?, humanApprovalThresholdRdd?,
 *         expiresAt? }
 *
 * Creates a new agent attached to the handle. Requires parent editToken.
 * The agent's editToken is NOT the parent's editToken — agents operate via
 * controllerKey or ActionEnvelope-based signing.
 */
export async function POST(request: NextRequest, { params }: Props) {
  const { handle } = await params;
  const h = sanitizeHandle(handle);
  if (!h) return Response.json({ error: 'Invalid handle.' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const editToken     = String(body.editToken     ?? '').trim();
  const agentSlug     = String(body.agentSlug     ?? '').trim().toLowerCase();
  const agentType     = String(body.agentType     ?? '').trim() as AgentType;
  const displayPurpose = String(body.displayPurpose ?? '').trim();
  const allowedActions = Array.isArray(body.allowedActions) ? body.allowedActions as AgentAction[] : [];
  const allowedRails: PaymentRailId[] = Array.isArray(body.allowedRails)
    ? (body.allowedRails as string[]).filter((r): r is PaymentRailId => (VALID_RAILS as readonly string[]).includes(r))
    : ['native-rdd'];
  const controllerKey  = body.controllerKey ? String(body.controllerKey).trim() : null;
  const perTxLimitRdd  = body.perTxLimitRdd != null ? Number(body.perTxLimitRdd) : null;
  const dailyLimitRdd  = body.dailyLimitRdd != null ? Number(body.dailyLimitRdd) : null;
  const monthlyLimitRdd = body.monthlyLimitRdd != null ? Number(body.monthlyLimitRdd) : null;
  const allowedRecipients = Array.isArray(body.allowedRecipients)
    ? (body.allowedRecipients as string[]).map(r => sanitizeHandle(r)).filter(Boolean)
    : null;
  const humanApprovalThresholdRdd = body.humanApprovalThresholdRdd != null
    ? Number(body.humanApprovalThresholdRdd) : null;
  const expiresAt = body.expiresAt ? String(body.expiresAt).trim() : null;

  if (!editToken)      return Response.json({ error: 'editToken is required.' },      { status: 401 });
  if (!agentSlug)      return Response.json({ error: 'agentSlug is required.' },      { status: 400 });
  if (!agentType || !VALID_AGENT_TYPES.includes(agentType)) {
    return Response.json({ error: `agentType must be one of: ${VALID_AGENT_TYPES.join(', ')}` }, { status: 422 });
  }
  if (!displayPurpose) return Response.json({ error: 'displayPurpose is required.' }, { status: 400 });
  if (allowedActions.length === 0) {
    return Response.json({ error: 'allowedActions must contain at least one action.' }, { status: 422 });
  }
  const invalidActions = allowedActions.filter(a => !(AGENT_ACTIONS as readonly string[]).includes(a));
  if (invalidActions.length > 0) {
    return Response.json({ error: `Unknown actions: ${invalidActions.join(', ')}. Valid: ${AGENT_ACTIONS.join(', ')}` }, { status: 422 });
  }
  // If caller passed rails that were silently filtered out above, report them
  const rawRails = Array.isArray(body.allowedRails) ? body.allowedRails as string[] : [];
  const invalidRails = rawRails.filter(r => !(VALID_RAILS as readonly string[]).includes(r));
  if (invalidRails.length > 0) {
    return Response.json({ error: `Unknown rails: ${invalidRails.join(', ')}` }, { status: 422 });
  }

  try {
    const agent = getStore().createAgent(h, editToken, {
      agentSlug,
      agentType,
      displayPurpose,
      controllerKey,
      allowedActions,
      allowedRails,
      perTxLimitRdd: perTxLimitRdd && perTxLimitRdd > 0 ? perTxLimitRdd : null,
      dailyLimitRdd: dailyLimitRdd && dailyLimitRdd > 0 ? dailyLimitRdd : null,
      monthlyLimitRdd: monthlyLimitRdd && monthlyLimitRdd > 0 ? monthlyLimitRdd : null,
      allowedRecipients: allowedRecipients && allowedRecipients.length > 0 ? allowedRecipients : null,
      humanApprovalThresholdRdd: humanApprovalThresholdRdd && humanApprovalThresholdRdd > 0 ? humanApprovalThresholdRdd : null,
      expiresAt,
    });
    // Return full agent to owner (not publicAgent — they just created it and need limits)
    return Response.json({ agent }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'NOT_FOUND')           return Response.json({ error: `@${h} not found.` },                              { status: 404 });
    if (msg === 'UNAUTHORIZED')        return Response.json({ error: 'Edit token incorrect.' },                          { status: 401 });
    if (msg === 'AGENT_LIMIT_EXCEEDED') return Response.json({ error: 'Maximum 10 agents per identity.' },               { status: 422 });
    if (msg === 'INVALID_AGENT_SLUG')  return Response.json({ error: 'agentSlug must be 3–20 alphanumeric characters or hyphens.' }, { status: 422 });
    if (msg === 'AGENT_SLUG_TAKEN')    return Response.json({ error: `Agent slug '${agentSlug}' is already in use.` },   { status: 409 });
    return Response.json({ error: 'Failed to create agent.' }, { status: 500 });
  }
}
