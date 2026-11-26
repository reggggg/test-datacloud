import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Cloud } from 'lucide-react'
import type { ReactNode } from 'react'

export function Brand() {
  return <span className="brand">
    <span className="brand-mark"><Cloud size={21} strokeWidth={2.2} /></span>
    <span>CloudLedger<span className="brand-period">.</span></span>
  </span>
}

export function Picker({ label, value, onChange, options, icon }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  icon?: ReactNode
}) {
  return <Select.Root value={value} onValueChange={onChange}>
    <Select.Trigger className="button select-trigger" aria-label={label}>
      {icon}<Select.Value /><Select.Icon asChild><ChevronDown size={14} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className="popover" position="popper" sideOffset={6} align="end">
        <Select.Viewport>
          {options.map(option => <Select.Item key={option.value} className="popover-item" value={option.value}>
            <Select.ItemText>{option.label}</Select.ItemText>
            <Select.ItemIndicator className="select-check"><Check size={14} /></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
}
