#!/usr/bin/env python3
"""Assemble the FACT homepage (fact.kaist.ac.kr) and the NexSpace and Folio pages.

Reads  : base.html (the original homepage), the templates and data files in this folder,
         ../cv.pdf and ../cv-ko.pdf (for the CV month shown on the profile)
Writes : ../index.html, ../nexspace/index.html and ../folio/index.html
Run    : python3 _build/build.py
How to update the site: see README.md in this folder.
"""
import html
import math
import os
import re
import subprocess
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()


def once(s, old, new):
    n = s.count(old)
    assert n == 1, (n, old[:80])
    return s.replace(old, new)


def mailto(subject, body):
    q = 'subject=' + urllib.parse.quote(subject, safe='') + '&body=' + urllib.parse.quote(body, safe='')
    return html.escape('mailto:fact.kaist@gmail.com?' + q, quote=True)


MAIL_KO = mailto('KAIST NexSpace 시연 문의', '기관명:\n담당자:\n검토하려는 건물 유형과 설계 단계:\n')
MAIL_EN = mailto('KAIST NexSpace demo request', 'Organization:\nName:\nBuilding type and design stage:\n')
FO_MAIL_KO = mailto('FACT Folio 시연 및 실증 협력 문의', '기관명:\n담당자:\n검토하려는 공모의 유형과 일정:\n')
FO_MAIL_EN = mailto('FACT Folio demo and pilot inquiry', 'Organization:\nName:\nCompetition type and schedule:\n')

index = open(os.path.join(HERE, 'base.html'), encoding='utf-8').read()
figure = SRC('nx-figure.html').strip()
sim_js = SRC('nx-sim.js').strip()
common_css = SRC('nx-common.css').strip()
page_css = SRC('nx-page.css').strip()
fo_figure = SRC('fo-figure.html').strip()
fo_js = SRC('fo.js').strip()
fo_css = SRC('fo-common.css').strip()
fo_page_css = SRC('fo-page.css').strip()
contact_js = SRC('contact.js').strip()
COPY_BTN = ('<button type="button" class="copy-mail" data-copy="fact.kaist@gmail.com"><span class="c0"><span lang="ko">주소 복사</span><span lang="en">Copy</span></span>'
            '<span class="c1"><span lang="ko">복사했습니다</span><span lang="en">Copied</span></span></button>')
FONTS_OLD = 'family=Space+Mono:wght@400;700&display=swap'
FONTS_NEW = 'family=Space+Mono:wght@400;700&family=Nanum+Myeongjo:wght@400;700&display=swap'

# ---------------------------------------------------------------- header fit (nine sections)
index = once(index, '.nav{display:flex;align-items:center;gap:22px}', '.nav{display:flex;align-items:center;gap:clamp(14px,1.5vw,22px)}')
index = once(index, '.nav-links{display:flex;align-items:center;gap:22px;', '.nav-links{display:flex;align-items:center;gap:clamp(14px,1.5vw,22px);')
index = once(index, 'white-space:nowrap}\n.nav{', 'white-space:nowrap}\n.header .brand .sub[lang=en]{display:none}\n.nav{')
index = once(index, '@media (max-width:1040px){\n  .nav-links{display:none;', '@media (max-width:1100px){\n  .nav-links{display:none;')
# research topics: no sideways scroll on 360px phones
index = once(index, 'repeat(auto-fit,minmax(250px,1fr))', 'repeat(auto-fit,minmax(min(250px,100%),1fr))')

# ---------------------------------------------------------------- homepage
home = index
tools = SRC('tools.html')
for key, val in [('{{FIGURE}}', figure), ('{{FO_FIGURE}}', fo_figure.replace('{{WIDE}}', ''))]:
    assert key in tools, key
    tools = tools.replace(key, val)
home = once(home, '<!-- 05 NEWS -->', tools.rstrip() + '\n\n<!-- 05 NEWS -->')
home = once(home, FONTS_OLD, FONTS_NEW)

# contact: platform inquiries land here, with a copy button for the address
home = once(home, '<p><a class="link mail" href="mailto:fact.kaist@gmail.com">fact.kaist@gmail.com</a></p>',
            '<p class="mailrow"><a class="link mail" href="mailto:fact.kaist@gmail.com">fact.kaist@gmail.com</a>' + COPY_BTN + '</p>')
home = once(home, '>공동 연구, 산학 과제, 자문, 방문, 채용 문의</p>', '>공동 연구, 산학 과제, 자문, 방문, 채용, 플랫폼 시연과 실증 협력 문의</p>')
home = once(home, '>Joint research, industry projects, advisory work, visits and positions</p>', '>Joint research, industry projects, advisory work, visits, positions, and platform demos and pilots</p>')
home = once(home, '<p class="ch-desc" lang="ko">공동 연구, 산학 과제, 자문, 방문과 채용에 관한 문의를 받습니다.</p>',
            '<p class="ch-desc" lang="ko">공동 연구, 산학 과제, 자문, 방문과 채용, 플랫폼 시연과 실증 협력에 관한 문의를 받습니다.</p>')
home = once(home, '<p class="ch-desc" lang="en">Joint research, industry projects, advisory work, visits and positions.</p>',
            '<p class="ch-desc" lang="en">Joint research, industry projects, advisory work, visits, positions, and platform demos and pilots.</p>')

# nav: add platforms, renumber the rest
home = once(home, '<a href="#news"><i>05</i>',
            '<a href="#platforms"><i>05</i><span lang="ko">플랫폼</span><span lang="en">Platforms</span></a>\n        <a href="#news"><i>06</i>')
home = once(home, '<a href="#partners"><i>06</i>', '<a href="#partners"><i>07</i>')
home = once(home, '<a href="#roadmap"><i>07</i>', '<a href="#roadmap"><i>08</i>')
home = once(home, '<a href="#contact"><i>08</i>', '<a href="#contact"><i>09</i>')

