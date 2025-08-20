import { getBankColor } from '@/lib/bank-colors'
import { cn } from '@/lib/utils'

interface BankBadgeProps {
  bankName: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function BankBadge({ bankName, className, size = 'default' }: BankBadgeProps) {
  const bankColor = getBankColor(bankName)
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <div className="relative inline-flex">
      <span
        className={cn(
          'inline-flex items-center rounded-md font-medium transition-all duration-200 hover:opacity-80',
          sizeClasses[size],
          className
        )}
        style={{
          backgroundColor: bankColor.background,
          color: bankColor.text
        }}
      >
        {bankName}
      </span>
      {bankColor.accent && (
        <div
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
          style={{ backgroundColor: bankColor.accent }}
        />
      )}
    </div>
  )
}