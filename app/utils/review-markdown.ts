// Preparing a GitHub comment for rendering.

/**
 * Options for `<MDC>`.
 *
 * `rehype-raw` is switched off: comment bodies are written by anyone on
 * GitHub, and with it on, raw HTML inside a comment would end up in the page.
 * Markdown itself stays complete, code blocks included, which escaping the
 * angle brackets would have broken.
 *
 * `as const` matters: the plugin map is typed `Record<string, false | Plugin>`,
 * and without it the `false` widens to `boolean` and stops fitting.
 */
export const COMMENT_PARSER_OPTIONS = {
  rehype: { plugins: { 'rehype-raw': false } },
} as const

/** Fenced blocks and inline code, kept as they are. */
const CODE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/

/**
 * GitHub logins: letters, digits and single hyphens, at most 39 characters.
 * The leading guard keeps email addresses and `.../@scope` paths out.
 */
const MENTION = /(^|[^\w/@-])@([a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38})/g

/**
 * Turns `@someone` into a markdown link.
 *
 * GitHub renders these itself, plain markdown does not. Code stays untouched,
 * so a shell snippet or a scoped package name in a fence is left alone.
 */
export function linkifyMentions(body: string): string {
  return body
    .split(CODE)
    // split with a capturing group puts the code parts at the odd indexes.
    .map((part, index) => (index % 2 === 1 ? part : linkify(part)))
    .join('')
}

function linkify(text: string): string {
  return text.replace(
    MENTION,
    (_match, before: string, login: string) =>
      `${before}[@${login}](https://github.com/${login})`,
  )
}