# section numbers and comments
for sec, old, new, label in [('news', '05', '06', 'NEWS'), ('partners', '06', '07', 'PARTNERS'),
                             ('roadmap', '07', '08', 'ROADMAP')]:
    home = once(home, '<!-- %s %s -->' % (old, label), '<!-- %s %s -->' % (new, label))
    pat = re.compile(r'(<section class="ch" id="%s">.*?<div class="ch-num">)%s(</div>)' % (sec, old), re.S)
    home, n = pat.subn(r'\g<1>%s\g<2>' % new, home, count=1)
    assert n == 1, sec
home = once(home, '<!-- 08 CONTACT / COLOPHON -->', '<!-- 09 CONTACT / COLOPHON -->')
pat = re.compile(r'(<section class="colophon" id="contact">.*?<div class="ch-num">)08(</div>)', re.S)
home, n = pat.subn(r'\g<1>09\g<2>', home, count=1)
assert n == 1
home = once(home, '.ch-num::after{content:" / 08"}', '.ch-num::after{content:" / 09"}')

# styles and script
home = once(home, '</style>\n</head>', common_css + '\n' + fo_css + '\n</style>\n</head>')
home = once(home, '</script>\n</body>', '</script>\n<script>\n' + sim_js + '\n</script>\n<script>\n' + fo_js + '\n</script>\n<script>\n' + contact_js + '\n</script>\n</body>')

# news: new item, and open only external links in a new tab
NEWS_ITEM = ("{ date:'2026-10-26', cat:'research',\n"
             "      ko:{ title:'첫 번째 FACT 플랫폼 KAIST NexSpace 소개', body:'설계 도면 단계에서 AI 에이전트로 건물의 혼잡과 대기, 보행약자 이동, 피난 안전성을 미리 예측하는 시공 전 공간 행동 시뮬레이터입니다.', link:'nexspace/', linkText:'NexSpace 소개 페이지' },\n"
             "      en:{ title:'Introducing KAIST NexSpace, the first FACT platform', body:'A pre-occupancy simulator that predicts congestion, waiting, accessibility and evacuation safety at the drawing stage, with AI agents.', link:'nexspace/?lang=en', linkText:'NexSpace page' } },\n    ")
home = once(home, "var NEWS=[\n    { date:'2026-06-30'", "var NEWS=[\n    " + NEWS_ITEM + "{ date:'2026-06-30'")
home = once(home, """href="'+esc(x.link)+'" target="_blank" rel="noopener">'""",
            """href="'+esc(x.link)+'"'+(/^https?:|\\.(jpe?g|png|pdf)$/i.test(x.link)?' target="_blank" rel="noopener"':'')+'>'""")

# news: seminar items with posters (same date keeps the order written here)
SEMINARS = (
    "{ date:'2026-10-17', cat:'event', poster:'news/2026-10-17-robot-city.jpg', thumb:'news/2026-10-17-robot-city-thumb.jpg',\n"
    "      ko:{ title:'세미나 「로봇을 맞이하는 도시와 건축」', body:'2026 한국도시설계학회 추계학술대회 세미나에서 차승현 센터장이 사회를 맡았습니다. 조영태 박사(LH 주택연구원)가 세종 로봇친화 도시를, 황경은 교수(경희대)가 로봇친화형 건축물 서비스 수용수준(RFB-LOS)을, 박성진 대표(스파크시티)가 로봇과 함께 살아가는 도시 계획을 발제했고, 남성우 박사(건축공간연구원)와 김원준 소장(조우아건축)이 토론했습니다. 주최는 한국도시설계학회 AI도시연구센터와 LH토지주택연구원, 장소는 수원컨벤션센터입니다.', link:'news/2026-10-17-robot-city.jpg', linkText:'포스터 보기' },\n"
    "      en:{ title:'Seminar: Cities and Architecture Welcoming Robots', body:'FACT director Seung Hyun Cha moderated this seminar at the 2026 autumn conference of the Urban Design Institute of Korea. Talks covered a robot-friendly city proposal for Sejong, service levels for robot-friendly buildings (RFB-LOS) and urban planning for living with robots, followed by a panel discussion. Hosted by the AI Urban Research Center of the Urban Design Institute of Korea and the LH Research Institute at the Suwon Convention Center.', link:'news/2026-10-17-robot-city.jpg', linkText:'View poster' } },\n    "
    "{ date:'2026-10-17', cat:'event', poster:'news/2026-10-17-physical-ai.jpg', thumb:'news/2026-10-17-physical-ai-thumb.jpg',\n"
    "      ko:{ title:'특별세션 「Physical AI와 都市」', body:'KAIST가 협력기관으로 참여한 2026 한국도시설계학회 추계학술대회 LH토지주택연구원 특별세션에서 차승현 센터장이 이건원 교수(고려대)와 함께 토론을 맡았습니다. 안창원 단장(IITP)의 피지컬 AI 동향과 정책, R&D 방향, 류지호 본부장(한국로봇산업진흥원)의 국가로봇 테스트필드와 로봇친화도시 대구, 양도식 박사(인천광역시 미래도시총괄)의 로봇친화도시 인천 발표가 이어졌습니다. 주관은 LH토지주택연구원과 한국도시설계학회 AI도시연구센터입니다.', link:'news/2026-10-17-physical-ai.jpg', linkText:'포스터 보기' },\n"
    "      en:{ title:'Special session: Physical AI and the City', body:'KAIST joined this LH Research Institute special session at the 2026 autumn conference of the Urban Design Institute of Korea as a partner institution, with FACT director Seung Hyun Cha and a Korea University professor as discussants. Talks covered physical AI trends, policy and R&D directions, the national robot test field and robot-friendly city of Daegu, and robot-friendly city plans for Incheon. Organized by the LH Research Institute and the AI Urban Research Center of the Urban Design Institute of Korea.', link:'news/2026-10-17-physical-ai.jpg', linkText:'View poster' } },\n    ")
