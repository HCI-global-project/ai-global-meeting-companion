"""브라우저가 Soniox 에 직접 스트리밍할 수 있게 짧게 사는 임시 키를 발급한다. 원래 키는 서버에만 둔다."""

import httpx

URL = "https://api.soniox.com/v1/auth/temporary-api-key"
# 웹소켓 연결은 키 만료 전에 열기만 하면 이후로도 유지된다.
EXPIRES_IN_SECONDS = 60


class SonioxError(Exception):
    pass


class SonioxClient:
    def __init__(self, http: httpx.AsyncClient, api_key: str | None):
        self._http = http
        self._api_key = api_key

    @property
    def configured(self) -> bool:
        return bool(self._api_key)

    async def issue_temporary_key(self) -> str:
        if not self._api_key:
            raise SonioxError("SONIOX_API_KEY 가 설정되지 않았습니다.")
        res = await self._http.post(
            URL,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"usage_type": "transcribe_websocket", "expires_in_seconds": EXPIRES_IN_SECONDS},
            timeout=10,
        )
        payload = res.json() if res.content else {}
        if res.status_code >= 300 or "api_key" not in payload:
            raise SonioxError(f"Soniox {res.status_code}: {payload.get('message', 'unknown')}")
        return payload["api_key"]
