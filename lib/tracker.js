import { DEFAULT_STATE_ID, getStateById, normalizeStateId } from './states.js'
import { supabase, TRACKER_ROW_ID } from './supabase.js'

const SETUP_HINT = 'Run supabase/schema.sql in the Supabase SQL editor to create the tracker_state table.'

function wrapDbError(error, action) {
  if (error.message.includes('tracker_state')) {
    return new Error(`${action}: ${error.message}. ${SETUP_HINT}`)
  }

  return new Error(`${action}: ${error.message}`)
}

export async function getTrackerState() {
  const { data, error } = await supabase
    .from('tracker_state')
    .select('state_id, updated_at')
    .eq('id', TRACKER_ROW_ID)
    .maybeSingle()

  if (error) {
    throw wrapDbError(error, 'Failed to read tracker state')
  }

  if (!data) {
    return ensureTrackerState(DEFAULT_STATE_ID)
  }

  const stateId = normalizeStateId(data.state_id) ?? DEFAULT_STATE_ID

  return {
    stateId,
    updatedAt: data.updated_at,
    state: getStateById(stateId),
  }
}

export async function setTrackerState(stateId) {
  const normalizedStateId = normalizeStateId(stateId)

  if (!normalizedStateId) {
    const error = new Error('Invalid tracker state.')
    error.statusCode = 400
    throw error
  }

  const { data, error } = await supabase
    .from('tracker_state')
    .upsert(
      {
        id: TRACKER_ROW_ID,
        state_id: normalizedStateId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('state_id, updated_at')
    .single()

  if (error) {
    throw wrapDbError(error, 'Failed to update tracker state')
  }

  return {
    stateId: data.state_id,
    updatedAt: data.updated_at,
    state: getStateById(data.state_id),
  }
}

async function ensureTrackerState(stateId) {
  const { data, error } = await supabase
    .from('tracker_state')
    .upsert(
      {
        id: TRACKER_ROW_ID,
        state_id: stateId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('state_id, updated_at')
    .single()

  if (error) {
    throw wrapDbError(error, 'Failed to initialize tracker state')
  }

  return {
    stateId: data.state_id,
    updatedAt: data.updated_at,
    state: getStateById(data.state_id),
  }
}
