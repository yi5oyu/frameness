import json
import os
import sys

def promote_case(target_skill, description):
    log_path = ".agents/evals/logs/latest.json"
    case_path = f".agents/evals/cases/{target_skill}.json"
    
    # 1. 방금 실행된 로그 읽기
    if not os.path.exists(log_path):
        print("❌ 승격할 최근 실행 로그(latest.json)가 존재하지 않습니다.")
        return
        
    with open(log_path, "r", encoding="utf-8") as f:
        latest_data = json.load(f)
        
    # 2. 시험지 포맷에 맞게 데이터 변환
    new_case = {
        "id": f"case-{int(os.path.getmtime(log_path))}", # 타임스탬프로 ID 생성
        "description": description,
        "input_prompt": latest_data.get("input_prompt"),
        "expected_behavior": latest_data.get("output_result") # 마음에 든 결과이므로 정답으로 지정
    }
    
    # 3. 기존 시험지 파일 로드 (없으면 새로 생성)
    cases = []
    if os.path.exists(case_path):
        with open(case_path, "r", encoding="utf-8") as f:
            try:
                cases = json.load(f)
            except json.JSONDecodeError:
                cases = []
                
    # 4. 정답지 끝에 추가 후 저장
    cases.append(new_case)
    with open(case_path, "w", encoding="utf-8") as f:
        json.dump(cases, f, indent=2, ensure_ascii=False)
        
    print(f"✅ 최근 실행 결과가 '{case_path}' 시험지에 정식 정답 케이스로 등록되었습니다!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote.py [skill_name] \"description\"")
    else:
        skill = sys.argv[1]
        desc = sys.argv[2] if len(sys.argv) > 2 else "인간 승인 기반 추가 케이스"
        promote_case(skill, desc)