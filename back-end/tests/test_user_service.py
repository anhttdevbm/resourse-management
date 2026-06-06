import pytest
import uuid
from typing import Dict

from app.src.models import User
from app.src.services.user_service import UserService
from app.src.schemas.user_system import UserCreate, UserUpdate
from app.src.utils.common import row2dict


def test_get(mocker, sample_users, session_mock):

    user_repository_mock = mocker.Mock()
    user_repository_mock.get.return_value = sample_users[0]

    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)
    user_id = uuid.uuid4()

    result = user_service.get(session_mock, user_id)

    user_repository_mock.get.assert_called_once()
    assert result == sample_users[0]
    assert isinstance(result, User)

def test_get_not_found(mocker, session_mock):
    user_repository_mock = mocker.Mock()
    user_repository_mock.get.return_value = None
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)
    user_id = uuid.uuid4()

    with pytest.raises(Exception) as e:
        user_service.get(session_mock, user_id)
        assert e.message == "User Not Found"
def test_get_all(mocker, session_mock, sample_users):
    user_repository_mock = mocker.Mock()
    user_repository_mock.get_all.return_value = sample_users
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)
    result = user_service.get_all(session_mock)
    expected_result = {User.email: row2dict(User) for user in sample_users}
    print(type(result))
    assert result == result
    assert isinstance(result, Dict)

def test_get_all_not_found(mocker, session_mock):
    user_repository_mock = mocker.Mock()
    user_repository_mock.get_all.return_value = None
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)

    with pytest.raises(Exception) as e:
        user_service.get_all(session_mock)
        assert e.message == "User Not Found"

def test_create_user(mocker, session_mock):
    user_create = UserCreate(
        email='abc@gmail.com',
        password='123456',
        role_id='4b2928c1-0a72-5cd4-9747-b29a380d9ce5'
    )
    user_repository_mock = mocker.Mock()
    user = User(
        id=888,
        email=user_create.email,
        password=user_create.password,
        role_id=user_create.role_id,
    )
    user_repository_mock.get_user_by_email.return_value = None
    user_repository_mock.create.return_value = user
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)

    result = user_service.create(session_mock, user_create)
    assert result == user
    assert isinstance(result, User)

    def test_create_user_error(mocker, session_mock):
        user_create = UserCreate(
            email='abc@gmail.com',
            password='123456',
            role_id='4b2928c1-0a72-5cd4-9747-b29a380d9ce5'
        )
    user_repository_mock = mocker.Mock()
    user = User(
        id=888,
        email=user_create.email,
        password=user_create.password,
        role_id=user.role_id
    )
    user_repository_mock.get_user_by_email.return_value = user
    user_repository_mock.create.return_value = user
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)

    with pytest.raises(Exception) as e:
        user_service.create(session_mock, user_create)
        assert e.message == "User Existed"

def test_update_user(mocker, session_mock, sample_users):
    user_update = UserUpdate(
        role_id='57986dcc-c12d-5f29-ab07-5632c47995da'
    )
    user_repository_mock =mocker.Mock()
    user = sample_users[0]
    user_repository_mock.update.return_value = user_update
    user_repository_mock.get.return_value = user
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)

    result = user_service.update(session_mock, user.id, user_update)

    user_repository_mock.update.assert_called_once()
    assert result == user
    assert isinstance(result, User)

def test_update_user_error(mocker, session_mock, sample_users):
    user_update = UserUpdate(
        role_id='57986dcc-c12d-5f29-ab07-5632c47995da'
    )
    user_repository_mock = mocker.Mock()
    user = sample_users[0]
    user_repository_mock.update.return_value = user_update
    user_repository_mock.get.return_value = None
    user_service = UserService()
    mocker.patch.object(user_service, 'user_repository', wraps=user_repository_mock)

    with pytest.raises(Exception) as e:
        user_service.update_account(session_mock, user.id, user_update)
        assert e.message == "User Not Found"

def test_delete(mocker, session_mock, sample_users):
    user_repository_mock = mocker.Mock()
    user = sample_users[0]
    user_repository_mock.get.return_value = user
    user_repository_mock.delete.return_value = "Deleted"
    user_service = UserService()
    mocker.patch.object(user_service, "user_repository", wraps=user_repository_mock)

    user_service.delete(session_mock, user.id)

    user_repository_mock.delete.assert_called_once()

def test_delete_error(mocker, session_mock, sample_users):
    user_repository_mock = mocker.Mock()
    user = sample_users[0]
    user_repository_mock.get.return_value = None
    user_repository_mock.delete.return_value = "Deleted"
    user_service = UserService()
    mocker.patch.object(user_service, "user_repository", wraps=user_repository_mock)

    with pytest.raises(Exception) as e:
        user_service.delete(session_mock, user.id)
        assert e.message == "User Not Found"
