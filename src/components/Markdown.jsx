// Lightweight markdown-ish renderer (bold + bullet lists + paragraphs).
// Avoids pulling a full markdown dependency for the assistant's short replies.
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-white">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  )
}

export default function Markdown({ text, className = '' }) {
  const lines = (text || '').split('\n')
  const blocks = []
  let list = []

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-1.5 space-y-1.5 pl-1">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushList()
      continue
    }
    if (/^[-*•]\s+/.test(line)) {
      list.push(line.replace(/^[-*•]\s+/, ''))
    } else {
      flushList()
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-1 leading-relaxed">
          {renderInline(line)}
        </p>
      )
    }
  }
  flushList()

  return <div className={`text-sm text-white/75 ${className}`}>{blocks}</div>
}
