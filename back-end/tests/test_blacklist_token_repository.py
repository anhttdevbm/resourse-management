"""Test blacklist repository"""
import pytest
import re

from sqlalchemy.exc import SQLAlchemyError

from app.src.models import BlacklistToken
from app.src.repositories.blacklist_token import BlackListTokenRepository

def test_is_black_token_false(mocker, session_mock, sample_black_token):
    blacklist_repository = BlackListTokenRepository(BlacklistToken)
    black_token = sample_black_token
    query_mock = mocker.patch.object(session_mock, 'query')
    query_mock.return_value.filter.return_value.first.return_value = None

    with pytest.raises(Exception) as e:
        blacklist_repository.is_black_token(session_mock, black_token)
    assert str(e.value) == "code='SERVER0101' message='Database Error' data=None"

def test_is_black_token_true(mocker, session_mock, sample_black_token):
    blacklist_repository = BlackListTokenRepository(BlacklistToken)
    black_token = sample_black_token
    query_mock = mocker.patch.object(session_mock, 'query')
    query_mock.return_value.filter.return_value.first.return_value = black_token
    result = blacklist_repository.is_black_token(session_mock, black_token.token)
    assert result is True