home = once(home, "{ date:'2026-06-30'", SEMINARS + "{ date:'2026-06-30'")

# news: upcoming forum (dated by the event, like the seminars)
FORUM = (
    "{ date:'2026-11-20', cat:'event', poster:'news/2026-11-20-gwangju-forum.jpg', thumb:'news/2026-11-20-gwangju-forum-thumb.jpg',\n"
    "      ko:{ title:'2026 광주건축도시포럼 「AI와 사람, 도시의 미래를 잇다」', body:'11월 20일(금) 15:20 전남대학교 코스모스홀에서 열리는 2026 광주건축도시포럼의 FUTURE 2046 포럼 「AI와 도시공간의 혁신」에 차승현 센터장이 토론자로 참여합니다. 조영태 박사(LH토지주택연구원, 한국도시설계학회 연구부회장)가 발제하고 오세규 교수(한국도시설계학회 회장, 전남대학교)가 좌장을 맡으며, 박종현 교수(호남대학교), 이건원 교수(고려대학교), 추승연 교수(경북대학교)가 함께 토론합니다. 이어 이정재 대한건축학회 회장의 특별강연 「AI 활용 인간참여형 도시미기후 예측 및 통합 관리」가 있습니다. 주최는 전남광주통합특별시, 주관은 대한건축학회 광주전남지회, 광주건축단체연합회, 한국도시설계학회 광주전남지회입니다.', link:'news/2026-11-20-gwangju-forum.jpg', linkText:'포스터 보기' },\n"
    "      en:{ title:'2026 Gwangju Architecture and Urban Forum', body:'FACT director Seung Hyun Cha joins the panel of the FUTURE 2046 forum, \"AI and Innovation in Urban Space\", at the 2026 Gwangju Architecture and Urban Forum, held on November 20 from 15:20 at Cosmos Hall, Chonnam National University. The panel follows a keynote presentation and is chaired by the president of the Urban Design Institute of Korea. A special lecture by the president of the Architectural Institute of Korea on AI-based, participatory prediction and management of urban microclimate closes the program.', link:'news/2026-11-20-gwangju-forum.jpg', linkText:'View poster' } },\n    ")
home = once(home, "var NEWS=[\n    { date:'2026-10-26'", "var NEWS=[\n    " + FORUM + "{ date:'2026-10-26'")

# news: second platform
FOLIO_NEWS = ("{ date:'2026-11-05', cat:'research',\n"
              "      ko:{ title:'두 번째 FACT 플랫폼 FACT Folio 소개', body:'설계공모 출품안의 면적표를 같은 공모지침에 비추어 나란히 읽고, 항목마다 근거를 남기는 심사 보조 도구입니다. 점수와 순위, 당락은 만들지 않으며, 합성 자료로 검증을 마쳤습니다.', link:'folio/', linkText:'Folio 소개 페이지' },\n"
              "      en:{ title:'Introducing FACT Folio, the second FACT platform', body:'A review aid that reads competition entries side by side against one brief and keeps the evidence for every check. It makes no scores, rankings or verdicts, and has been verified on synthetic data.', link:'folio/?lang=en', linkText:'Folio page' } },\n    ")
home = once(home, "var NEWS=[\n    { date:'2026-11-20'", "var NEWS=[\n    " + FOLIO_NEWS + "{ date:'2026-11-20'")

# news: later items are kept in news-extra.js (each entry ends with a comma)
extra = '\n'.join(l for l in SRC('news-extra.js').splitlines() if not l.lstrip().startswith('//')).strip()
if extra:
    assert extra.endswith(','), 'news-extra.js: end every entry with a comma'
    home = once(home, "var NEWS=[\n", "var NEWS=[\n    " + extra + "\n    ")

# news: stable order for equal dates, poster thumbnails
home = once(home, "var items=NEWS.slice().sort(function(a,b){return a.date<b.date?1:-1});",
            "var items=NEWS.slice().sort(function(a,b){return a.date<b.date?1:(a.date>b.date?-1:0)});")
home = once(home, """      return '<article class="row news"'+(i>=5?' hidden data-more':'')+'><span class="d">'+esc(n.date.replace(/-/g,'.'))+'</span><div><span class="c"><span lang="ko">'+c[0]+'</span><span lang="en">'+c[1]+'</span></span>'+side('ko')+side('en')+'</div></article>';""",
            """      var th=n.poster?'<a class="th" href="'+esc(n.poster)+'" target="_blank" rel="noopener"><img src="'+esc(n.thumb||n.poster)+'" alt="'+esc(((n.ko||{}).title||'')+' 포스터, '+((n.en||{}).title||'')+' poster')+'" loading="lazy" width="300" height="424"></a>':'';
      return '<article class="row news'+(th?' has-th':'')+'"'+(i>=5?' hidden data-more':'')+'><span class="d">'+esc(n.date.replace(/-/g,'.'))+'</span><div><span class="c"><span lang="ko">'+c[0]+'</span><span lang="en">'+c[1]+'</span></span>'+side('ko')+side('en')+'</div>'+th+'</article>';""")
home = once(home, "       cat:'notice',                       분류: notice(공지) event(행사) research(연구) press(언론) recruit(채용)\n",
            "       cat:'notice',                       분류: notice(공지) event(행사) research(연구) press(언론) recruit(채용)\n"
            "       poster:'news/파일.jpg', thumb:'news/파일-thumb.jpg',   포스터 원본과 작은 미리보기 이미지 (선택, news 폴더에 올림)\n")
home = once(home, "     body, link, linkText 는 비워도 됩니다. 항목이 하나도 없으면 안내 문구가 대신 표시됩니다.\n",
            "     body, link, linkText, poster, thumb 는 비워도 됩니다. 항목이 하나도 없으면 안내 문구가 대신 표시됩니다.\n"
            "     날짜가 같은 소식은 아래 배열에 적은 순서대로 표시됩니다.\n")
