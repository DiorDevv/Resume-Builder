import pytest
from httpx import AsyncClient
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_access_token,
    decode_refresh_token,
    decode_reset_token,
    decode_token,
    validate_password_strength,
    hash_password,
    verify_password,
)
from jose import JWTError


class TestPasswordValidation:
    def test_strong_password(self):
        valid, msg = validate_password_strength("StrongPass1")
        assert valid
        assert msg == ""

    def test_short_password(self):
        valid, msg = validate_password_strength("Ab1")
        assert not valid

    def test_no_uppercase(self):
        valid, _ = validate_password_strength("abcdefgh1")
        assert not valid

    def test_no_digit(self):
        valid, _ = validate_password_strength("Abcdefghi")
        assert not valid

    def test_message_does_not_leak_policy(self):
        _, msg = validate_password_strength("short")
        assert "8" not in msg
        assert "katta harf" not in msg
        assert "raqam" not in msg


class TestPasswordHashing:
    def test_hash_and_verify(self):
        pw = "TestPass123"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed)

    def test_wrong_password(self):
        hashed = hash_password("CorrectPass1")
        assert not verify_password("WrongPass1", hashed)


class TestTokenKeys:
    def test_access_token_different_key(self):
        token = create_access_token("user-1")
        payload = decode_access_token(token)
        assert payload["sub"] == "user-1"
        assert payload["type"] == "access"

    def test_refresh_token_different_key(self):
        token = create_refresh_token("user-1")
        payload = decode_refresh_token(token)
        assert payload["sub"] == "user-1"
        assert payload["type"] == "refresh"

    def test_reset_token_different_key(self):
        token = create_reset_token("user-1")
        payload = decode_reset_token(token)
        assert payload["sub"] == "user-1"
        assert payload["type"] == "reset"

    def test_wrong_key_type_rejected(self):
        access = create_access_token("user-1")
        with pytest.raises(JWTError):
            decode_refresh_token(access)

    def test_decode_token_any_key(self):
        access = create_access_token("user-1")
        payload = decode_token(access)
        assert payload["type"] == "access"


class TestUUIDValidation:
    async def test_invalid_resume_uuid(self, client: AsyncClient, auth_cookies: dict):
        response = await client.get(
            "/api/v1/resumes/not-a-uuid",
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 422

    async def test_invalid_section_uuid(self, client: AsyncClient, auth_cookies: dict):
        response = await client.delete(
            "/api/v1/resumes/00000000-0000-0000-0000-000000000000/sections/not-a-uuid",
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 422


class TestSectionValidation:
    async def test_create_section_validates_data(self, client: AsyncClient, auth_cookies: dict):
        create = await client.post(
            "/api/v1/resumes",
            json={"title": "Validation Test"},
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        rid = create.json()["id"]

        response = await client.post(
            f"/api/v1/resumes/{rid}/sections",
            json={"section_type": "personal_info", "data": {"full_name": "Ali"}},
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 201
        assert response.json()["data"]["full_name"] == "Ali"
