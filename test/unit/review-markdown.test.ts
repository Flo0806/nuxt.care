import { describe, it, expect } from 'vitest'
import { linkifyMentions } from '../../app/utils/review-markdown'

describe('linkifyMentions', () => {
  it('links a mention', () => {
    expect(linkifyMentions('Could you update your branch @Jamiewarb ?'))
      .toBe('Could you update your branch [@Jamiewarb](https://github.com/Jamiewarb) ?')
  })

  it('links a mention at the very start', () => {
    expect(linkifyMentions('@danielroe wdyt?'))
      .toBe('[@danielroe](https://github.com/danielroe) wdyt?')
  })

  it('links several mentions in one sentence', () => {
    const out = linkifyMentions('ping @arashsheyda and @Neo-Zhixing')

    expect(out).toContain('[@arashsheyda](https://github.com/arashsheyda)')
    expect(out).toContain('[@Neo-Zhixing](https://github.com/Neo-Zhixing)')
  })

  it('leaves email addresses alone', () => {
    expect(linkifyMentions('write to flo@example.com')).toBe('write to flo@example.com')
  })

  it('leaves a scoped package name alone', () => {
    const text = 'install @pinia/nuxt first'

    // The scope itself is a valid login, but the slash must not end up inside
    // the link text.
    expect(linkifyMentions(text)).toBe('install [@pinia](https://github.com/pinia)/nuxt first')
  })

  it('does not touch a fenced code block', () => {
    const text = 'see\n\n```yml\nnpm: "@scope/thing"\n```\n\nthanks @atinux'
    const out = linkifyMentions(text)

    expect(out).toContain('npm: "@scope/thing"')
    expect(out).toContain('[@atinux](https://github.com/atinux)')
  })

  it('does not touch inline code', () => {
    expect(linkifyMentions('use `@nuxt/kit` please'))
      .toBe('use `@nuxt/kit` please')
  })

  it('keeps a body without mentions unchanged', () => {
    const text = 'The readme is very poor and no example is available.'
    expect(linkifyMentions(text)).toBe(text)
  })
})