NEWS_CSS = (".news.has-th{grid-template-columns:120px minmax(0,1fr) 112px}\n"
            ".news .th{display:block;align-self:start;border:1px solid var(--line);transition:border-color .2s,opacity .2s}\n"
            ".news .th:hover{border-color:var(--accent-2)}\n"
            ".news .th img{display:block;width:100%;height:auto}\n"
            "@media (max-width:860px){.news.has-th{grid-template-columns:1fr}.news .th{width:112px;margin-top:4px}}\n")
home = once(home, "@media (max-width:860px){.news{grid-template-columns:1fr}}\n",
            "@media (max-width:860px){.news{grid-template-columns:1fr}}\n" + NEWS_CSS)

# ---------------------------------------------------------------- people: affiliations, homepages, CV
# director's affiliate departments, as listed in the November 2026 CV
home = once(home, '건설및환경공학과 \u00b7 메타버스대학원 \u00b7 AI대학원 겸임 / New York University 겸임',
            '건설및환경공학과, 메타버스대학원, AI미래학과, AX학과 겸임 / New York University 겸임')
home = once(home, 'Affiliate: Civil and Environmental Engineering; Graduate School of Metaverse; AI and Future Studies, KAIST; New York University',
            'Affiliate: Department of Civil and Environmental Engineering, Graduate School of Metaverse, '
            'Department of AI and Future Studies and Department of AX, KAIST; New York University')

# each name opens that professor's homepage (checked by fetching every page)
FACULTY = [  # Korean name, English name, homepage
    ('차승현', 'Seung Hyun Cha', 'https://fsl.kaist.ac.kr/'),
    ('우운택', 'Woontack Woo', 'https://ct.kaist.ac.kr/boards/view/faculty_board_en/3031'),
    ('이진준', 'Jinjoon Lee', 'https://tx.kaist.ac.kr/professor/'),
    ('윤상호', 'Sang Ho Yoon', 'https://hcitech.org/team'),
    ('배석형', 'Seok-Hyung Bae', 'https://sketch.kaist.ac.kr/people/seokhyungbae'),
    ('김영철', 'Youngchul Kim', 'https://urbandesignlab.kaist.ac.kr/'),
    ('임리사', 'Lisa Lim', 'https://www.healthdesign.kaist.ac.kr/about'),
]
ARROW = ('<svg class="ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false">'
         '<path d="M3 1.5h5.5V7M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>')
for ko, en, url in FACULTY:
    home = once(home, '<h3><span lang="ko">%s</span><span lang="en">%s</span></h3>' % (ko, en),
                '<h3><a class="plink" href="%s" target="_blank" rel="noopener"><span lang="ko">%s</span><span lang="en">%s</span>%s</a></h3>'
                % (url, ko, en, ARROW))


def fac_links(m):
    p = m.group(0)
    for ko, en, url in FACULTY:
        p = p.replace('<b>%s</b>' % ko, '<a href="%s" target="_blank" rel="noopener"><b><span lang="ko">%s</span><span lang="en">%s</span></b></a>'
                      % (url, ko, en))
    return p


home, n = re.subn(r'<p class="g-fac">.*?</p>', fac_links, home)
assert n == 3, n
home = once(home, '대학원생은 각 참여교수 연구실 소속으로 그룹별 연구에 함께합니다.</p>',
            '대학원생은 각 참여교수 연구실 소속으로 그룹별 연구에 함께합니다. 이름을 누르면 각 교수의 홈페이지가 새 창으로 열립니다.</p>')
home = once(home, "Graduate students take part through their advisors' labs.</p>",
            "Graduate students take part through their advisors' labs. Select a name to open that professor's homepage in a new tab.</p>")

# profile links: Korean and English CVs from the latest files in Drive (증명서류 > CV), no Brunch or Threads
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
CV_SRC = {'ko': os.path.join(ROOT, 'cv-ko.pdf'), 'en': os.path.join(ROOT, 'cv.pdf')}


def cv_month(path):
    txt = subprocess.run(['pdftotext', '-l', '1', path, '-'], capture_output=True, text=True, check=True).stdout
    m = re.search(r'Updated\s+(%s)\s+(\d{4})' % '|'.join(MONTHS), txt)
    assert m, path
    return int(m.group(2)), MONTHS.index(m.group(1)) + 1


cv_y, cv_m = cv_month(CV_SRC['en'])
assert cv_month(CV_SRC['ko']) == (cv_y, cv_m)
CV_KO_LBL = '%d.%02d' % (cv_y, cv_m)
CV_EN_LBL = '%s %d' % (MONTHS[cv_m - 1][:3], cv_y)
home = once(home, '<a class="link" href="cv.pdf" download="Seung-Hyun-Cha-CV.pdf"><span lang="ko">이력서 (PDF)</span><span lang="en">Curriculum Vitae (PDF)</span></a>',
            '<a class="link" lang="ko" href="cv-ko.pdf" download="Seung-Hyun-Cha-CV-KO-%d-%02d.pdf">이력서 (%s, PDF)</a>'
            '<a class="link" lang="en" href="cv.pdf" download="Seung-Hyun-Cha-CV-EN-%d-%02d.pdf">Curriculum Vitae (%s, PDF)</a>'
            % (cv_y, cv_m, CV_KO_LBL, cv_y, cv_m, CV_EN_LBL))
home = once(home, '<a class="link" href="https://brunch.co.kr/@fslkaist" target="_blank" rel="noopener">Brunch</a>'
                  '<a class="link" href="https://www.threads.com/@fslshcha" target="_blank" rel="noopener">Threads</a>', '')

