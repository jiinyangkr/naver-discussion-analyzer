export const metadata = {
  title: '네이버 종목토론방 여론 분석기',
  description: '최근 24시간 종목토론방 여론을 AI로 분석합니다',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, backgroundColor: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
