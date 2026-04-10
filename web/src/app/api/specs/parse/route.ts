import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `당신은 개발 교육용 환경 세팅 분석기입니다.
강사가 작성한 수업 계획서, 강의 자료, 또는 환경 설정 안내문을 읽고,
학생 컴퓨터에 설치해야 할 모든 도구와 환경을 추출합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "title": "명세 제목 (수업명 기반)",
  "summary": "한줄 요약 (예: Spring Boot 3.2 + Java 17 + Gradle 웹 개발 환경)",
  "tools": [
    {
      "name": "도구명",
      "version": "버전 (없으면 null)",
      "category": "ide|language|framework|package|system|database|tool",
      "install_command": "설치 명령어 (추천, 없으면 null)"
    }
  ],
  "verification_commands": ["빌드/검증 명령어들"],
  "framework_hint": "주요 프레임워크명 (UI 표시용)"
}

카테고리 기준:
- ide: VS Code, IntelliJ, Android Studio 등
- language: Java, Python, Node.js, Go 등
- framework: Spring Boot, Django, React, Next.js 등
- package: npm 패키지, pip 패키지, maven 의존성 등
- system: brew, git, docker 등 시스템 도구
- database: MySQL, PostgreSQL, Redis 등
- tool: Gradle, Maven, webpack 등 빌드/개발 도구

문서에 명시적으로 언급되지 않더라도, 해당 프레임워크에 반드시 필요한 도구는 포함하세요.
예: Spring Boot → Java + Gradle/Maven 필수 포함`;

export async function POST(request: NextRequest) {
  const { raw_text } = await request.json();

  if (!raw_text || typeof raw_text !== "string") {
    return NextResponse.json({ error: "raw_text is required" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `아래 수업 계획서/환경 안내문을 분석해서 설치 계획을 JSON으로 추출해주세요.\n\n---\n${raw_text}\n---`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 추출 (코드블록 감싸져 있을 수 있음)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 응답에서 JSON을 추출할 수 없습니다" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      title: parsed.title,
      summary: parsed.summary,
      framework: parsed.framework_hint ?? parsed.tools?.find((t: { category: string }) => t.category === "framework")?.name ?? "Custom",
      spec_content: {
        summary: parsed.summary,
        tools: parsed.tools,
        verification_commands: parsed.verification_commands,
        raw_input: raw_text,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
