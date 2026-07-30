# AGENTS.md

<!-- 
# frontend/AGENTS.md

작업 절차는 루트 `AGENTS.md`. 이 파일은 이 폴더의 사실만 담는다.
 -->

## 명령어
- 빌드: `./gradlew build -x test`
- 테스트: `./gradlew test` (Maven 아님. wrapper 그대로 사용)
- 단일 테스트: `./gradlew test --tests "*UserServiceTest*"`
- 로컬 실행: `docker compose up -d` 후 `./gradlew bootRun`

## 구조
- 도메인 로직: `src/main/java/**/domain/`
- 컨트롤러: `**/api/` — DTO 변환만, 비즈니스 로직 금지
- 엔티티: `**/domain/entity/` — Lombok @Setter 사용 금지

<!-- 
## 금지
 
## 스타일
 -->
