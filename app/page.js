'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const analyze = async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReport(data.report)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        📊 네이버 종목토론방 여론 분석기
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        네이버 종목토론방 링크를 입력하면 최근 24시간 여론을 분석해드려요
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://stock.naver.com/domestic/stock/005930/discussion"
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#03C75A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '분석 중...' : '분석하기'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fff0f0', borderRadius: '8px', color: '#e00', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          🔍 게시글을 분석하고 있어요... 잠시만 기다려주세요
        </div>
      )}

      {report && (
        <div style={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '24px' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.8', fontFamily: 'sans-serif' }}>
            {report}
          </pre>
        </div>
      )}
    </main>
  )
}
