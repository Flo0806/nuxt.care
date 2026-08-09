import { describe, it, expect } from 'vitest'
import type { NuxtApiModule } from '../../shared/types/modules'
import {
  createErrorModule,
  descriptorFromNuxtApi,
  resolveModuleType,
  type ModuleDescriptor,
} from '../../server/utils/module-analysis'

const apiModule: NuxtApiModule = {
  name: 'pinia',
  npm: '@pinia/nuxt',
  repo: 'vuejs/pinia#v2/packages/nuxt',
  description: 'The Vue Store',
  category: 'Extensions',
  type: '3rd-party',
  icon: 'pinia.svg',
  maintainers: [{ name: 'posva' }, { name: 'someone' }],
  compatibility: { nuxt: '^3.15.0 || ^4.0.0' },
}

describe('descriptorFromNuxtApi', () => {
  it('maps every field the analysis needs', () => {
    const desc = descriptorFromNuxtApi(apiModule)

    expect(desc.name).toBe('pinia')
    expect(desc.npm).toBe('@pinia/nuxt')
    expect(desc.repo).toBe('vuejs/pinia#v2/packages/nuxt')
    expect(desc.category).toBe('Extensions')
    expect(desc.icon).toBe('pinia.svg')
    expect(desc.compatibility).toBe('^3.15.0 || ^4.0.0')
  })

  it('flattens maintainers to names', () => {
    expect(descriptorFromNuxtApi(apiModule).maintainers).toEqual(['posva', 'someone'])
  })

  it('defaults maintainers to an empty array when absent', () => {
    const desc = descriptorFromNuxtApi({ ...apiModule, maintainers: undefined })
    expect(desc.maintainers).toEqual([])
  })

  it('defaults stats to null when absent', () => {
    expect(descriptorFromNuxtApi(apiModule).stats).toBeNull()
  })
})

describe('resolveModuleType', () => {
  it('treats the nuxt org as official', () => {
    expect(resolveModuleType('nuxt/image')).toBe('official')
  })

  it('treats the community orgs as community', () => {
    expect(resolveModuleType('nuxt-community/sitemap-module')).toBe('community')
    expect(resolveModuleType('nuxt-modules/icon')).toBe('community')
    expect(resolveModuleType('nuxt-content/foo')).toBe('community')
  })

  it('treats everything else as 3rd-party', () => {
    expect(resolveModuleType('someone/nuxt-thing')).toBe('3rd-party')
  })

  it('does not match orgs that merely start with the same letters', () => {
    expect(resolveModuleType('nuxtlabs/something')).toBe('3rd-party')
  })
})

describe('createErrorModule', () => {
  const desc: ModuleDescriptor = {
    name: 'broken',
    npm: 'nuxt-broken',
    repo: 'someone/nuxt-broken',
    description: 'desc',
    category: 'UI',
    maintainers: ['someone'],
  }

  it('keeps the identity of the module', () => {
    const mod = createErrorModule(desc, new Error('boom'))

    expect(mod.name).toBe('broken')
    expect(mod.npmPackage).toBe('nuxt-broken')
    expect(mod.repo).toBe('someone/nuxt-broken')
  })

  it('records the failure as a signal instead of a silent zero', () => {
    const mod = createErrorModule(desc, new Error('boom'))

    expect(mod.health.score).toBe(0)
    expect(mod.health.signals).toHaveLength(1)
    expect(mod.health.signals[0]?.key).toBe('error')
    expect(mod.health.signals[0]?.msg).toContain('boom')
  })

  it('leaves every fetched signal null so nothing is mistaken for real data', () => {
    const mod = createErrorModule(desc, new Error('boom'))

    expect(mod.github).toBeNull()
    expect(mod.npm).toBeNull()
    expect(mod.vulnerabilities).toBeNull()
    expect(mod.nuxtApiCompat).toBeNull()
    expect(mod.ciStatus).toBeNull()
  })

  it('defaults the type when the descriptor has none', () => {
    expect(createErrorModule(desc, 'x').type).toBe('3rd-party')
  })
})
