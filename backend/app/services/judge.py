from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.config import settings

LANGUAGE_MAP = {
    "cpp": {"language": "c++", "version": "10.2.0"},
    "python": {"language": "python", "version": "3.10.0"},
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
    lang_config = LANGUAGE_MAP.get(language)
    if not lang_config:
        raise ValueError(f"Unsupported language: {language}")

    payload = {
        "language": lang_config["language"],
        "version": lang_config["version"],
        "files": [{"name": f"solution.{'cpp' if language == 'cpp' else 'py'}", "content": code}],
        "stdin": stdin,
        "run_timeout": time_limit_ms,
        "compile_timeout": 10000,
        "run_memory_limit": memory_limit_mb * 1024 * 1024,
    }

    async with httpx.AsyncClient(base_url=settings.piston_url, timeout=30.0) as client:
        resp = await client.post("/api/v2/execute", json=payload)
        resp.raise_for_status()
        data = resp.json()

    compile_output = data.get("compile", {})
    run_output = data.get("run", {})

    if compile_output.get("stderr"):
        return ExecutionResult(
            stdout="",
            stderr=compile_output["stderr"],
            exit_code=1,
            time_ms=0,
            memory_mb=0.0,
            compile_error=compile_output["stderr"],
        )

    return ExecutionResult(
        stdout=run_output.get("stdout", "").strip(),
        stderr=run_output.get("stderr", "").strip(),
        exit_code=run_output.get("code", 0),
        time_ms=int(float(run_output.get("wall_time", 0)) * 1000) if run_output.get("wall_time") else 0,
        memory_mb=round(run_output.get("memory", 0) / (1024 * 1024), 2) if run_output.get("memory") else 0.0,
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
