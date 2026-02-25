'use client'
import { useState, useRef } from 'react'

interface Props {
  onResult: (text: string) => void
  className?: string
}

export default function VoiceInput({ onResult, className = '' }: Props) {
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  const toggle = () => {
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('音声入力は Chrome / Edge でご利用ください')
      return
    }
    const recognition = new SR()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      onResult(e.results[0][0].transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? '音声入力を停止' : '音声入力を開始'}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex-shrink-0 ${
        listening
          ? 'bg-red-500 text-white shadow-sm'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      } ${className}`}
    >
      {listening ? (
        <>
          <span className="text-base leading-none animate-pulse">●</span>
          <span>停止</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span>音声</span>
        </>
      )}
    </button>
  )
}
