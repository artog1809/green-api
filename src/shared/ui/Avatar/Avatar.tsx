import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  size?: 'medium' | 'small'
}

/** Цвет аватара детерминирован по имени, чтобы чат «узнавался» в списке. */
const PALETTE = ['#6c4df6', '#e5484d', '#30a46c', '#f76808', '#0091ff', '#8e4ec6']

function initials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  if (!cleaned) return '#'

  // Номера телефонов различаются концом: по первым цифрам все чаты были бы «79».
  const digits = cleaned.replace(/\s+/g, '')
  if (/^\d+$/.test(digits)) return digits.slice(-2)

  const [first = '', second = ''] = cleaned.split(' ')
  return (first.slice(0, 1) + second.slice(0, 1)) || first.slice(0, 1)
}

function colorFor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash + char.codePointAt(0)!) % PALETTE.length
  return PALETTE[hash]!
}

export function Avatar({ name, size = 'medium' }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${size === 'small' ? styles.small : ''}`}
      style={{ backgroundColor: colorFor(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
