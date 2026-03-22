

```markdown

\# ABC Seoul 프로젝트 상세 보고서

\## 작성일: 2026-03-21

\## 작성 목적: 새 채팅에서 이 보고서만 읽으면 동일한 상황에서 작업 재개 가능



\---



\## 1. 프로젝트 개요



\### 1.1 목표

서울 강남/청담/신사/서초 지역 피부과·성형외과 클리닉의 장비·시술·고민·부위 정보를 수집하여,

이중언어(한국어+영어) 검색 웹사이트 \*\*abcseoul.com\*\*을 구축한다.



\### 1.2 핵심 차별점

\- \*\*장비 기반 검색\*\*: "써마지 FLX 보유 클리닉" 검색 가능 (경쟁사에 없는 기능)

\- \*\*시술 기반 검색\*\*: 보톡스, 지방분해주사 등

\- \*\*고민 기반 검색\*\*: 피부처짐, 색소, 주름 등

\- \*\*부위 기반 검색\*\*: 얼굴, 눈, 코, 바디 등

\- \*\*이중언어\*\*: 영어(기본) + 한국어(/ko 경로), 추후 일본어·중국어 추가

\- \*\*웹 기반 SEO\*\*: 앱 중심 경쟁사(강남언니, 바비톡)와 차별화



\### 1.3 도메인

\- abcseoul.com (예정)

\- URL 구조: /en/... (영어, 기본), /ko/... (한국어)



\### 1.4 프로젝트 소유자 정보

\- 서울 강남 비만클리닉 원장

\- 전문 시술: 지방파괴주사, 지방흡입 후 유착 교정, 지방이식 후 과생착 교정

\- 병원 홈페이지: www.cclinic.kr

\- 병원 블로그: blog.naver.com/idcharm23

\- 병원 유튜브: https://www.youtube.com/@charmclinicseoul



\---



\## 2. 시스템 환경



\### 2.1 개발 PC

\- OS: Windows 11 (Build 26200.8037)

\- Python: 3.13.0 (경로: C:\\Users\\J\\AppData\\Local\\Programs\\Python\\Python313\\python.exe)

\- Node.js: v24.14.0

\- npm: 11.9.0

\- Python 3.14: 제거 완료 (2026-03-21) - Chocolatey로 설치됐다가 호환성 문제로 삭제



\### 2.2 스크래퍼 프로젝트

\- 경로: C:\\Users\\J\\Desktop\\abc\_seoul\_scraper

\- 가상환경: abc\_scraper\_env (Python 3.13.0 기반)

\- 가상환경 활성화: abc\_scraper\_env\\Scripts\\activate



\### 2.3 웹사이트 프로젝트

\- 경로: C:\\Users\\J\\Desktop\\abcseoul

\- 프레임워크: Next.js 16.2.1 (App Router)

\- 언어: TypeScript

\- 스타일: Tailwind CSS

\- 개발서버: npm run dev → http://localhost:3000



\### 2.4 API 키

\- DeepSeek API Key: .env 파일에 저장 (C:\\Users\\J\\Desktop\\abc\_seoul\_scraper\\.env)

\- 변수명: DEEPSEEK\_API\_KEY

\- 엔드포인트: https://api.deepseek.com/chat/completions

\- 모델: deepseek-chat



\---



\## 3. 스크래퍼 파이프라인 (완성)



\### 3.1 파일 구조

```

C:\\Users\\J\\Desktop\\abc\_seoul\_scraper\\

├── .env                          # DEEPSEEK\_API\_KEY

├── clinic\_urls\_ko.json           # 크롤링 대상 URL 목록 (15개 클리닉)

├── schema\_v3.py                  # 한국어+영어 추출 스키마 정의

├── scraper\_v3.py                 # 메인 스크래퍼 (한국어 크롤링 + DeepSeek 추출)

├── normalize\_devices.py          # 장비명·부위·고민 정규화 스크립트

