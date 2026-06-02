import * as cheerio from 'cheerio'

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url || !url.includes('stock.naver.com')) {
      return Response.json({ error: '올바른 네이버 종목토론방 링크를 입력해주세요' }, { status: 400 })
    }

    // 종목 코드 추출
    const match = url.match(/stock\/([^/]+)\/discussion/)
    if (!match) {
      return Response.json({ error: '종목 코드를 찾을 수 없어요' }, { status: 400 })
    }
    const stockCode = match[1]

    // 네이버 모바일 토론방 크롤링
    const posts = []
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://finance.naver.com/item/board.naver?code=${stockCode}&page=${page}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            Referer: 'https://finance.naver.com/',
          },
        }
      )

      const html = await res.text()
      const $ = cheerio.load(html)

      let stopPaging = false

      $('table.type2 tbody tr').each((_, row) => {
        const tds = $(row).find('td')
        if (tds.length < 4) return

        const dateStr = $(tds[0]).text().trim()
        const title = $(tds[1]).find('a').text().trim()
        const author = $(tds[2]).text().trim()

        if (!title || !dateStr) return

        // 날짜 파싱 (형식: 2024.01.15 10:30)
        const postDate = new Date(dateStr.replace(/\./g, '-').replace(' ', 'T'))
        if (isNaN(postDate.getTime())) return

        if (postDate.getTime() < oneDayAgo) {
          stopPaging = true
          return false
        }

        posts.push({ title, author, date: dateStr })
      })

      if (stopPaging) break
    }

    if (posts.length === 0) {
      return Response.json({ error: '최근 24시간 내 게시글이 없거나 데이터를 가져올 수 없어요' }, { status: 404 })
    }

    // Claude API로 분석
    const postText = posts.map((p, i) => `${i + 1}. [${p.date}] ${p.title}`).join('\n')

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `아래는 네이버 종목토론방의 최근 24시간 게시글 제목 목록이야. 개인투자자들의 여론을 분석해줘.

게시글 목록 (총 ${posts.length}개):
${postText}

다음 형식으로 분석 리포트를 작성해줘:

📊 여론 분석 리포트
━━━━━━━━━━━━━━━━━━━━
📅 분석 기간: 최근 24시간
📝 분석 게시글 수: ${posts.length}개

🎯 전체 여론 온도
[긍정 / 중립 / 부정 비율을 % 로 표시]

😊 긍정 의견 요약
[주요 긍정적 의견 3가지 bullet point]

😟 부정 의견 요약  
[주요 부정적 의견 3가지 bullet point]

🔥 주요 관심사
[투자자들이 가장 많이 언급하는 키워드나 이슈 3가지]

💬 총평
[2-3문장으로 전체적인 여론 요약]`,
          },
        ],
      }),
    })

    const claudeData = await claudeRes.json()
    const report = claudeData.content?.[0]?.text

    if (!report) {
      return Response.json({ error: 'AI 분석에 실패했어요. 잠시 후 다시 시도해주세요' }, { status: 500 })
    }

    return Response.json({ report, postCount: posts.length })
  } catch (e) {
    return Response.json({ error: '서버 오류가 발생했어요: ' + e.message }, { status: 500 })
  }
}
