import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray'
export function Badge({
  variant = 'gray',
  children,
  className,
}: {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}) {
  const styles: Record<BadgeVariant, string> = {
    green:  'bg-green-50 text-green-700 border border-green-200',
    red:    'bg-red-50 text-red-700 border border-red-200',
    amber:  'bg-amber-50 text-amber-700 border border-amber-200',
    blue:   'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    gray:   'bg-slate-100 text-slate-600 border border-slate-200',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', styles[variant], className)}>
      {children}
    </span>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'outline' | 'danger' | 'ghost'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: 'sm' | 'md'
  loading?: boolean
  icon?: ReactNode
}
export function Button({ variant = 'outline', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
    danger:  'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:ring-red-400',
    ghost:   'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
  }
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
      <input
        className={clsx(
          'w-full border rounded-lg px-3 py-2 text-sm text-slate-900 bg-white outline-none transition-all',
          'placeholder:text-slate-400',
          error ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}
export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
      <select
        className={clsx(
          'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white outline-none',
          'focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
      <textarea
        className={clsx(
          'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white outline-none resize-y min-h-[80px]',
          'focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all',
          className
        )}
        {...props}
      />
    </div>
  )
}

// ── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex w-10 h-5.5 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500',
        checked ? 'bg-green-500' : 'bg-slate-200'
      )}
    >
      <span className={clsx(
        'inline-block w-4 h-4 bg-white rounded-full shadow transition-transform',
        checked ? 'translate-x-5' : 'translate-x-1'
      )} />
    </button>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={clsx('bg-white border border-slate-200 rounded-xl shadow-sm', padding && 'p-5', className)}>
      {children}
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, icon, change, changeDir = 'up', color = 'green',
}: {
  label: string; value: string | number; icon: ReactNode
  change?: string; changeDir?: 'up' | 'down'; color?: 'green' | 'blue' | 'purple' | 'amber'
}) {
  const colors = {
    green:  { icon: 'bg-green-50 text-green-600', accent: 'bg-green-500' },
    blue:   { icon: 'bg-blue-50 text-blue-600', accent: 'bg-blue-500' },
    purple: { icon: 'bg-purple-50 text-purple-600', accent: 'bg-purple-500' },
    amber:  { icon: 'bg-amber-50 text-amber-600', accent: 'bg-amber-500' },
  }
  return (
    <Card className="relative overflow-hidden">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg', colors[color].icon)}>
        {icon}
      </div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{value}</div>
      {change && (
        <div className={clsx('text-xs font-semibold flex items-center gap-1', changeDir === 'up' ? 'text-green-600' : 'text-red-500')}>
          {changeDir === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
      <div className={clsx('absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-5', colors[color].accent)} />
    </Card>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  open, onClose, title, children, width = 'max-w-lg',
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-2xl w-full overflow-auto max-h-[90vh]', width)}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-slate-300 mb-3">{icon}</div>
      <div className="text-slate-600 font-semibold">{title}</div>
      {desc && <div className="text-slate-400 text-sm mt-1">{desc}</div>}
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-green-600" />
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, action,
}: {
  title: string; subtitle?: string; action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading }: {
  headers: string[]; children: ReactNode; loading?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={clsx(loading && 'opacity-50')}>
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={clsx('border-b border-slate-100 hover:bg-slate-50 transition-colors', className)}>
      {children}
    </tr>
  )
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={clsx('px-4 py-3 text-slate-700', className)}>
      {children}
    </td>
  )
}
