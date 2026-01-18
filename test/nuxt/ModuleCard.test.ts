import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h, defineComponent } from 'vue'
import ModuleCard from '../../app/components/modules/ModuleCard.vue'
import type { ModuleData } from '~~/shared/types/modules'

// Stubs for UI components that require providers
const UTooltipStub = defineComponent({
  name: 'UTooltip',
  props: ['text'],
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})

const UPopoverStub = defineComponent({
  name: 'UPopover',
  props: ['mode'],
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})

const UBadgeStub = defineComponent({
  name: 'UBadge',
  props: ['color', 'variant', 'size'],
  setup(_, { slots }) {
    return () => h('span', { class: 'badge-stub' }, [slots.default?.()])
  },
})

const UIconStub = defineComponent({
  name: 'UIcon',
  props: ['name'],
  setup(props) {
    return () => h('span', { class: `icon-stub ${props.name}` })
  },
})

function createModule(overrides: Partial<ModuleData> = {}): ModuleData {
  return {
    name: 'test-module',
    npmPackage: 'test-module',
    repo: 'owner/test-module',
    description: 'Test',
    category: 'UI',
    type: 'community',
    maintainers: [],
    nuxtApiCompat: null,
    nuxtApiStats: null,
    github: null,
    topics: null,
    nuxt4Issues: null,
    release: null,
    oldestIssue: null,
    contributors: null,
    readme: null,
    ciStatus: null,
    pendingCommits: null,
    npm: null,
    keywords: null,
    nodeEngine: null,
    deps: null,
    moduleJson: null,
    vulnerabilities: null,
    health: { score: 50, signals: [] },
    ...overrides,
  }
}

const globalStubs = {
  UTooltip: UTooltipStub,
  UPopover: UPopoverStub,
  UBadge: UBadgeStub,
  UIcon: UIconStub,
}

describe('ModuleCard', () => {
  describe('Archived watermark', () => {
    it('shows "Archived" watermark when repo is archived', async () => {
      const mod = createModule({
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 5,
          archived: true,
          pushedAt: new Date().toISOString(),
          topics: [],
          license: null,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      expect(component.text()).toContain('Archived')
      expect(component.html()).toContain('bg-red-50')
    })

    it('does NOT show archived styling for active repos', async () => {
      const mod = createModule({
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 5,
          archived: false,
          pushedAt: new Date().toISOString(),
          topics: [],
          license: null,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      expect(component.html()).not.toContain('bg-red-50')
    })
  })

  describe('TypeScript badge', () => {
    it('shows TS badge when npm.hasTypes is true', async () => {
      const mod = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: '',
          daysSincePublish: null,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: true,
          hasTests: false,
          unpackedSize: null,
          downloads: null,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      expect(component.text()).toContain('TS')
    })

    it('does NOT show TS badge when npm.hasTypes is false', async () => {
      const mod = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: '',
          daysSincePublish: null,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: null,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      // The specific "TS" badge should not appear (but "Tests" may contain "ts")
      expect(component.html()).not.toContain('bg-blue-100')
    })
  })

  describe('Download formatting', () => {
    it('formats downloads >= 1000 as K', async () => {
      const mod = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: '',
          daysSincePublish: null,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: 5000,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      expect(component.text()).toContain('5K')
    })

    it('formats downloads >= 1M as M', async () => {
      const mod = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: '',
          daysSincePublish: null,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: 2500000,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      expect(component.text()).toContain('2.5M')
    })
  })

  describe('Version display', () => {
    it('shows version with v prefix', async () => {
      const mod = createModule({
        npm: {
          name: 'test',
          latestVersion: '2.1.0',
          lastPublish: '',
          daysSincePublish: null,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: null,
        },
      })

      const component = await mountSuspended(ModuleCard, {
        props: { module: mod, isFavorite: false },
        global: { stubs: globalStubs },
      })

      expect(component.text()).toContain('v2.1.0')
    })
  })
})
