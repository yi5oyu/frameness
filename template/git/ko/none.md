2. **승인** — 계획 경로·파일·기준을 제시하고 대기한다. **대기 중 도구 호출 금지.**
   승인되면 파일·기준 사본을 `## Approval`에 남기고 Status를 `[Approved]`로 바꾼다.
3. **구현** — 승인된 파일만, 기준에 필요한 만큼만 고친다. ep는 한 번에 하나씩
   진행한다. 첫 소스 변경 직전에 `docs/plans/` 밖에 커밋 안 된 변경이 있으면
   멈추고 사람에게 보인다 — 유지·폐기는 사람이 정한다. 그다음 지금 브랜치를
   `**Branch:**`에 적고 Status를 `[In Progress]`로 바꾸고, 변경 즉시
   `## Change Log` 1줄.
4. **검증** — `## Approval`의 기준을 하나씩 확인해 `## Acceptance Criteria`에
   체크하고, 통과·실패와 커밋 메시지 안을 함께 제시한다. 사람 승인 — 또는 리뷰
   요청: Status를 `[In Review]`로 바꾸고 새 세션의 `review`를 기다린다.
   `APPROVED`면 다시 제시해 승인받고, `NEEDS_REVISION`이면 `[In Progress]`로
   되돌려 같은 ep에서 고치고 다시 검증한다.
5. **완료** — 리뷰했다면 `## Review`의 마지막 판정이 `APPROVED`일 때만. Status를
   `[Done]`으로 바꾸고 `done/`으로 옮긴 뒤, Change Log에 오른 파일과 이 ep 파일만
   경로를 지정해 커밋 (제목 한 줄 + 푸터 `ep: {slug}`).
