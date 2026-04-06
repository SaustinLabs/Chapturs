'use client'

import { useState, useRef } from 'react'
import { ChatBlock, ChatMessage, ChatPlatform, DialogueBlock, PhoneBlock, NarrationBlock, ImageBlock } from '@/types/chapt'
import { MessageCircle, Phone, Users, BookOpen, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import RichTextEditor from './RichTextEditor'

// ============================================================================
// CHAT BLOCK EDITOR
// ============================================================================

interface ChatBlockEditorProps {
  block: ChatBlock
  mode: 'edit' | 'preview' | 'translate'
  onUpdate: (updates: Partial<ChatBlock>) => void
}

export function ChatBlockEditor({ block, mode, onUpdate }: ChatBlockEditorProps) {
  const [newMessage, setNewMessage] = useState({ user: '', text: '' })
  const [editingChannelName, setEditingChannelName] = useState(false)
  const [tempChannelName, setTempChannelName] = useState('')

  const addMessage = () => {
    if (!newMessage.user || !newMessage.text) return
    
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      user: newMessage.user,
      text: newMessage.text,
      timestamp: new Date().toISOString(),
      status: 'read'
    }

    onUpdate({
      messages: [...block.messages, message]
    })

    setNewMessage({ user: '', text: '' })
  }

  const removeMessage = (messageId: string) => {
    onUpdate({
      messages: block.messages.filter(m => m.id !== messageId)
    })
  }

  const updateMessage = (messageId: string, updates: Partial<ChatMessage>) => {
    onUpdate({
      messages: block.messages.map(m =>
        m.id === messageId ? { ...m, ...updates } : m
      )
    })
  }

  const startEditingChannelName = () => {
    setTempChannelName(block.channelName || getDefaultChannelName(block.platform))
    setEditingChannelName(true)
  }

  const finishEditingChannelName = () => {
    if (tempChannelName.trim()) {
      onUpdate({ channelName: tempChannelName.trim() })
    }
    setEditingChannelName(false)
  }

  const getDefaultChannelName = (platform: ChatPlatform): string => {
    const defaults: Record<ChatPlatform, string> = {
      discord: '#general',
      whatsapp: 'WhatsApp',
      sms: 'Messages',
      telegram: 'Telegram',
      slack: '#general',
      generic: 'Chat'
    }
    return defaults[platform]
  }

  // Render chat UI based on platform
  const renderChatPreview = () => {
    const platformStyles = getPlatformStyles(block.platform)
    const isEditing = mode === 'edit'
    const channelName = block.channelName || getDefaultChannelName(block.platform)

    return (
      <div className={`rounded-lg overflow-hidden ${platformStyles.container}`}>
        {/* Platform Header */}
        <div className={platformStyles.header}>
          <div className="flex items-center gap-2">
            <MessageCircle size={16} />
            {isEditing && editingChannelName ? (
              <input
                type="text"
                value={tempChannelName}
                onChange={(e) => setTempChannelName(e.target.value)}
                onBlur={finishEditingChannelName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditingChannelName()
                  if (e.key === 'Escape') setEditingChannelName(false)
                }}
                autoFocus
                className="bg-gray-700 text-white px-2 py-1 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={getDefaultChannelName(block.platform)}
              />
            ) : (
              <span
                className={isEditing ? 'cursor-pointer hover:bg-opacity-20 hover:bg-white px-2 py-1 rounded' : 'font-medium'}
                title={isEditing ? 'Click to edit channel name' : ''}
              >
                {channelName}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={`${platformStyles.body} space-y-2 p-4 max-h-96 overflow-y-auto`}>
          {block.messages.map((message) => (
            <div key={message.id} className="flex items-start gap-2">
              {(block.platformStyle?.showAvatars ?? true) && (
                <div className="w-8 h-8 rounded-full bg-gray-400 flex-shrink-0 flex items-center justify-center text-white text-xs">
                  {message.user[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={platformStyles.username}>{message.user}</span>
                  {block.platformStyle?.showTimestamps && (
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp || '').toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
                <div 
                  className={platformStyles.message}
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mode === 'preview' || mode === 'translate') {
    return renderChatPreview()
  }

  // Edit Mode
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-gray-600" />
          <span className="font-medium">Chat Block</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={block.platform}
            onChange={(e) => onUpdate({ platform: e.target.value as ChatPlatform })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700"
          >
            <option value="discord">Discord</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="telegram">Telegram</option>
            <option value="slack">Slack</option>
            <option value="generic">Generic</option>
          </select>
        </div>
      </div>

      {/* Display Options */}
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={block.platformStyle?.showAvatars ?? true}
            onChange={(e) => onUpdate({ 
              platformStyle: { 
                ...block.platformStyle, 
                showAvatars: e.target.checked 
              } 
            })}
            className="rounded"
          />
          <span>Show Avatars</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={block.platformStyle?.showTimestamps ?? true}
            onChange={(e) => onUpdate({ 
              platformStyle: { 
                ...block.platformStyle, 
                showTimestamps: e.target.checked 
              } 
            })}
            className="rounded"
          />
          <span>Show Timestamps</span>
        </label>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded p-2">
        {renderChatPreview()}
      </div>

      {/* Message List */}
      <div className="space-y-2">
        {block.messages.map((message, index) => (
          <div key={message.id} className="flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={message.user}
                onChange={(e) => updateMessage(message.id, { user: e.target.value })}
                placeholder="Username"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <RichTextEditor
                value={message.text}
                onChange={(html) => updateMessage(message.id, { text: html })}
                placeholder="Message text (supports emojis, images, formatting)"
                minHeight="60px"
              />
            </div>
            <button
              onClick={() => removeMessage(message.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Message Form */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={newMessage.user}
          onChange={(e) => setNewMessage({ ...newMessage, user: e.target.value })}
          placeholder="Username"
          className="px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <input
          type="text"
          value={newMessage.text}
          onChange={(e) => setNewMessage({ ...newMessage, text: e.target.value })}
          placeholder="Message text"
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
          onKeyDown={(e) => e.key === 'Enter' && addMessage()}
        />
        <button
          onClick={addMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// PHONE UI BLOCK EDITOR
// ============================================================================

interface PhoneBlockEditorProps {
  block: PhoneBlock
  mode: 'edit' | 'preview' | 'translate'
  onUpdate: (updates: Partial<PhoneBlock>) => void
}

export function PhoneBlockEditor({ block, mode, onUpdate }: PhoneBlockEditorProps) {
  const [newMessage, setNewMessage] = useState({ user: '', text: '', isOwner: false })
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')

  // Get unique senders for autocomplete
  const uniqueSenders = Array.from(new Set(block.content.map(m => m.user))).filter(Boolean)
  const phoneOwner = block.phoneOwner || 'You'

  const addMessage = () => {
    if (!newMessage.user || !newMessage.text) return
    
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      user: newMessage.user,
      text: newMessage.text,
      timestamp: new Date().toISOString(),
      status: 'read'
    }

    onUpdate({
      content: [...block.content, message]
    })

    setNewMessage({ user: '', text: '', isOwner: false })
  }

  const removeMessage = (messageId: string) => {
    onUpdate({
      content: block.content.filter(m => m.id !== messageId)
    })
  }

  const startEditing = (field: string, currentValue: string | number) => {
    setEditingField(field)
    setTempValue(String(currentValue))
  }

  const finishEditing = (field: string) => {
    if (!tempValue.trim() && field !== 'batteryLevel' && field !== 'signalStrength') {
      setEditingField(null)
      return
    }

    const ui = block.ui || {}
    
    switch (field) {
      case 'time':
        onUpdate({ ui: { ...ui, time: tempValue } })
        break
      case 'carrier':
        onUpdate({ ui: { ...ui, carrier: tempValue } })
        break
      case 'batteryLevel':
        const battery = parseInt(tempValue)
        if (!isNaN(battery) && battery >= 0 && battery <= 100) {
          onUpdate({ ui: { ...ui, batteryLevel: battery } })
        }
        break
      case 'signalStrength':
        const signal = parseInt(tempValue)
        if (!isNaN(signal) && signal >= 0 && signal <= 5) {
          onUpdate({ ui: { ...ui, signalStrength: signal } })
        }
        break
    }
    
    setEditingField(null)
    setTempValue('')
  }

  const renderPhonePreview = () => {
    const isIOS = block.phoneType === 'ios'
    const isEditing = mode === 'edit'

    return (
      <div className="mx-auto max-w-sm">
        {/* Phone Frame */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl ${isIOS ? 'bg-black' : 'bg-gray-900'}`}>
          {/* Notch/Status Bar */}
          <div className={`${isIOS ? 'h-8' : 'h-6'} bg-black flex items-center justify-between px-6 text-white text-xs`}>
            {/* Time - Editable */}
            {isEditing && editingField === 'time' ? (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => finishEditing('time')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditing('time')
                  if (e.key === 'Escape') setEditingField(null)
                }}
                autoFocus
                className="bg-gray-800 text-white px-1 rounded w-16 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="9:41"
              />
            ) : (
              <span
                onClick={() => isEditing && startEditing('time', block.ui?.time || '9:41')}
                className={isEditing ? 'cursor-pointer hover:bg-gray-800 px-1 rounded' : ''}
                title={isEditing ? 'Click to edit time' : ''}
              >
                {block.ui?.time || '9:41'}
              </span>
            )}
            
            <div className="flex items-center gap-2">
              {/* Carrier - Editable */}
              {isEditing && editingField === 'carrier' ? (
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => finishEditing('carrier')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing('carrier')
                    if (e.key === 'Escape') setEditingField(null)
                  }}
                  autoFocus
                  className="bg-gray-800 text-white px-1 rounded w-20 outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Carrier"
                />
              ) : (
                <span
                  onClick={() => isEditing && startEditing('carrier', block.ui?.carrier || 'Carrier')}
                  className={isEditing ? 'cursor-pointer hover:bg-gray-800 px-1 rounded' : ''}
                  title={isEditing ? 'Click to edit carrier' : ''}
                >
                  {block.ui?.carrier || 'Carrier'}
                </span>
              )}
              
              {/* Signal Strength - Editable */}
              {isEditing && editingField === 'signalStrength' ? (
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => finishEditing('signalStrength')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing('signalStrength')
                    if (e.key === 'Escape') setEditingField(null)
                  }}
                  autoFocus
                  className="bg-gray-800 text-white px-1 rounded w-12 outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span
                  onClick={() => isEditing && startEditing('signalStrength', block.ui?.signalStrength || 4)}
                  className={isEditing ? 'cursor-pointer hover:bg-gray-800 px-1 rounded' : ''}
                  title={isEditing ? 'Click to edit signal (0-5)' : ''}
                >
                  📶 {block.ui?.signalStrength || 4}/5
                </span>
              )}
              
              {/* Battery Level - Editable */}
              {isEditing && editingField === 'batteryLevel' ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={() => finishEditing('batteryLevel')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing('batteryLevel')
                    if (e.key === 'Escape') setEditingField(null)
                  }}
                  autoFocus
                  className="bg-gray-800 text-white px-1 rounded w-12 outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span
                  onClick={() => isEditing && startEditing('batteryLevel', block.ui?.batteryLevel || 85)}
                  className={isEditing ? 'cursor-pointer hover:bg-gray-800 px-1 rounded' : ''}
                  title={isEditing ? 'Click to edit battery (0-100)' : ''}
                >
                  🔋 {block.ui?.batteryLevel || 85}%
                </span>
              )}
            </div>
          </div>

          {/* Screen Content */}
          <div className="bg-white h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="font-medium">Messages</div>
                  <div className="text-xs text-gray-500">Online</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {block.content.map((message) => {
                const isSent = message.user === phoneOwner
                
                return (
                  <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isSent 
                        ? 'bg-blue-500 text-white rounded-br-sm' 
                        : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                    }`}>
                      {!isSent && (
                        <div className="text-xs font-medium mb-1 opacity-70">{message.user}</div>
                      )}
                      <div className="text-sm">{message.text}</div>
                      {block.ui && (
                        <div className={`text-xs mt-1 ${isSent ? 'text-blue-100' : 'text-gray-600'}`}>
                          {new Date(message.timestamp || '').toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {isSent && message.status === 'read' && ' ✓✓'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input Bar */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-gray-300">
                <span className="text-gray-400">iMessage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'preview' || mode === 'translate') {
    return renderPhonePreview()
  }

  // Edit Mode
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={18} className="text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Phone UI Block</span>
        </div>
        <div className="flex gap-2">
          <select
            value={block.phoneType || 'ios'}
            onChange={(e) => onUpdate({ phoneType: e.target.value as 'ios' | 'android' | 'generic' })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700"
          >
            <option value="ios">iOS</option>
            <option value="android">Android</option>
            <option value="generic">Generic</option>
          </select>
        </div>
      </div>

      {/* Phone Owner Setting */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Owner (Perspective):</label>
        <input
          type="text"
          value={phoneOwner}
          onChange={(e) => onUpdate({ phoneOwner: e.target.value })}
          placeholder="You"
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
          list="phone-owner-suggestions"
        />
        <datalist id="phone-owner-suggestions">
          {uniqueSenders.map(sender => (
            <option key={sender} value={sender} />
          ))}
        </datalist>
        <span className="text-xs text-gray-600 dark:text-gray-400">(Their messages appear on the right)</span>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded p-4">
        {renderPhonePreview()}
      </div>

      {/* Message Editor */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Messages:</div>
        {block.content.map((message) => {
          const isSent = message.user === phoneOwner
          return (
            <div key={message.id} className={`flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 ${isSent ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2 items-center">
                  <select
                    value={message.user}
                    onChange={(e) => {
                      onUpdate({
                        content: block.content.map(m =>
                          m.id === message.id ? { ...m, user: e.target.value } : m
                        )
                      })
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700"
                  >
                    <option value="">Select sender...</option>
                    {uniqueSenders.map(sender => (
                      <option key={sender} value={sender}>{sender}</option>
                    ))}
                    {!uniqueSenders.includes(message.user) && message.user && (
                      <option value={message.user}>{message.user}</option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={message.user}
                    onChange={(e) => {
                      onUpdate({
                        content: block.content.map(m =>
                          m.id === message.id ? { ...m, user: e.target.value } : m
                        )
                      })
                    }}
                    placeholder="Or type sender name"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                    list="message-sender-suggestions"
                  />
                  <datalist id="message-sender-suggestions">
                    {uniqueSenders.map(sender => (
                      <option key={sender} value={sender} />
                    ))}
                  </datalist>
                  <span className={`text-xs px-2 py-1 rounded ${isSent ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    {isSent ? '→ Sent' : '← Received'}
                  </span>
                </div>
                <textarea
                  value={message.text}
                  onChange={(e) => {
                    onUpdate({
                      content: block.content.map(m =>
                        m.id === message.id ? { ...m, text: e.target.value } : m
                      )
                    })
                  }}
                  placeholder="Message text"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                  rows={2}
                />
              </div>
              <button
                onClick={() => removeMessage(message.id)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Delete message"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add New Message */}
      <div className="space-y-2 border-t pt-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Message:</div>
        <div className="flex flex-wrap gap-2">
          <select
            value={newMessage.user}
            onChange={(e) => setNewMessage({ ...newMessage, user: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700"
          >
            <option value="">Select sender...</option>
            <option value={phoneOwner}>{phoneOwner} (Phone Owner)</option>
            {uniqueSenders.filter(s => s !== phoneOwner).map(sender => (
              <option key={sender} value={sender}>{sender}</option>
            ))}
          </select>
          <input
            type="text"
            value={newMessage.user}
            onChange={(e) => setNewMessage({ ...newMessage, user: e.target.value })}
            placeholder="Or type sender name"
            className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            list="new-message-sender-suggestions"
          />
          <datalist id="new-message-sender-suggestions">
            <option value={phoneOwner} />
            {uniqueSenders.map(sender => (
              <option key={sender} value={sender} />
            ))}
          </datalist>
          <input
            type="text"
            value={newMessage.text}
            onChange={(e) => setNewMessage({ ...newMessage, text: e.target.value })}
            placeholder="Message text"
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            onKeyDown={(e) => e.key === 'Enter' && addMessage()}
          />
          <button
            onClick={addMessage}
            disabled={!newMessage.user || !newMessage.text}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DIALOGUE BLOCK EDITOR
// ============================================================================

interface DialogueBlockEditorProps {
  block: DialogueBlock
  mode: 'edit' | 'preview' | 'translate'
  onUpdate: (updates: Partial<DialogueBlock>) => void
}

export function DialogueBlockEditor({ block, mode, onUpdate }: DialogueBlockEditorProps) {
  const addLine = () => {
    onUpdate({
      lines: [...block.lines, { speaker: '', text: '', emotion: undefined }]
    })
  }

  const updateLine = (index: number, updates: Partial<DialogueBlock['lines'][0]>) => {
    const newLines = [...block.lines]
    newLines[index] = { ...newLines[index], ...updates }
    onUpdate({ lines: newLines })
  }

  const removeLine = (index: number) => {
    onUpdate({
      lines: block.lines.filter((_, i) => i !== index)
    })
  }

  if (mode === 'preview' || mode === 'translate') {
    return (
      <div className="mx-auto max-w-4xl px-8 space-y-2 my-4">
        {block.lines.map((line, index) => (
          <div key={index} className="text-gray-900 dark:text-gray-100">
            <span className="font-semibold">{line.speaker}</span>: "{line.text}"
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <span className="font-medium">Dialogue Block</span>
        </div>
      </div>

      <div className="space-y-2">
        {block.lines.map((line, index) => (
          <div key={index} className="flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={line.speaker}
                  onChange={(e) => updateLine(index, { speaker: e.target.value })}
                  placeholder="Speaker"
                  className="w-40 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded font-medium text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  value={line.emotion || ''}
                  onChange={(e) => updateLine(index, { emotion: e.target.value || undefined })}
                  placeholder="Emotion (optional)"
                  className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <textarea
                value={line.text}
                onChange={(e) => updateLine(index, { text: e.target.value })}
                placeholder="Dialogue text"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
              />
            </div>
            <button
              onClick={() => removeLine(index)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addLine}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded hover:border-gray-400 text-gray-600 flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Line
      </button>
    </div>
  )
}

// ============================================================================
// NARRATION BLOCK EDITOR
// ============================================================================

interface NarrationBlockEditorProps {
  block: NarrationBlock
  mode: 'edit' | 'preview' | 'translate'
  onUpdate: (updates: Partial<NarrationBlock>) => void
}

export function NarrationBlockEditor({ block, mode, onUpdate }: NarrationBlockEditorProps) {
  const variant = block.style?.variant || 'box'
  const position = block.style?.position || 'center'

  if (mode === 'preview' || mode === 'translate') {
    return (
      <div className="mx-auto max-w-4xl px-8 my-4">
        <div className="font-serif text-base leading-relaxed text-gray-900 dark:text-gray-100 text-center italic">
          {block.text}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-gray-600" />
          <span className="font-medium">Narration Block</span>
        </div>
        <div className="flex gap-2">
          <select
            value={variant}
            onChange={(e) => onUpdate({ 
              style: { ...block.style, variant: e.target.value as 'box' | 'overlay' | 'inline' }
            })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700"
          >
            <option value="box">Box</option>
            <option value="overlay">Overlay</option>
            <option value="inline">Inline</option>
          </select>
          <select
            value={position}
            onChange={(e) => onUpdate({ 
              style: { ...block.style, position: e.target.value as 'top' | 'center' | 'bottom' }
            })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>

      <textarea
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Narrator commentary..."
        className="w-full min-h-[100px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none font-serif text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
      />

    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlatformStyles(platform: ChatPlatform) {
  const styles = {
    discord: {
      container: 'bg-[#36393f]',
      header: 'bg-[#2f3136] text-gray-100 px-4 py-2 text-sm',
      body: 'bg-[#36393f]',
      username: 'font-semibold text-blue-400 text-sm',
      message: 'text-gray-100 text-sm'
    },
    whatsapp: {
      container: 'bg-[#efeae2]',
      header: 'bg-[#075e54] text-white px-4 py-2 text-sm',
      body: 'bg-[#efeae2]',
      username: 'font-semibold text-gray-700 text-sm',
      message: 'bg-white rounded-lg px-3 py-2 text-sm shadow-sm'
    },
    sms: {
      container: 'bg-white',
      header: 'bg-gray-100 text-gray-900 px-4 py-2 text-sm border-b border-gray-200',
      body: 'bg-white',
      username: 'font-semibold text-gray-700 text-sm',
      message: 'text-gray-900 text-sm'
    },
    telegram: {
      container: 'bg-white',
      header: 'bg-[#0088cc] text-white px-4 py-2 text-sm',
      body: 'bg-[#f4f4f5]',
      username: 'font-semibold text-blue-500 text-sm',
      message: 'bg-white rounded-lg px-3 py-2 text-sm shadow-sm'
    },
    slack: {
      container: 'bg-white',
      header: 'bg-[#4a154b] text-white px-4 py-2 text-sm',
      body: 'bg-white',
      username: 'font-bold text-gray-900 text-sm',
      message: 'text-gray-900 text-sm'
    },
    generic: {
      container: 'bg-gray-50',
      header: 'bg-gray-200 text-gray-900 px-4 py-2 text-sm',
      body: 'bg-gray-50',
      username: 'font-semibold text-gray-700 text-sm',
      message: 'text-gray-900 text-sm'
    }
  }

  return styles[platform] || styles.generic
}

// ============================================================================
// IMAGE BLOCK EDITOR
// (Moved here from ChaptursEditor.tsx so NodeViews can import it)
// ============================================================================

interface ImageBlockEditorProps {
  block: ImageBlock
  mode: 'edit' | 'preview' | 'translate'
  onUpdate: (updates: Partial<ImageBlock>) => void
}

export function ImageBlockEditor({ block, mode, onUpdate }: ImageBlockEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Only JPEG, PNG, WebP, and GIF images are allowed')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/cover', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Upload failed')
      }
      const data = await res.json()
      onUpdate({ url: data.imageUrl })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (mode === 'preview' || mode === 'translate') {
    return (
      <div className="my-4">
        {block.url ? (
          <div>
            <img
              src={block.url}
              alt={block.alt || ''}
              className="w-full h-auto rounded-lg"
              style={{ maxWidth: block.width || '100%', maxHeight: block.height || 'auto' }}
            />
            {block.caption && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 italic">
                {block.caption}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <ImageIcon size={48} className="mx-auto mb-2" />
              <p>No image URL provided</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <ImageIcon size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">Image Block</span>
      </div>

      {/* Source tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'url' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          URL
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Upload to hosting
        </button>
      </div>

      <div className="space-y-3">
        {activeTab === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
            <input
              type="text"
              value={block.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
            {block.url ? (
              <div className="space-y-2">
                <img src={block.url} alt="" className="max-h-40 rounded object-contain" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Replace image
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                <ImageIcon size={28} />
                <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Click to upload image'}</span>
                <span className="text-xs">JPEG, PNG, WebP, GIF · max 6 MB</span>
              </button>
            )}
            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alt Text</label>
          <input
            type="text"
            value={block.alt || ''}
            onChange={(e) => onUpdate({ alt: e.target.value })}
            placeholder="Describe the image for accessibility"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption (optional)</label>
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Image caption"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Width</label>
            <input
              type="text"
              value={block.width || ''}
              onChange={(e) => onUpdate({ width: e.target.value })}
              placeholder="e.g., 500px or 100%"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Height</label>
            <input
              type="text"
              value={block.height || ''}
              onChange={(e) => onUpdate({ height: e.target.value })}
              placeholder="e.g., 300px or auto"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {block.url && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
          <img
            src={block.url}
            alt={block.alt || ''}
            className="w-full h-auto rounded"
            style={{ maxWidth: block.width || '100%', maxHeight: '400px' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
    </div>
  )
}
