from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.judge import ExecutionResult, execute_code, judge_submission


@pytest.fixture
def mock_judge0_success():
    return {
        "status": {"id": 3, "description": "Accepted"},
        "stdout": "hello\n",
        "stderr": None,
        "compile_output": None,
        "exit_code": 0,
        "time": "0.015",
        "memory": 5120,
    }


@pytest.fixture
def mock_judge0_compile_error():
    return {
        "status": {"id": 6, "description": "Compilation Error"},
        "stdout": None,
        "stderr": None,
        "compile_output": "error: expected ';' before '}' token",
        "exit_code": None,
        "time": None,
        "memory": None,
    }


@pytest.mark.asyncio
async def test_execute_code_success(mock_judge0_success):
    mock_response = MagicMock()
    mock_response.json.return_value = mock_judge0_success
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.judge.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.post.return_value = mock_response
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        result = await execute_code('print("hello")', "python")
        assert result.stdout == "hello"
        assert result.exit_code == 0


@pytest.mark.asyncio
async def test_execute_code_compile_error(mock_judge0_compile_error):
    mock_response = MagicMock()
    mock_response.json.return_value = mock_judge0_compile_error
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.judge.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.post.return_value = mock_response
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        result = await execute_code("bad code {", "cpp")
        assert result.compile_error != ""
        assert result.exit_code == 1


def test_unsupported_language():
    with pytest.raises(ValueError, match="Unsupported language"):
        import asyncio
        asyncio.run(execute_code("code", "java"))
