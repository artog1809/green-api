import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('для номера берёт последние цифры, а не первые', () => {
    // По первым цифрам все российские номера выглядели бы одинаково.
    const { container } = render(<Avatar name="+7 988 057-75-52" />)

    expect(container.textContent).toBe('52')
  })

  it('для имени берёт инициалы', () => {
    const { container } = render(<Avatar name="Иван Петров" />)

    expect(container.textContent).toBe('ИП')
  })

  it('не падает на пустом имени', () => {
    const { container } = render(<Avatar name="   " />)

    expect(container.textContent).toBe('#')
  })
})
