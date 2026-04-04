from __future__ import annotations

from app.services.problem import parse_sample_cases


SAMPLE_HTML = """
<p>Given an array of integers <code>nums</code>&nbsp;and an integer <code>target</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>
<strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
</pre>
<p><strong>Example 2:</strong></p>
<pre>
<strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]
</pre>
"""


def test_parse_sample_cases():
    cases = parse_sample_cases(SAMPLE_HTML)
    assert len(cases) == 2
    assert cases[0]["input"] == "nums = [2,7,11,15], target = 9"
    assert cases[0]["expected_output"] == "[0,1]"
    assert cases[0]["is_sample"] is True
    assert cases[1]["input"] == "nums = [3,2,4], target = 6"
    assert cases[1]["expected_output"] == "[1,2]"


def test_parse_empty_description():
    cases = parse_sample_cases("")
    assert cases == []


def test_parse_no_examples():
    cases = parse_sample_cases("<p>Some problem with no examples</p>")
    assert cases == []