├── export\_all.py                 # 정규화 데이터를 all\_clinics.json으로 병합

├── fix\_prompt.py                 # DeepSeek 프롬프트 교체 유틸

├── fix\_equipment.py              # 장비 키워드 우선 배치 로직

├── fix\_truncate.py               # truncation 크기 조정

├── scraper.py                    # v1 스크래퍼 (구버전)

├── scraper\_v2.py                 # v2 스크래퍼 (영어 크롤링, 구버전)

├── schema.py                     # v1 스키마 (구버전)

├── test\_deepseek.py              # API 연결 테스트

├── clinic\_urls.json              # v1 URL (구버전)

├── clinic\_urls\_v2.json           # v2 URL (구버전)

├── test\_yaan.json                # 테스트용 단일 클리닉

└── output/

&#x20;   ├── raw\_v3/                   # 크롤링된 마크다운 원본

&#x20;   │   ├── yaan\_clinic.md

&#x20;   │   ├── cellin\_clinic.md

&#x20;   │   └── ... (14개)

&#x20;   ├── clinics\_v3/               # DeepSeek 추출 결과 JSON

&#x20;   │   ├── yaan\_clinic.json

&#x20;   │   └── ... (14개)

&#x20;   ├── clinics\_normalized/       # 정규화 완료 JSON

&#x20;   │   ├── yaan\_clinic.json

&#x20;   │   └── ... (14개)

&#x20;   └── all\_clinics.json          # 전체 병합 파일

```



\### 3.2 파이프라인 흐름

1\. \*\*clinic\_urls\_ko.json\*\* 에 클리닉별 URL 정의 (한국어 공식 홈페이지)

2\. \*\*scraper\_v3.py\*\* 실행 → crawl4ai로 각 페이지 크롤링 → 마크다운 저장 (output/raw\_v3/)

3\. 마크다운에서 장비 키워드 블록을 상단에 배치 (장비 누락 방지)

4\. DeepSeek API로 구조화 JSON 추출 (output/clinics\_v3/)

5\. \*\*normalize\_devices.py\*\* 실행 → 장비명·부위·고민 정규화 (output/clinics\_normalized/)

6\. \*\*export\_all.py\*\* 실행 → all\_clinics.json 생성



\### 3.3 스크래퍼 핵심 설정

\- truncation: 50,000자 (장비 블록 우선 배치 후 나머지 45,000자)

\- max\_tokens: 8,000 (DeepSeek 응답)

\- temperature: 0.0

\- 크롤링: AsyncWebCrawler, headless=True



\### 3.4 정규화 규칙 (normalize\_devices.py 내부)

장비명 변이를 하나의 정규 이름으로 통합:

\- 서마지/써마지/써마지FLX → 써마지 FLX / Thermage FLX

\- 온다/온다리프팅/온다 리프팅 → 온다 / Onda

\- 슈링크/슈링크유니버스 → 슈링크 유니버스 / Shrink Universe

\- 울쎄라피 프라임/울쎄라 프라임 → 울쎄라 프라임 / Ulthera Prime

\- 등 약 30개 매핑 규칙



부위 정규화: 페이스→얼굴, 바디→몸, 페이스라인→얼굴윤곽 등

고민 정규화: 피부 처짐→피부처짐, 탄력저하→탄력 저하 등



\---



\## 4. 수집된 데이터 현황



\### 4.1 전체 통계

\- 총 클리닉: 14개 (13개 유효, iel\_clinic은 크롤링 실패)

\- 총 장비: 219개 항목, 132개 고유 종류

\- 총 시술: 237개

\- 총 의사: 17명

\- 주소 확보: 11개 (3개 누락: drnewcell, iel, uni\_gangnam)



\### 4.2 클리닉별 상세



| 클리닉 | 장비 | 시술 | 의사 | 주소 |

|--------|------|------|------|------|

| yaan\_clinic | 31 | 31 | 1 | 서울특별시 강남구 봉은사로82길 5 덕봉빌딩 5층 |

| cellin\_clinic | 18 | 13 | 4 | 서울 서초구 서초대로73길 9 3층 |

| ciel\_clinic | 6 | 32 | 2 | 서울 강남구 압구정로 436 상원빌딩 3층 |

| classone\_clinic | 23 | 6 | 3 | 서울 강남구 강남대로 390 미진프라자 10층 |

| drnewcell\_clinic | 10 | 30 | 0 | None (누락) |

| goldj\_clinic | 22 | 27 | 1 | 서울 강남구 테헤란로 408 대치빌딩 8층 |

| iel\_clinic | 0 | 0 | 0 | None (크롤링 실패) |

| jmskin\_clinic | 6 | 3 | 1 | 서울 서초구 사임당로 158 래미안리더스원상가 305호 |

| laurel\_clinic | 7 | 19 | 1 | 서울특별시 강남구 청담동 88-37 7층 |

| ozhean\_clinic | 30 | 15 | 1 | 서울 강남구 광평로 281 수서동 효성노틸러스 2층 |

| rest\_clinic | 16 | 12 | 1 | 서울 강남구 선릉로158길 12 3-4층 |

| uni\_gangnam | 29 | 21 | 0 | None (누락) |

| widwin\_clinic | 8 | 17 | 1 | 서울특별시 강남구 압구정로 30길 51 ISA빌딩 4층 |

| zero\_clinic | 16 | 11 | 1 | 서울특별시 서초구 강남대로 421 삼영빌딩 7층 |



\### 4.3 장비 보유 TOP 10

1\. 써마지 FLX (Thermage FLX): 10곳

2\. 포텐자 (Potenza): 10곳 (정규화 후)

3\. 울쎄라 프라임 (Ulthera Prime): 8곳

4\. 온다 (Onda): 7곳

5\. 울쎄라 (Ulthera): 6곳

6\. 슈링크 유니버스 (Shrink Universe): 6곳

7\. 티타늄 (Titanium): 6곳

8\. 인모드 (InMode): 4곳

9\. CO2 레이저 (CO2 Laser): 4곳

10\. 소프웨이브 (Sofwave): 4곳



\### 4.4 JSON 스키마 구조 (각 클리닉)

```json

