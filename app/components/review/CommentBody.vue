<template>
  <MDC
    :value="markdown"
    :parser-options="COMMENT_PARSER_OPTIONS"
    tag="div"
    class="text-sm leading-relaxed
      [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
      [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-neutral-100
      [&_em]:italic
      [&_a]:text-primary-600 dark:[&_a]:text-primary-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-words
      [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc
      [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal
      [&_li]:my-0.5
      [&_code]:rounded [&_code]:bg-neutral-200/70 dark:[&_code]:bg-neutral-700/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono
      [&_pre]:my-2 [&_pre]:rounded-md [&_pre]:bg-neutral-900 dark:[&_pre]:bg-black/50 [&_pre]:p-3 [&_pre]:overflow-x-auto
      [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-neutral-100 [&_pre_code]:whitespace-pre
      [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 dark:[&_blockquote]:border-neutral-600 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-500
      [&_hr]:my-3 [&_hr]:border-neutral-300 dark:[&_hr]:border-neutral-700
      [&_img]:max-w-full [&_img]:rounded [&_img]:my-2
      [&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_table]:text-xs
      [&_th]:border [&_th]:border-neutral-300 dark:[&_th]:border-neutral-700 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left
      [&_td]:border [&_td]:border-neutral-300 dark:[&_td]:border-neutral-700 [&_td]:px-2 [&_td]:py-1
      [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm
      [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold
      [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-3 [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1"
  />
</template>

<script setup lang="ts">
// Renders one GitHub comment.
//
// Everything below is markdown that MDC already understands, mostly code
// blocks, bold and italic. Only the @mentions need a hand, because GitHub
// linkifies those itself and plain markdown does not.
//
// Deliberately no syntax highlighting: `highlight: false` is the MDC default,
// and a comment quoting a yaml snippet does not need colours to be readable.

const props = defineProps<{
  body: string
}>()

const markdown = computed(() => linkifyMentions(props.body))
</script>
