export default function GlassCard({ as: Tag = 'div', className = '', hover = false, children, ...props }) {
  return (
    <Tag
      className={`glass ${hover ? 'glass-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