{

&#x20; "clinic\_name\_ko": "야안클리닉",

&#x20; "clinic\_name\_en": "YAAN CLINIC",

&#x20; "address\_ko": "서울특별시 강남구 봉은사로82길 5 덕봉빌딩 5층",

&#x20; "address\_en": "5, Deokbong Building, 82-gil Bongeunsa-ro, Gangnam-gu, Seoul",

&#x20; "district\_ko": "강남구",

&#x20; "district\_en": "Gangnam-gu",

&#x20; "phone": "+82 10 5308 0499",

&#x20; "website": "https://enyaanclinic.com/",

&#x20; "operating\_hours": "...",

&#x20; "languages": \["Korean", "Chinese", "English", "Japanese"],

&#x20; "equipment": \[

&#x20;   {

&#x20;     "device\_name\_ko": "써마지 FLX",

&#x20;     "device\_name\_en": "Thermage FLX",

&#x20;     "manufacturer": null,

&#x20;     "category\_ko": "리프팅",

&#x20;     "category\_en": "Lifting"

&#x20;   }

&#x20; ],

&#x20; "treatments": \[

&#x20;   {

&#x20;     "name\_ko": "필러",

&#x20;     "name\_en": "Filler",

&#x20;     "category\_ko": "필러",

&#x20;     "category\_en": "Filler",

&#x20;     "price\_krw": null,

&#x20;     "body\_parts\_ko": \["얼굴", "코", "입술"],

&#x20;     "body\_parts\_en": \["Face", "Nose", "Lips"],

&#x20;     "concerns\_ko": \["볼륨 부족", "주름"],

&#x20;     "concerns\_en": \["Lack of volume", "Wrinkles"],

&#x20;     "devices\_used": \["필러"]

&#x20;   }

&#x20; ],

&#x20; "doctors": \[

&#x20;   {

&#x20;     "name\_ko": "홍길동",

&#x20;     "name\_en": "Hong Gil-dong",

&#x20;     "title\_ko": "원장",

&#x20;     "title\_en": "Director",

&#x20;     "specialties\_ko": \["리프팅", "필러"],

&#x20;     "specialties\_en": \["Lifting", "Filler"]

&#x20;   }

&#x20; ]

}