PEOPLE_CSS = (
    ".roster .who h3 .plink{display:inline-flex;align-items:baseline;gap:.34em;color:inherit;border-bottom:1px solid transparent;transition:color .2s,border-color .2s}\n"
    ".roster .who h3 .plink:hover,.roster .who h3 .plink:focus-visible{color:var(--accent-2);border-bottom-color:var(--accent-2)}\n"
    ".roster .who h3 .ext{flex:none;width:.5em;height:.5em;opacity:.5;transition:opacity .2s,transform .2s}\n"
    ".roster .who h3 .plink:hover .ext,.roster .who h3 .plink:focus-visible .ext{opacity:1;transform:translate(1px,-1px)}\n"
    ".grp .g-fac a{border-bottom:1px solid var(--line-2);transition:border-color .2s}\n"
    ".grp .g-fac a:hover,.grp .g-fac a:focus-visible{border-bottom-color:var(--accent-2)}\n"
    ".grp .g-fac a:hover b,.grp .g-fac a:focus-visible b{color:var(--accent-2)}\n"
    )

# ---------------------------------------------------------------- 08 schedule
home = once(home, '<a href="#roadmap"><i>08</i><span lang="ko">일정</span><span lang="en">Roadmap</span></a>',
            '<a href="#roadmap"><i>08</i><span lang="ko">일정</span><span lang="en">Schedule</span></a>')
home = once(home, '<h2 class="ch-title" lang="en">Center roadmap</h2>', '<h2 class="ch-title" lang="en">Center schedule</h2>')
home = once(home, '<p class="ch-desc" lang="ko">워크숍, 세미나, 심포지엄과 그룹별 연구 일정을 이곳에서 안내합니다.</p>',
            '<p class="ch-desc" lang="ko">센터가 열거나 참여하는 워크숍, 세미나, 포럼, 협약과 그룹별 연구 일정을 안내합니다.</p>')
home = once(home, '<p class="ch-desc" lang="en">Workshops, seminars, symposia and group research schedules will be announced here.</p>',
            '<p class="ch-desc" lang="en">Workshops, seminars, forums, agreements and group research dates that the center hosts or takes part in.</p>')
home = once(home, '''      <div class="empty">
        <p lang="ko">추진 일정은 운영위원회에서 확정하는 대로 게시합니다.</p>
        <p lang="en">The schedule will be posted once confirmed by the steering committee.</p>
      </div>''', '      <div class="sched" id="schedList"></div>')
SCHED_JS = r"""  /* =====================================================================
     운영 일정 추가하는 곳
     아래 SCHEDULE 배열에 항목을 하나 추가하면 날짜가 늦은 일정이 위에 오도록 정렬되고,
     지난 일정은 아래쪽에 흐리게 표시됩니다. 예정, 오늘, 종료 표시는 방문한 날의 한국 날짜에 맞춰 바뀝니다.
     형식:
     { date:'YYYY-MM-DD', time:'15:20',     날짜 (필수), 시작 시각 (선택)
       cat:'forum',                          분류: agreement(협약) forum(포럼) seminar(세미나) workshop(워크숍)
                                             symposium(심포지엄) lecture(강연) meeting(회의) event(행사)
       ko:{ title:'국문 제목', place:'장소', note:'한 줄 설명', link:'news/파일.jpg', linkText:'포스터 보기' },
       en:{ title:'English title', place:'Venue', note:'One line', link:'news/파일.jpg', linkText:'View poster' } }
     time, place, note, link, linkText 는 비워도 됩니다. 항목이 하나도 없으면 안내 문구가 대신 표시됩니다.
     ===================================================================== */
  var SCHEDULE=[
{{SCHEDULE}}
  ];
  (function renderSchedule(){
    var box=document.getElementById('schedList'); if(!box) return;
    var CAT={agreement:['협약','Agreement'],forum:['포럼','Forum'],seminar:['세미나','Seminar'],workshop:['워크숍','Workshop'],symposium:['심포지엄','Symposium'],lecture:['강연','Lecture'],meeting:['회의','Meeting'],event:['행사','Event']};
    var DK=['일','월','화','수','목','금','토'], DE=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var today=new Date(Date.now()+9*36e5).toISOString().slice(0,10);
    function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function desc(a,b){var x=a.date+(a.time||''), y=b.date+(b.time||''); return x<y?1:(x>y?-1:0)}
    var items=SCHEDULE.slice().sort(desc);
    if(!items.length){ box.innerHTML='<div class="empty"><p lang="ko">추진 일정은 운영위원회에서 확정하는 대로 게시합니다.</p><p lang="en">The schedule will be posted once confirmed by the steering committee.</p></div>'; return; }
    function row(n){
      var p=n.date.split('-'), wd=new Date(Date.UTC(+p[0],+p[1]-1,+p[2])).getUTCDay();
      var st=n.date>today?['up','예정','Upcoming']:(n.date===today?['now','오늘','Today']:['done','종료','Past']);
      var c=CAT[n.cat]||[n.cat,n.cat], tm=n.time?' '+esc(n.time):'';
      function side(l){ var x=n[l]||{}, h='<span class="t" lang="'+l+'">'+esc(x.title)+'</span>';
        if(x.place) h+='<p class="w" lang="'+l+'">'+esc(x.place)+'</p>';
        if(x.note) h+='<p class="b" lang="'+l+'">'+esc(x.note)+'</p>';
        if(x.link) h+='<a class="l" lang="'+l+'" href="'+esc(x.link)+'"'+(/^https?:|\.(jpe?g|png|pdf)$/i.test(x.link)?' target="_blank" rel="noopener"':'')+'>'+esc(x.linkText||(l==='ko'?'자세히 보기':'Read more'))+' &rarr;</a>';
        return h; }
      return '<article class="row sch '+st[0]+'"><time class="sd" datetime="'+esc(n.date+(n.time?'T'+n.time+'+09:00':''))+'"><span class="y">'+esc(p[0])+'</span><b>'+esc(p[1]+'.'+p[2])+'</b>'
        +'<span lang="ko">'+DK[wd]+'요일'+tm+'</span><span lang="en">'+DE[wd]+tm+'</span></time>'
        +'<div class="sb"><span class="c"><span lang="ko">'+c[0]+'</span><span lang="en">'+c[1]+'</span></span>'+side('ko')+side('en')+'</div>'
        +'<span class="ss"><span lang="ko">'+st[1]+'</span><span lang="en">'+st[2]+'</span></span></article>';
    }
    box.innerHTML=items.map(row).join('');
  })();

"""
SCHED_DATA = SRC('schedule.js').strip('\n')
assert SCHED_DATA.strip(), 'schedule.js is empty'
home = once(home, '  /* reveal */\n  var rv=', SCHED_JS.replace('{{SCHEDULE}}', SCHED_DATA) + '  /* reveal */\n  var rv=')
SCHED_CSS = (
    "/* schedule */\n"
    ".sched{border-top:1px solid var(--line-2)}\n"
    ".sched .sch{grid-template-columns:120px minmax(0,1fr) auto;grid-template-areas:\"d b s\";align-items:start;padding:22px 14px;margin:0 -14px}\n"
    ".sched .sch:hover{background:var(--bg-2)}\n"
    ".sch .sd{grid-area:d;display:flex;flex-direction:column;font-family:var(--mono);font-size:.7rem;letter-spacing:.04em;line-height:1.5;color:var(--fg-3)}\n"
    ".sch .sd b{font-family:var(--grot);font-size:1.6rem;font-weight:600;letter-spacing:-.01em;line-height:1.05;color:#fff;margin:2px 0 6px}\n"
    ".sch .sb{grid-area:b;min-width:0}\n"
    ".sch .c{font-family:var(--mono);font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-2)}\n"
    ".sch .t{display:block;margin-top:4px;font-size:1.1rem;font-weight:700;letter-spacing:-.01em;line-height:1.5;color:#fff}\n"
    ".sch .t[lang=en]{font-family:var(--grot);font-weight:600}\n"
    ".sched .sch .w{margin-top:6px;font-size:.86rem;color:var(--fg-3)}\n"
    ".sched .sch .b{margin-top:4px;font-size:.92rem;color:var(--fg-2)}\n"
    ".sch .l{display:inline-block;margin-top:10px;font-size:.86rem;white-space:nowrap;border-bottom:1px solid var(--line-2)}\n"
    ".sch .l:hover{color:var(--accent-2);border-color:var(--accent-2)}\n"
    ".sch .ss{grid-area:s;justify-self:end;padding:4px 9px;border:1px solid var(--accent-2);border-radius:2px;font-family:var(--mono);font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;color:#fff}\n"
    ".sch.now .ss{background:var(--accent);border-color:var(--accent)}\n"
    ".sch.done .ss{border:1px dashed var(--line-2);color:var(--fg-3)}\n"
    ".sch.done .sd b,.sch.done .t{color:var(--fg-2)}\n"
    "@media (max-width:860px){.sched .sch{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:\"d s\" \"b b\"}.sch .sd b{margin-bottom:2px}}\n")
