import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ScoreBadge from '../../app/components/modules/ScoreBadge.vue'
import type { HealthSignal } from '~~/shared/types/modules'

describe('ScoreBadge', () => {
  it('renders score value', async () => {
    const component = await mountSuspended(ScoreBadge, {
      props: { score: 85 },
    })

    expect(component.text()).toContain('85')
  })

  it('applies green color for score >= 70', async () => {
    const component = await mountSuspended(ScoreBadge, {
      props: { score: 75 },
    })

    expect(component.html()).toContain('bg-green')
  })

  it('applies yellow color for score >= 40 and < 70', async () => {
    const component = await mountSuspended(ScoreBadge, {
      props: { score: 55 },
    })

    expect(component.html()).toContain('bg-yellow')
  })

  it('applies red color for score < 40', async () => {
    const component = await mountSuspended(ScoreBadge, {
      props: { score: 25 },
    })

    expect(component.html()).toContain('bg-red')
  })

  it('shows popover content when signals provided', async () => {
    const signals: HealthSignal[] = [
      { type: 'positive', msg: 'Has tests', points: 12, maxPoints: 12 },
      { type: 'warning', msg: 'No TypeScript', points: 0, maxPoints: 10 },
    ]

    const component = await mountSuspended(ScoreBadge, {
      props: { score: 60, signals },
    })

    // UPopover should be rendered when signals exist
    expect(component.html()).toContain('cursor-help')
  })
})
