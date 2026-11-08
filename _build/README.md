# FACT 홈페이지 제작 원본

fact.kaist.ac.kr의 세 페이지(`index.html`, `nexspace/index.html`, `folio/index.html`)는 이 폴더의 원본으로 만듭니다.
결과 파일을 직접 고치면 다음 빌드 때 덮어써지므로, 내용은 항상 이 폴더에서 고친 뒤 빌드합니다.
밑줄로 시작하는 폴더라서 GitHub Pages가 이 폴더를 웹사이트에 올리지 않습니다.

## 빌드

```
python3 _build/build.py
```

- `pdftotext`(poppler-utils)가 필요합니다. CV의 표시 월을 PDF에서 읽기 때문입니다.
- 마지막 줄이 `checks: ok`이면 정상입니다. `BUILD CHECK FAILED`가 나오면 아래 목록을 고친 뒤 다시 빌드합니다.
- 점검 항목: 로컬 주소와 로컬 경로, Drive 링크 노출, 새로 쓴 문장의 가운뎃점과 긴 대시, 페이지가 가리키는 파일의 존재.
- `main`에 푸시하면 GitHub Pages가 몇 분 안에 반영합니다.

## 파일

| 파일 | 내용 |
|---|---|
| `base.html` | 처음 만든 홈페이지. 빌드가 이 파일에 섹션과 수정 사항을 더합니다 |
| `build.py` | 조립과 점검. 참여교수 홈페이지 목록(`FACULTY`), 기존 소식 항목, 겸임 문구, CV 링크도 여기 있습니다 |
| `schedule.js` | 센터 운영 일정 항목 |
| `news-extra.js` | 새 소식 항목 |
| `tools.html` | 홈의 플랫폼 섹션(NexSpace, Folio 카드) |
| `nexspace.tpl.html`, `nx-*.css`, `nx-sim.js`, `nx-figure.html` | KAIST NexSpace 페이지와 그림 |
| `folio.tpl.html`, `fo-*.css`, `fo.js`, `fo-figure.html` | FACT Folio 페이지와 그림 |
| `contact.js` | 이메일 주소 복사 버튼 |

이미지와 PDF는 사이트 루트에 둡니다. 소식 포스터는 `news/`, Folio 화면은 `folio/`, CV는 `cv.pdf`(영문)와 `cv-ko.pdf`(국문)입니다.

## CV 교체

1. Drive의 `증명서류 > CV`에서 가장 최근 판을 찾습니다. 파일 이름은 `Cha_CV_English_YYMM.pdf`, `Cha_CV_Korean_YYMM.pdf` 형식이고, 이전 판은 `Previous` 폴더에 있습니다.
2. 공개 전에 전문을 읽어 주민등록번호, 생년월일, 자택 주소, 개인 휴대전화, 개인 이메일, 가족 사항, 급여가 없는지 확인합니다. 사무실 주소와 전화, shcha@kaist.ac.kr, fact.kaist@gmail.com은 이미 공개된 정보입니다.
3. 영문판을 루트의 `cv.pdf`로, 국문판을 `cv-ko.pdf`로 덮어씁니다. 주소가 바뀌지 않아 기존 링크가 그대로 최신 파일을 가리킵니다.
4. 빌드하면 1쪽의 `Updated <Month> <Year>`를 읽어 프로필의 표시(예: 2026.11)를 바꿉니다. 두 파일의 월이 다르면 빌드가 멈춥니다.

## 운영 일정 추가 (`schedule.js`)

```
{ date:'2026-11-20', time:'15:20', cat:'forum',
  ko:{ title:'국문 제목', place:'장소', note:'한 줄 설명', link:'news/파일.jpg', linkText:'포스터 보기' },
  en:{ title:'English title', place:'Venue', note:'One line', link:'news/파일.jpg', linkText:'View poster' } },
```

- 항목 사이는 쉼표로 구분합니다. `cat`은 agreement(협약), forum(포럼), seminar(세미나), workshop(워크숍), symposium(심포지엄), lecture(강연), meeting(회의), event(행사) 중 하나입니다.
- 일정은 날짜가 늦은 것이 위에 오도록 정렬됩니다. 예정, 오늘, 종료 표시는 방문한 날의 한국 날짜에 맞춰 화면에서 자동으로 바뀌고, 지난 일정은 아래쪽에 흐리게 보입니다.
- 공개 행사이거나 공개해도 되는 일정만 넣습니다. 학생 면담, 내부 회의, 개인 일정은 넣지 않습니다.

## 소식 추가 (`news-extra.js`)

```
{ date:'2026-12-01', cat:'event', poster:'news/2026-12-01-이름.jpg', thumb:'news/2026-12-01-이름-thumb.jpg',
  ko:{ title:'국문 제목', body:'국문 설명', link:'news/2026-12-01-이름.jpg', linkText:'포스터 보기' },
  en:{ title:'English title', body:'English summary', link:'news/2026-12-01-이름.jpg', linkText:'View poster' } },
```

- 항목마다 끝에 쉼표를 붙입니다. `cat`은 notice, event, research, press, recruit 중 하나입니다.
- 포스터는 `news/`에 원본(긴 변 1600px 안팎 JPEG)과 폭 300px 미리보기(`-thumb.jpg`)를 함께 올립니다.

## 문장 원칙

- 가운뎃점과 긴 대시(엠 대시, 엔 대시)를 쓰지 않습니다. 쉼표와 하이픈을 씁니다. 빌드가 이 문자를 찾아 알려 줍니다.
- 실행해 확인한 결과만 검증했다고 씁니다. 목표 수치, 계획, 합성 자료 결과는 그렇다고 밝힙니다.
- 로컬 주소(127.0.0.1, localhost), 로컬 경로, Drive나 Docs 링크, 비공개 도구의 주소는 페이지에 넣지 않습니다.
- 사람, 기관, 직함, 날짜는 원문(메일, 포스터, 공식 페이지)으로 확인한 뒤 씁니다.
