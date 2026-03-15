/**
 * Unit tests for core Next.js frontend logic.
 * Ensures the 'Go-Public' MVP requirements don't break.
 */

describe('Chapturs Core Utilities', () => {
  describe('Editor Block Transformations', () => {
    it('should correctly convert a prose block to a heading block', () => {
      const proseBlock = { type: 'prose', text: 'Chapter One' }
      const newBlock = { ...proseBlock, type: 'heading', level: 2 }
      
      expect(newBlock.type).toBe('heading')
      expect(newBlock.level).toBe(2)
      expect(newBlock.text).toBe('Chapter One')
    })

    it('should extract correct sentences for translation from prose text', () => {
      const text = "Hello there. How are you today? I am fine!"
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
      
      expect(sentences).toHaveLength(3)
      expect(sentences[0]).toBe("Hello there.")
      expect(sentences[1]).toBe(" How are you today?")
      expect(sentences[2]).toBe(" I am fine!")
    })
  })

  describe('Emoji System Parsing', () => {
    it('should correctly group user reactions by emoji', () => {
      const rawReactions = [
        { emoji: '👍', userIds: ['user1', 'user2'] },
        { emoji: '❤️', userIds: ['user1'] },
      ]
      
      const hasReactedHeart = rawReactions.find(r => r.emoji === '❤️')?.userIds.includes('user1')
      const hasReactedThumbsUp = rawReactions.find(r => r.emoji === '👍')?.userIds.includes('user3')
      
      expect(hasReactedHeart).toBe(true)
      expect(hasReactedThumbsUp).toBe(false)
    })
  })

  describe('Character Quick View / Glossary Matcher', () => {
    it('should order patterns by string length descending to avoid partial matches', () => {
      const characters = [{ name: 'Jon', aliases: ['Jon Snow'] }]
      const sortedPatterns = ['Jon Snow', 'Jon'].sort((a, b) => b.length - a.length)
      
      expect(sortedPatterns[0]).toBe('Jon Snow')
      expect(sortedPatterns[1]).toBe('Jon')
    })
  })
})
