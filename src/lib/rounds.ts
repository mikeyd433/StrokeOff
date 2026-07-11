import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { selectCurrentRound } from '@/features/round/currentRound'
import type { ConversionConfig } from '@/features/conversion/types'
import type {
  ConversionMode,
  Round,
  RoundPlayer,
  RoundRule,
  ScoringMode,
} from '@/types'

export interface ConversionSnapshot {
  mode: ConversionMode
  config: ConversionConfig
}

export interface ThemeSnapshot {
  id: string
  name: string
  mode: string
  tokens: Record<string, string>
}

export interface CreateRoundInput {
  groupId: string
  course: string
  playedOn: string
  scoringMode: ScoringMode
  conversion: ConversionSnapshot
  theme: ThemeSnapshot
  animationsEnabled: boolean
  ruleIds: string[]
}

/** The user's current joinable round (lobby or active), if any. */
export function useCurrentRound() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['current-round', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Round | null> => {
      const { data, error } = await supabase
        .from('round_players')
        .select('rounds(*)')
        .eq('profile_id', user!.id)
      if (error) throw error

      const rounds = (
        (data ?? []) as unknown as { rounds: Round | null }[]
      ).map((row) => row.rounds)
      return selectCurrentRound(rounds)
    },
  })
}

export function useRound(roundId: string | undefined) {
  return useQuery({
    queryKey: ['round', roundId],
    enabled: Boolean(roundId),
    queryFn: async (): Promise<Round | null> => {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', roundId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useRoundPlayers(roundId: string | undefined) {
  return useQuery({
    queryKey: ['round-players', roundId],
    enabled: Boolean(roundId),
    queryFn: async (): Promise<RoundPlayer[]> => {
      const { data, error } = await supabase
        .from('round_players')
        .select('*')
        .eq('round_id', roundId!)
        .order('joined_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

/** The round's active-rule snapshot (spec §5, §7), editable mid-round by the host. */
export function useRoundRules(roundId: string | undefined) {
  return useQuery({
    queryKey: ['round-rules', roundId],
    enabled: Boolean(roundId),
    queryFn: async (): Promise<RoundRule[]> => {
      const { data, error } = await supabase
        .from('round_rules')
        .select('*')
        .eq('round_id', roundId!)
      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Live lobby population (spec §5): subscribe to Postgres changes on round_players,
 * the round row, and round_rules, refreshing the cached queries as players
 * join/leave and the host adjusts the active rules mid-round.
 */
export function useRoundRealtime(roundId: string | undefined) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!roundId) return
    const channel = supabase
      .channel(`round:${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'round_players',
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['round-players', roundId] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `id=eq.${roundId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['round', roundId] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'round_rules',
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['round-rules', roundId] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId, qc])
}

export function useCreateRound() {
  return useMutation({
    mutationFn: async (input: CreateRoundInput): Promise<Round> => {
      const { data, error } = await supabase.rpc('create_round', {
        p_group_id: input.groupId,
        p_course: input.course,
        p_played_on: input.playedOn,
        p_scoring_mode: input.scoringMode,
        p_conversion: input.conversion,
        p_theme: input.theme,
        p_animations: input.animationsEnabled,
        p_rule_ids: input.ruleIds,
      })
      if (error) throw error
      return data as Round
    },
  })
}

export function useJoinRound() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string): Promise<Round> => {
      const { data, error } = await supabase.rpc('join_round_with_code', {
        p_code: code,
      })
      if (error) throw error
      return data as Round
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['current-round', user?.id] })
    },
  })
}

export function useAddGuest(roundId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (displayName: string): Promise<void> => {
      const { error } = await supabase.rpc('add_round_guest', {
        p_round_id: roundId!,
        p_display_name: displayName,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['round-players', roundId] })
    },
  })
}

export function useStartRound() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roundId: string): Promise<Round> => {
      const { data, error } = await supabase.rpc('start_round', {
        p_round_id: roundId,
      })
      if (error) throw error
      return data as Round
    },
    onSuccess: (round) => {
      void qc.invalidateQueries({ queryKey: ['round', round.id] })
      void qc.invalidateQueries({ queryKey: ['current-round', user?.id] })
    },
  })
}

/** Add a group rule to a live round's active set (host only; RLS enforced). */
export function useAddRoundRule(roundId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId: string): Promise<void> => {
      const { error } = await supabase.rpc('add_round_rule', {
        p_round_id: roundId!,
        p_rule_id: ruleId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['round-rules', roundId] })
    },
  })
}

/** Remove a rule from a live round's active set (host only; RLS enforced). */
export function useRemoveRoundRule(roundId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId: string): Promise<void> => {
      const { error } = await supabase.rpc('remove_round_rule', {
        p_round_id: roundId!,
        p_rule_id: ruleId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['round-rules', roundId] })
    },
  })
}
