# 환경 명세 표준 포맷

강사가 작성하는 환경 명세 파일의 표준 형식입니다.

## 필수 항목

```markdown
# 환경 명세 — [강의명]

## 프레임워크
- name: [프레임워크명]
- version: [버전 (x.x.x 또는 x.x.x 이상)]

## 언어
- name: [언어명]
- version: [버전]

## 빌드 도구
- name: [빌드 도구명]
- variant: [변형 (선택)]

## 의존성
- [의존성 1]
- [의존성 2]
- ...

## 검증 명령
- [빌드/테스트 명령어]
```

## 선택 항목

```markdown
## 프로젝트 경로
- [설치할 경로 (기본: ~/dev-setup/{프레임워크명})]

## IDE
- name: [IDE명]
- extensions: [확장 목록]

## 환경변수
- KEY=VALUE
- ...

## 추가 도구
- [Docker, Redis 등 부가 도구]
```

## 프레임워크별 예시

### Spring Boot
- name: Spring Boot / version: 3.5.x
- 언어: Java 17 / 빌드: Gradle Groovy
- 의존성: Spring Web, Lombok, Spring Data JPA

### Django
- name: Django / version: 5.x
- 언어: Python 3.11 / 빌드: pip
- 의존성: djangorestframework, django-cors-headers

### Next.js
- name: Next.js / version: 14.x
- 언어: TypeScript / 빌드: npm
- 의존성: tailwindcss, @shadcn/ui