```



\---



\## 5. 웹사이트 프로젝트 (Next.js)



\### 5.1 파일 구조 (현재)

```

C:\\Users\\J\\Desktop\\abcseoul\\

├── src/

│   ├── app/

│   │   ├── page.tsx              # 홈페이지 (완성)

│   │   ├── layout.tsx            # 기본 레이아웃 (Next.js 기본)

│   │   ├── globals.css           # 글로벌 CSS (Next.js 기본)

│   │   └── devices/

│   │       └── page.tsx          # 장비 목록 페이지 (완성)

│   └── data/

│       └── all\_clinics.json      # 클리닉 데이터 (스크래퍼에서 복사)

├── package.json

├── tsconfig.json

├── tailwind.config.ts

├── next.config.ts

└── PROJECT\_REPORT.md             # 이 보고서

```



\### 5.2 완성된 페이지

1\. \*\*홈페이지\*\* (/) - 4개 카테고리 카드: Devices, Treatments, Clinics, Concerns

2\. \*\*장비 페이지\*\* (/devices) - 132개 장비를 카테고리별로 분류, 보유 클리닉 수 표시



\### 5.3 미완성 페이지 (다음에 만들 것)

1\. \*\*/clinics\*\* - 14개 클리닉 목록 (이름, 주소, 장비 수, 시술 수)

2\. \*\*/clinics/\[id]\*\* - 개별 클리닉 상세 (장비 목록, 시술 목록, 의사 정보)

3\. \*\*/treatments\*\* - 시술 목록 (카테고리별 분류)

4\. \*\*/concerns\*\* - 고민별 검색 (고민 → 관련 시술 → 보유 클리닉)

5\. \*\*/devices/\[slug]\*\* - 개별 장비 상세 (보유 클리닉 목록)

6\. \*\*한국어 경로 (/ko)\*\* - i18n 적용



\### 5.4 기술 스택

\- Next.js 16.2.1 (App Router, TypeScript)

\- Tailwind CSS

\- 데이터: 정적 JSON import (all\_clinics.json)

\- 배포 예정: Vercel

\- i18n: next-intl (미적용, 추후)

\- 검색: Algolia 또는 Meilisearch (미적용, 추후)



\---



\## 6. 전략적 결정 사항



\### 6.1 데이터 수집 전략

\- \*\*한국어 공식 홈페이지만 크롤링\*\* (네이버 블로그, 강남언니 사용 안 함)

\- 이유: 데이터 일관성, 신뢰성, 법적 안전성

\- 가격 데이터: 추후 클리닉 직접 제휴로 확보



\### 6.2 언어 전략

\- 한국어 원본 크롤링 → AI(DeepSeek)로 영어 번역

\- 웹사이트 기본 언어: 영어 (도메인이 영어)

\- 한국어: /ko 경로로 제공

\- 추후: /ja (일본어), /zh (중국어) 추가



\### 6.3 웹사이트 구축 전략

\- B(프로토타입) 먼저, A(데이터 확장) 나중에

\- 14개 클리닉으로 프로토타입 완성 → 문제점 발견 → 수정 → 50개로 확장



\---



\## 7. 비용



\### 7.1 현재까지 사용한 비용

\- DeepSeek API: 약 $0.30 (14개 클리닉 크롤링+추출)

\- 기타: 무료 (Python, Node.js, Next.js, crawl4ai)



\### 7.2 예상 비용 (50개 클리닉 확장 시)

\- DeepSeek API: 약 $1.00\~1.50

\- Vercel 배포: 무료 (Hobby 플랜)

\- 도메인 (abcseoul.com): 연 $10\~15



\---



\## 8. 알려진 이슈 및 해결 방법



\### 8.1 해결된 이슈

\- Python 3.14 호환성: lxml 빌드 실패 → 3.14 제거, 3.13 사용

\- 장비 추출 누락: truncation 문제 → 장비 키워드 블록 우선 배치로 해결

\- 장비명 분산: 정규화 스크립트로 통합

\- 의사 정보 미추출: 이미지 기반 페이지라 자동 추출 불가 → 수동 보완 필요



\### 8.2 미해결 이슈

\- 3개 클리닉 주소 누락 (drnewcell, iel, uni\_gangnam)

\- iel\_clinic 크롤링 완전 실패 (0 장비, 0 시술)

\- 의사 정보가 대부분 불완전 (이미지 기반 페이지)

\- 가격 정보 없음



\---



\## 9. 다음 작업 우선순위



1\. \*\*Clinics 페이지\*\* (/clinics) - 클리닉 목록 카드

2\. \*\*Treatments 페이지\*\* (/treatments) - 시술 목록

3\. \*\*Concerns 페이지\*\* (/concerns) - 고민별 검색

4\. \*\*개별 장비 상세 페이지\*\* (/devices/\[slug]) - 장비 클릭 → 보유 클리닉 목록

5\. \*\*개별 클리닉 상세 페이지\*\* (/clinics/\[id]) - 장비·시술·의사 상세

6\. \*\*한국어 i18n 적용\*\*

7\. \*\*클리닉 50개로 확장\*\* (URL 추가 + scraper\_v3.py 재실행)

8\. \*\*Vercel 배포\*\*



\---



\## 10. 명령어 Quick Reference



\### 스크래퍼 실행

```bash