home = once(home, '</style>\n</head>', PEOPLE_CSS + SCHED_CSS + '</style>\n</head>')

# ---------------------------------------------------------------- NexSpace page
css_all = re.search(r'<style>\n(.*?)</style>', index, re.S).group(1)


def seg(a, b=None):
    i = css_all.index(a)
    j = css_all.index(b, i) if b else len(css_all)
    return css_all[i:j]


base_css = (seg(':root{', '/* hero: scroll-scrubbed 3D */')
            + '\n'.join(l for l in css_all.splitlines() if l.startswith('.btn')) + '\n\n'
            + seg('/* index sections */', '/* research */')
            + seg('/* reveal */'))
base_css = base_css.replace('.ch-num::after{content:" / 08"}', '.ch-num::after{content:" / 09"}')
assert '" / 09"' in base_css

favicon = re.search(r'<link rel="icon" href="([^"]+)">', index).group(1)
mark = re.search(r'<a class="brand"[^>]*>\s*(<svg.*?</svg>)', index, re.S).group(1)


def layers_svg():
    C, S = math.cos(math.radians(30)), 0.5
    Wp, Dp, T = 150, 110, 7
    OX = 20 + Dp * C
    GAP, OY0 = 100, 16

    def P(u, v, oy):
        return (OX + (u - v) * C, oy + (u + v) * S)

    def pts(lst):
        return ' '.join('%.1f,%.1f' % p for p in lst)

    def dot(u, v, oy, cls, r=1.7):
        x, y = P(u, v, oy)
        return '<circle class="%s" cx="%.1f" cy="%.1f" r="%.1f"/>' % (cls, x, y, r)

    def line(cls, oy, *uv):
        return '<polyline class="%s" points="%s"/>' % (cls, pts([P(u, v, oy) for u, v in uv]))

    def motif(L, oy):
        o = []
        if L == 1:   # synthetic population
            for i in range(7):
                for j in range(9):
                    u, v = 16 + j * 15, 14 + i * 13.5
                    o.append(dot(u, v, oy, 'mb' if (i * 7 + j * 3) % 10 < 3 else 'mw'))
        elif L == 2:  # route graph and the chosen path
            N = [(40, 58), (92, 42), (136, 30), (62, 92), (106, 76), (140, 66), (84, 104), (122, 100), (142, 102)]
            E = [(0, 1), (1, 2), (0, 3), (1, 4), (2, 5), (3, 4), (4, 5), (3, 6), (4, 7), (5, 8), (6, 7), (7, 8)]
            for a, b in E:
                o.append(line('me', oy, N[a], N[b]))
            o.append(line('ml', oy, N[0], N[1], N[4], N[7], N[8]))
            for k, n in enumerate(N):
                o.append(dot(n[0], n[1], oy, 'mb' if k in (0, 8) else 'mw', 2.2 if k in (0, 8) else 1.8))
        elif L == 3:  # corridor, bottleneck door, agents with motion trails
            o.append(line('mwall', oy, (34, 50), (146, 50)))
            o.append(line('mwall', oy, (34, 76), (146, 76)))
            o.append(line('mwall', oy, (112, 50), (112, 58)))
            o.append(line('mwall', oy, (112, 68), (112, 76)))
            ag = [(44, 60, 0), (52, 69, 0), (60, 56, 1), (68, 64, 0), (76, 71, 0), (82, 58, 0), (88, 66, 1),
                  (94, 61, 0), (99, 69, 0), (104, 57, 0), (106, 64, 0), (120, 63, 0), (130, 60, 0), (138, 66, 1)]
            for u, v, slow in ag:
                tail = 4 if slow else 8
                o.append(line('mf', oy, (u - tail, v), (u, v)))
                o.append(dot(u, v, oy, 'mb' if slow else 'mw', 1.8))
        else:         # queue at a counter, spilling into the corridor
            o.append('<polygon class="mh" points="%s"/>' % pts([P(u, v, oy) for u, v in [(84, 36), (116, 36), (116, 94), (84, 94)]]))
            o.append(line('mdesk', oy, (70, 102), (130, 102)))
            q = [(100, 92), (100, 84), (100, 76), (100, 68), (100, 60), (100, 52), (100, 44), (93, 40), (86, 38), (79, 36), (72, 34)]
            for k, (u, v) in enumerate(q):
                o.append(dot(u, v, oy, 'mk' if k >= 6 else 'mw', 2.0))
            for u in (80, 100, 120):
                o.append(dot(u, 98, oy, 'mb', 2.2))
        return ''.join(o)

    names = {1: 'PERSONA', 2: 'ROUTE CHOICE', 3: 'LOCOMOTION', 4: 'QUEUE + RISK'}
    out = ['<svg id="lf" class="lf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 470" role="img" '
           'aria-label="NexSpace four-layer agent model: persona, route choice, locomotion, queue and risk">',
           '<defs><pattern id="nxh1" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
           '<rect width="6" height="6" fill="#0C0D10"/><line x1="0" y1="0" x2="0" y2="6" stroke="#8FB0FF" stroke-width="1" opacity=".16"/></pattern>'
           '<pattern id="nxh2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
           '<rect width="6" height="6" fill="#111A2E"/><line x1="0" y1="0" x2="0" y2="6" stroke="#8FB0FF" stroke-width="1" opacity=".42"/></pattern></defs>']
    for i in reversed(range(4)):
        L, oy = i + 1, OY0 + i * GAP
        a, b, c, d = P(0, 0, oy), P(Wp, 0, oy), P(Wp, Dp, oy), P(0, Dp, oy)
        left = [d, c, (c[0], c[1] + T), (d[0], d[1] + T)]
        right = [b, c, (c[0], c[1] + T), (b[0], b[1] + T)]
        an = P(142, 30, oy)
        g = ['<g class="ly" data-l="%d">' % L,
             '<polygon class="f" points="%s"/>' % pts(left),
             '<polygon class="f" points="%s"/>' % pts(right),
             '<polygon class="f top" points="%s"/>' % pts([a, b, c, d]),
             motif(L, oy),
             '<polyline class="lead" points="%.1f,%.1f 258,%.1f"/>' % (an[0], an[1], an[1]),
             '<circle class="dot" cx="%.1f" cy="%.1f" r="2.4"/>' % an,
             '<text class="lb" x="264" y="%.1f"><tspan class="lk">L%d</tspan> %s</text>' % (an[1] + 4, L, names[L]),
             '</g>']
        out.append(''.join(g))
    out.append('</svg>')
    return '\n'.join(out)


