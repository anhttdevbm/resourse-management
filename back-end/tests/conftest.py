import os
from sqlalchemy.orm import Session
from datetime import datetime
import decouple
import pytest
import requests_mock
from app.src.models import BlacklistToken, User ,Resource


print(os.getcwd())
decouple.config = decouple.Config(decouple.RepositoryEnv(".env"))

@pytest.fixture
def current_user_mock(mocker):
    return mocker.Mock(User)

@pytest.fixture
def mock_api():
    with requests_mock.Mocker() as m:
        yield m

@pytest.fixture
def session_mock(mocker):
    """Mock session"""
    return mocker.Mock(Session)

@pytest.fixture
def base_url():
    return "http://0.0.0.0:30111/be/v1.0"

# @pytest.fixture
# def sample_workers():
#     a = Worker(name='Phong', id=1, using_sshkey=False, account={'ip_address': '192.168.1.1', 'username': 'abc', 'password': 'xyz'}, is_deleted=False)
#     b = Worker(name='P', id=2, using_sshkey=True, account={'ip_address': '0.0.0.0', 'username': '123', 'password': '456'}, is_deleted=False)
#     workers = [a, b]
#     return workers

@pytest.fixture
def sample_black_token():
    black_token = BlacklistToken(id=1, token="ajklshfaklwhfe1214")
    return black_token

@pytest.fixture
def sample_resources():
    a = Resource(name='TTA1', id=1, version=1, stage_id=1, status_id=1, platform_id=1, product_type_id=1, repo_id=1,
                 tag_id=1, user_id="1", created_at="2024-01-26 08:21:41.381014",
                 key="static/images/3_Screenshot from 2024-01-25 18-12-11.png", is_deleted=False)
    b = Resource(name='B', id=2, version=1, stage_id=1, status_id=1, platform_id=1, product_type_id=1, repo_id=1,
                 tag_id=1, user_id="1", created_at="2024-01-26 08:21:41.381014",
                 key="static/images/3_Screenshot from 2024-01-25 18-12-11.png", is_deleted=False)
    resources = [a, b]
    return resources

@pytest.fixture
def sample_users():
    a = User(email='abc@gmail.com', password='123456', id=1, updated_at="2024-01-26 08:21:41.381014", role_id='1', is_deleted=False)
    b = User(email='abcd@gmail.com', password='123456', id=2, updated_at="2024-01-26 08:21:41.381014", role_id='1', is_deleted=False)
    resources = [a, b]
    return resources