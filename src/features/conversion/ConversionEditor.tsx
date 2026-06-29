import { useState } from 'react'
import { Button } from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import { Select } from '@/components/Select'
import { FormMessage } from '@/components/FormMessage'
import { errorMessage } from '@/lib/validation'
import { useUpdateConversion } from '@/lib/conversion'
import { strokesForPoints } from './convert'
import {
  DEFAULT_RATIO_CONFIG,
  DEFAULT_TIER_CONFIG,
  type RatioConfig,
  type TierConfig,
} from './types'
import type { ConversionMode, ConversionTable } from '@/types'

/** Edit a group's default points→strokes conversion (spec §8). */
export function ConversionEditor({ table }: { table: ConversionTable }) {
  const update = useUpdateConversion()
  const [mode, setMode] = useState<ConversionMode>(table.mode)
  const [tier, setTier] = useState<TierConfig>(
    table.mode === 'tier'
      ? (table.config as unknown as TierConfig)
      : DEFAULT_TIER_CONFIG,
  )
  const [ratio, setRatio] = useState<RatioConfig>(
    table.mode === 'ratio'
      ? (table.config as unknown as RatioConfig)
      : DEFAULT_RATIO_CONFIG,
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const config = mode === 'tier' ? tier : ratio

  async function save() {
    setError(null)
    try {
      await update.mutateAsync({ id: table.id, mode, config })
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function setBand(
    index: number,
    key: keyof TierConfig['tiers'][number],
    value: number,
  ) {
    setTier((t) => ({
      tiers: t.tiers.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
    }))
    setSaved(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2">
        <span className="font-label text-sm text-muted">Mode</span>
        <Select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as ConversionMode)
            setSaved(false)
          }}
        >
          <option value="tier">Tier table</option>
          <option value="ratio">Ratio</option>
        </Select>
      </label>

      {mode === 'tier' ? (
        <div className="flex flex-col gap-2">
          {tier.tiers.map((band, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-28 font-label text-xs text-muted">
                {band.minPoints}+ points
              </span>
              <TextInput
                type="number"
                inputMode="numeric"
                aria-label={`Strokes for ${band.minPoints}+ points`}
                value={String(band.strokes)}
                onChange={(e) =>
                  setBand(i, 'strokes', Number(e.target.value) || 0)
                }
                className="w-20"
              />
              <span className="font-label text-xs text-muted">strokes off</span>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const last = tier.tiers[tier.tiers.length - 1]
              setTier((t) => ({
                tiers: [
                  ...t.tiers,
                  {
                    minPoints: (last?.minPoints ?? 0) + 5,
                    strokes: (last?.strokes ?? 0) + 1,
                  },
                ],
              }))
              setSaved(false)
            }}
          >
            Add band
          </Button>
        </div>
      ) : (
        <label className="flex items-center gap-2">
          <span className="font-label text-sm text-muted">
            Points per stroke
          </span>
          <TextInput
            type="number"
            inputMode="numeric"
            value={String(ratio.pointsPerStroke)}
            onChange={(e) => {
              setRatio({ pointsPerStroke: Number(e.target.value) || 0 })
              setSaved(false)
            }}
            className="w-24"
          />
        </label>
      )}

      <p className="font-numeral text-xs text-muted">
        Preview: 12 points → −{strokesForPoints(mode, config, 12)} strokes
      </p>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <div className="flex items-center gap-2">
        <Button type="button" onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save conversion'}
        </Button>
        {saved ? <FormMessage tone="success">Saved.</FormMessage> : null}
      </div>
    </div>
  )
}
