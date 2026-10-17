import asyncio
import json
import httpx
import pytest
from app import vision

@pytest.mark.parametrize('task', ['dishes','ingredients','cooking','laundry'])
@pytest.mark.parametrize('mode', ['timeout', 'refusal', 'incomplete', 'invalid', 'no_evidence', 'valid'])
def test_provider_results_fail_closed(monkeypatch, mode, task):
    monkeypatch.setenv('OPENAI_API_KEY', 'test-not-a-secret')
    monkeypatch.setenv('OPENAI_VISION_MODEL', 'test-model')
    analysis = vision.Analysis(status='likely_done', reason='皿の汚れが減りました', observed_changes=['皿の汚れが減少'], washing_evidence=[] if mode == 'no_evidence' else ['汚れが消えた'], alternative_explanations=[], uncertainties=[])
    class Client:
        def __init__(self, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def post(self, url, **kwargs):
            payload = kwargs['json']
            assert payload['store'] is False
            assert vision.PROMPTS[task][0] in payload['input'][0]['content'][0]['text']
            assert vision.PROMPTS[task][2] in payload['instructions']
            assert payload['text']['format']['strict'] is True
            assert len(payload['input'][0]['content']) == 3
            if mode == 'timeout': raise httpx.ReadTimeout('timeout')
            body = {'status': 'incomplete' if mode == 'incomplete' else 'completed', 'output': [{'content': [{'type': 'refusal' if mode == 'refusal' else 'output_text', 'text': 'invalid' if mode == 'invalid' else analysis.model_dump_json()}]}]}
            return httpx.Response(200, json=body, request=httpx.Request('POST', url))
    monkeypatch.setattr(vision.httpx, 'AsyncClient', Client)
    result = asyncio.run(vision.analyze(b'before', b'after', task))
    assert result.status == ('likely_done' if mode == 'valid' else 'uncertain')
