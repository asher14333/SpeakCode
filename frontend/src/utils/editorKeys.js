const INDENT = '    '

export function handleEditorKeyDown(e, value, setValue) {
  const el = e.target

  if (e.key === 'Tab') {
    e.preventDefault()
    const start = el.selectionStart
    const end = el.selectionEnd

    if (start !== end) {
      const before = value.slice(0, start)
      const selected = value.slice(start, end)
      const after = value.slice(end)
      const lines = selected.split('\n')

      if (e.shiftKey) {
        const dedented = lines
          .map((line) =>
            line.startsWith(INDENT)
              ? line.slice(INDENT.length)
              : line.startsWith('\t')
                ? line.slice(1)
                : line
          )
          .join('\n')
        setValue(before + dedented + after)
      } else {
        const indented = lines.map((line) => INDENT + line).join('\n')
        setValue(before + indented + after)
      }
      return
    }

    const next = value.slice(0, start) + INDENT + value.slice(end)
    setValue(next)
    const cursor = start + INDENT.length
    requestAnimationFrame(() => {
      el.selectionStart = cursor
      el.selectionEnd = cursor
    })
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.slice(lineStart, start)
    const leading = currentLine.match(/^(\s*)/)[1]
    const extra = currentLine.trimEnd().endsWith(':') ? INDENT : ''
    const insert = '\n' + leading + extra
    const next = value.slice(0, start) + insert + value.slice(el.selectionEnd)
    setValue(next)
    const cursor = start + insert.length
    requestAnimationFrame(() => {
      el.selectionStart = cursor
      el.selectionEnd = cursor
    })
  }
}
