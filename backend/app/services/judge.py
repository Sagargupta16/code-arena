from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.config import settings

JUDGE0_URL = "https://ce.judge0.com"

LANGUAGE_MAP = {
    "cpp": 54,      # C++ GCC 9.2.0
    "python": 100,   # Python 3.12.5
}


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    exit_code: int
    time_ms: int
    memory_mb: float
    compile_error: str = ""


async def execute_code(
    code: str,
    language: str,
    stdin: str = "",
    time_limit_ms: int = 5000,
    memory_limit_mb: int = 256,
) -> ExecutionResult:
    language_id = LANGUAGE_MAP.get(language)
    if not language_id:
        raise ValueError(f"Unsupported language: {language}")

    payload = {
        "source_code": code,
        "language_id": language_id,
        "stdin": stdin,
        "cpu_time_limit": min(time_limit_ms / 1000, 15),
        "memory_limit": memory_limit_mb * 1024,
    }

    judge0_url = settings.judge0_url if hasattr(settings, "judge0_url") else JUDGE0_URL

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{judge0_url}/submissions?base64_encoded=false&wait=true",
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    status_id = data.get("status", {}).get("id", 0)
    time_sec = float(data.get("time") or 0)
    memory_kb = int(data.get("memory") or 0)

    if status_id == 6:  # Compilation Error
        return ExecutionResult(
            stdout="",
            stderr=data.get("compile_output", ""),
            exit_code=1,
            time_ms=0,
            memory_mb=0.0,
            compile_error=data.get("compile_output", ""),
        )

    if status_id >= 7:  # Runtime errors (SIGSEGV, etc.)
        return ExecutionResult(
            stdout=data.get("stdout") or "",
            stderr=data.get("stderr") or data.get("message") or "",
            exit_code=1,
            time_ms=int(time_sec * 1000),
            memory_mb=round(memory_kb / 1024, 2),
        )

    if status_id == 5:  # Time Limit Exceeded
        return ExecutionResult(
            stdout="",
            stderr="Time Limit Exceeded",
            exit_code=0,
            time_ms=time_limit_ms + 1,
            memory_mb=round(memory_kb / 1024, 2),
        )

    return ExecutionResult(
        stdout=(data.get("stdout") or "").strip(),
        stderr=(data.get("stderr") or "").strip(),
        exit_code=int(data.get("exit_code") or 0),
        time_ms=int(time_sec * 1000),
        memory_mb=round(memory_kb / 1024, 2),
    )


async def judge_submission(
    code: str,
    language: str,
    test_cases: list[dict],
    time_limit_ms: int = 5000,
    memory_limit_mb: int = 256,
) -> dict:
    passed = 0
    total = len(test_cases)
    last_result = None

    for tc in test_cases:
        result = await execute_code(
            code=code,
            language=language,
            stdin=tc["input"],
            time_limit_ms=time_limit_ms,
            memory_limit_mb=memory_limit_mb,
        )
        last_result = result

        if result.compile_error:
            return {
                "result": "compile_error",
                "test_cases_passed": 0,
                "total_test_cases": total,
                "execution_time_ms": 0,
                "memory_used_mb": 0.0,
                "error": result.compile_error,
            }

        if result.exit_code != 0:
            return {
                "result": "runtime_error",
                "test_cases_passed": passed,
                "total_test_cases": total,
                "execution_time_ms": result.time_ms,
                "memory_used_mb": result.memory_mb,
                "error": result.stderr,
            }

        if result.time_ms > time_limit_ms:
            return {
                "result": "time_limit",
                "test_cases_passed": passed,
                "total_test_cases": total,
                "execution_time_ms": result.time_ms,
                "memory_used_mb": result.memory_mb,
            }

        if result.stdout.strip() == tc["expected_output"].strip():
            passed += 1
        else:
            return {
                "result": "wrong_answer",
                "test_cases_passed": passed,
                "total_test_cases": total,
                "execution_time_ms": result.time_ms,
                "memory_used_mb": result.memory_mb,
                "expected": tc["expected_output"],
                "got": result.stdout,
            }

    return {
        "result": "accepted",
        "test_cases_passed": passed,
        "total_test_cases": total,
        "execution_time_ms": last_result.time_ms if last_result else 0,
        "memory_used_mb": last_result.memory_mb if last_result else 0.0,
    }
