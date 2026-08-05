import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './security'

describe('serializeJsonLd', () => {
  it('script etiketini kapatabilecek kullanıcı içeriğini kaçışlar', () => {
    const serialized = serializeJsonLd({
      name: '</script><script>alert("xss")</script>',
    })

    expect(serialized).not.toContain('<')
    expect(serialized).not.toContain('>')
    expect(JSON.parse(serialized)).toEqual({
      name: '</script><script>alert("xss")</script>',
    })
  })

  it('HTML bağlamında anlamlı ampersand karakterini kaçışlar', () => {
    expect(serializeJsonLd({ name: 'Tenis & Spor' })).toContain('Tenis \\u0026 Spor')
  })
})