COHORTS = [
    ('휠체어, 목발 이용자', 'Wheelchair and crutch users', 0.55, '2.25×', '15%', True),
    ('고령 만성질환자 (70대 이상)', 'Older adults with chronic conditions, 70+', 0.65, '1.35×', '32%', True),
    ('영유아 동반, 유모차 보호자', 'Parents with infants and strollers', 0.85, '2.10×', '18%', True),
    ('원무, 약제, 안내 스태프', 'Admin, pharmacy and guide staff', 1.15, '1.00×', '5%', False),
    ('종합검진, 일반 성인', 'Check-up visitors and general adults', 1.20, '1.00×', '20%', False),
    ('외래 의료진, 간호사', 'Outpatient clinicians and nurses', 1.35, '1.00×', '10%', False),
]
cohorts_html = '\n          '.join(
    '<li%s><span class="nm"><span lang="ko">%s</span><span lang="en">%s</span></span>'
    '<span class="bar"><i style="width:%.1f%%;transition-delay:%.2fs"></i></span>'
    '<span class="v">%.2f</span><span class="m">%s</span><span class="p">%s</span></li>'
    % (' class="s"' if s else '', ko, en, v / 1.4 * 100, k * 0.08, v, m, p)
    for k, (ko, en, v, m, p, s) in enumerate(COHORTS))

