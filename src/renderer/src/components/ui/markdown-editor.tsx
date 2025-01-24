import { cn } from '@/lib/utils'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Document } from '@tiptap/extension-document'
import { Typography } from '@tiptap/extension-typography'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { useEffect } from 'react'
import { Markdown } from 'tiptap-markdown'

const lowlight = createLowlight(common)

interface MarkdownEditorProps {
  content?: string
  onChange?: (markdown: string) => void
  className?: string
}

export function MarkdownEditor({ content = '', onChange, className }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      CodeBlockLowlight.configure({
        lowlight
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: false,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true
      }),
      Typography,
      Document
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-theme mx-auto focus:outline-none min-h-full pb-6 select-text'
      }
    },
    content,
    onUpdate: ({ editor }: { editor: Editor }) => {
      const markdown = editor.storage.markdown.getMarkdown()
      onChange?.(markdown)
    }
  })

  useEffect(() => {
    if (editor && content !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className={cn('h-full w-full', className)}>
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert h-full w-full max-w-none p-4 
          [&_p]:text-sm 
          [&_pre]:bg-muted 
          [&_pre]:p-4 
          [&_pre]:rounded-md 
          [&_.ProseMirror]:h-full 
          [&_.ProseMirror]:outline-none 
          [&_*]:text-foreground
          [&_h1]:text-3xl
          [&_h1]:font-semibold
          [&_h1]:mb-4
          [&_h2]:text-2xl
          [&_h2]:font-semibold
          [&_h2]:mb-3
          [&_h3]:text-xl
          [&_h3]:font-semibold
          [&_h3]:mb-2
          [&_ul]:list-disc
          [&_ul]:ml-6
          [&_ol]:list-decimal
          [&_ol]:ml-6
          [&_li]:my-1
          [&_blockquote]:border-l-2
          [&_blockquote]:border-muted-foreground
          [&_blockquote]:pl-4
          [&_blockquote]:italic
          [&_code]:bg-muted
          [&_code]:rounded
          [&_code]:px-1
          [&_code]:py-0.5
          [&_code]:text-sm"
      />
    </div>
  )
}