cd C:\\Users\\J\\Desktop\\abc\_seoul\_scraper

abc\_scraper\_env\\Scripts\\activate

python scraper\_v3.py                    # 크롤링 + 추출

python normalize\_devices.py             # 정규화

python export\_all.py                    # all\_clinics.json 생성

```



\### 데이터 웹사이트로 복사

```bash

copy C:\\Users\\J\\Desktop\\abc\_seoul\_scraper\\output\\all\_clinics.json C:\\Users\\J\\Desktop\\abcseoul\\src\\data\\all\_clinics.json

```



\### 웹사이트 개발서버

```bash

cd C:\\Users\\J\\Desktop\\abcseoul

npm run dev                              # http://localhost:3000

```



\### 데이터 확인 명령어

```bash

\# 장비 보유 클리닉 수 TOP 20

python -c "import json,os;eq={};\[eq.setdefault(e.get('device\_name\_en','?'),\[]).append(f.replace('.json','')) for f in os.listdir('output/clinics\_normalized') for e in json.load(open('output/clinics\_normalized/'+f,'r',encoding='utf-8')).get('equipment',\[])];top=sorted(eq.items(),key=lambda x:-len(x\[1]))\[:20];\[print(f'{name:30s} | {len(clinics):2d} clinics') for name,clinics in top]"



\# 전체 클리닉 통계

python -c "import json,os; files=sorted(os.listdir('output/clinics\_normalized')); print(f'Total: {len(files)} clinics'); \[print(f'{f:30s} | Equip: {len(json.load(open(\\"output/clinics\_normalized/\\"+f,\\"r\\",encoding=\\"utf-8\\")).get(\\"equipment\\",\[])):2d} | Treat: {len(json.load(open(\\"output/clinics\_normalized/\\"+f,\\"r\\",encoding=\\"utf-8\\")).get(\\"treatments\\",\[])):2d}') for f in files]"

```

```