CMP = [
    ('정적 공간 구문 분석', 'Static space syntax', '빈 도면의 시야선만 계산하고, 시간대별 유입과 대기열은 다루지 않습니다.', 'Sightlines on an empty plan, with no arrival waves or queues.', 28.1),
    ('LLM 단독 시뮬레이션', 'LLM-only simulation', '언어모델이 에이전트의 움직임을 직접 생성해 수치 오류가 쌓입니다.', 'The language model generates agent motion directly, so numeric errors build up.', 20.5),
    ('순방향 강화학습 보행 모델', 'Forward RL pedestrian models', '도면에 과적합되어 처음 온 방문자의 길 찾기를 재현하지 못합니다.', 'Agents overfit the plan and miss how first-time visitors find their way.', 16.0),
    ('대기행렬 공식 계산', 'Closed-form queueing', '평균 대기만 계산하고, 보행과 공간 간섭은 반영하지 않습니다.', 'Average waits only, with no walking or spatial interference.', 15.6),
    ('보행 물리 시뮬레이터', 'Pedestrian physics simulators', '보행은 정밀하지만 창구 처리와 대기는 다루지 않습니다.', 'Detailed walking, but no service counters or queues.', 14.3),
    ('프로세스 시뮬레이터', 'Process simulators', '대기는 계산하지만 복도 보행 간섭과 휠체어 회전 공간은 다루지 않습니다.', 'Queues are modeled, but not corridor interference or wheelchair turning space.', 14.2),
    ('KAIST NexSpace', 'KAIST NexSpace', '보행 물리, 대기행렬, 역강화학습 경로 선택, 합성 인구를 하나의 엔진에서 계산합니다.', 'Walking physics, queueing, inverse-RL route choice and a synthetic population in one engine.', 4.5),
]
cmp_rows = []
for k, (ko, en, sko, sen, val) in enumerate(CMP):
    me = ko == 'KAIST NexSpace'
    name = ko if me else '<span lang="ko">%s</span><span lang="en">%s</span>' % (ko, en)
    cmp_rows.append('<li%s><span class="lb">%s<small lang="ko">%s</small><small lang="en">%s</small></span>'
                    '<span class="tr"><i style="--w:%.2f%%;--d:%.2fs"></i></span><span class="v">%.1f%%</span></li>'
                    % (' class="me"' if me else '', name, sko, sen, val / 30 * 100, k * 0.08, val))
cmp_html = '\n        '.join(cmp_rows)

page = SRC('nexspace.tpl.html')
for key, val in [('{{CSS}}', base_css.rstrip() + '\n\n' + common_css + '\n\n' + page_css),
                 ('{{FAVICON}}', favicon), ('{{FIGURE}}', figure), ('{{LAYERS_SVG}}', layers_svg()),
                 ('{{COHORTS}}', cohorts_html), ('{{CMP}}', cmp_html), ('{{SIM_JS}}', sim_js + '\n' + contact_js),
                 ('{{MAIL_KO}}', MAIL_KO), ('{{MAIL_EN}}', MAIL_EN)]:
    assert key in page, key
    page = page.replace(key, val)
page = page.replace('{{MARK}}', mark)
assert '{{' not in page and '{{' not in home

# ---------------------------------------------------------------- FACT Folio page
folio = SRC('folio.tpl.html')
for key, val in [('{{CSS}}', base_css.rstrip() + '\n\n' + common_css + '\n\n' + page_css + '\n\n' + fo_css + '\n\n' + fo_page_css),
                 ('{{FAVICON}}', favicon), ('{{FIGURE}}', fo_figure.replace('{{WIDE}}', ' data-wide')),
                 ('{{MAIL_KO}}', FO_MAIL_KO), ('{{MAIL_EN}}', FO_MAIL_EN), ('{{FO_JS}}', fo_js + '\n' + contact_js)]:
    assert key in folio, key
    folio = folio.replace(key, val)
folio = folio.replace('{{MARK}}', mark)
assert '{{' not in folio

# ---------------------------------------------------------------- write
out = ROOT
for name, txt in (('index.html', home), (os.path.join('nexspace', 'index.html'), page), (os.path.join('folio', 'index.html'), folio)):
    os.makedirs(os.path.dirname(os.path.join(out, name)) or out, exist_ok=True)
    open(os.path.join(out, name), 'w', encoding='utf-8').write(txt)

# ---------------------------------------------------------------- checks
problems = []
LEAKS = ('sites.google', '127.0.0.1', 'localhost', 'drive.google', 'docs.google', 'C:/Users', 'OneDrive')
BANNED = ('\u00b7', '\u2014', '\u2013')   # middle dot, em dash, en dash
for name, s in (('index.html', home), ('nexspace/index.html', page), ('folio/index.html', folio)):
    leaks = [k for k in LEAKS if k in s]
    if leaks:
        problems.append('%s contains %s' % (name, leaks))
    print('%-22s %7d bytes  %5d lines' % (name, len(s.encode('utf-8')), s.count('\n') + 1), 'leaks:', leaks or 'none')
# new text must not add banned characters; the original homepage text keeps its own
for ch in BANNED:
    if home.count(ch) > index.count(ch):
        problems.append('index.html has more %r than base.html' % ch)
    for name, s in (('nexspace/index.html', page), ('folio/index.html', folio)):
        if ch in s:
            problems.append('%s contains %r' % (name, ch))
for f in sorted(os.listdir(HERE)):
    if f == 'base.html' or not f.endswith(('.html', '.css', '.js', '.md', '.py')):
        continue
    t = open(os.path.join(HERE, f), encoding='utf-8').read()
    bad = [ch for ch in BANNED if ch in t]
    if bad:
        problems.append('%s contains %r' % (f, bad))
# every local file the pages point to must exist
REF_ATTR = re.compile(r"""(?:src|href)=["']([^"'#?:]+\.(?:jpe?g|png|pdf|webp))["']""")
REF_DATA = re.compile(r"(?:poster|thumb|link):'([^':]+\.(?:jpe?g|png|pdf))'")
for name, s, base in (('index.html', home, ''), ('folio/index.html', folio, 'folio'), ('nexspace/index.html', page, 'nexspace')):
    for ref in set(REF_ATTR.findall(s)) | set(REF_DATA.findall(s)):
        if '파일' in ref:   # placeholder in the editing notes
            continue
        if not os.path.exists(os.path.normpath(os.path.join(ROOT, base, ref))):
            problems.append('%s points to a missing file: %s' % (name, ref))
if problems:
    print('BUILD CHECK FAILED')
    for x in problems:
        print('  -', x)
    sys.exit(1)
print('checks: ok (CV %s)' % CV_KO_LBL)
