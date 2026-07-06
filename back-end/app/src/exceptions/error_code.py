"""doc."""
from enum import Enum

from starlette import status

from app.src.schemas.response import ExceptionDetail

from .exception import BusinessException


class BEErrorCode(Enum):
    """doc."""

    WRONG_TIME_FORMAT = BusinessException(ExceptionDetail(message="Invalid Time Format", code="BE0001"))
    APP_NOT_FOUND = BusinessException(ExceptionDetail(message="App Not Found", code="BE0002"))
    BUDGET_NOT_FOUND = BusinessException(ExceptionDetail(message="Budget Not Found", code="BE0003"))
    CONTENT_NOT_FOUND = BusinessException(ExceptionDetail(message="Content Not Found", code="BE0004"))
    RESULT_NOT_FOUND = BusinessException(ExceptionDetail(message="Result Not Found", code="BE0005"))
    TOKEN_NOT_FOUND = BusinessException(ExceptionDetail(message="Token Not Found", code="BE0006"))
    CONFIG_NOT_FOUND = BusinessException(ExceptionDetail(message="Config Not Found", code="BE0009"))
    CONFIG_EXISTED = BusinessException(ExceptionDetail(message="Config Existed", code="BE0010"))
    FORCE_NOT_FOUND = BusinessException(ExceptionDetail(message="Force Not Found", code="BE0011"))
    STORY_NOT_FOUND = BusinessException(ExceptionDetail(message="Story Not Found", code="BE0012"))
    USER_NOT_PERMISSION = BusinessException(ExceptionDetail(message="User Not Permission", code="BE0013"))
    USER_NOT_FOUND = BusinessException(ExceptionDetail(message="User Not Found", code="BE0014"))
    TAG_NOT_FOUND = BusinessException(ExceptionDetail(message="Tag Not Found", code="BE0015"))
    ROLE_NOT_FOUND = BusinessException(ExceptionDetail(message="Role Not Found", code="BE0016"))
    ROLE_EXITED = BusinessException(ExceptionDetail(message="Role Exited", code="BE0017"))
    GAME_EXITED = BusinessException(ExceptionDetail(message="Game Exited", code="BE0018"))
    GAME_NOT_FOUND = BusinessException(ExceptionDetail(message="Game Not Found", code="BE0019"))
    COMMENT_NOT_FOUND = BusinessException(ExceptionDetail(message="Comment Not Found", code="BE0020"))
    DONATE_NOT_FOUND = BusinessException(ExceptionDetail(message="Donate Not Found", code="BE0021"))
    NOT_ENOUGH_MONEY = BusinessException(ExceptionDetail(message="Not enough money", code="BE0022"))
    EVALUATE_NOT_FOUND = BusinessException(ExceptionDetail(message="Evaluate Not Found", code="BE0023"))
    INVALID_SCORE = BusinessException(ExceptionDetail(message="Invalid Score", code="BE0024"))
    RENTAL_APPLICATION_NOT_FOUND = BusinessException(ExceptionDetail(message="Rental Application Not Found", code="BE0025"))
    FOLLOWER_NOT_FOUND = BusinessException(ExceptionDetail(message="Follower Not Found", code="BE0026"))
    FOLLOWER_EXITED = BusinessException(ExceptionDetail(message="Follower Exited", code="BE0027"))
    TRANSACTION_NOT_FOUND = BusinessException(ExceptionDetail(message="Transaction Not Found", code="BE0028"))
    RESOURCE_TAG_NOT_FOUND =  BusinessException(ExceptionDetail(message="Resource Tag Not Found", code="BE0029"))
    RESOURCE_TAG_EXITED =  BusinessException(ExceptionDetail(message="Resource Tag Exit", code="BE0030"))
    RESOURCE_STAGE_NOT_FOUND =  BusinessException(ExceptionDetail(message="Resource Stage Not Found", code="BE0032"))
    RESOURCE_STAGE_EXITED =  BusinessException(ExceptionDetail(message="Resource STage Exit", code="BE0030"))
    RESOURCE_STATUS_NOT_FOUND =  BusinessException(ExceptionDetail(message="Resource Status Not Found", code="BE0034"))
    RESOURCE_STATUS_EXITED =  BusinessException(ExceptionDetail(message="Resource Status Exit", code="BE0035"))
    PRODUCE_TYPE_EXITED =  BusinessException(ExceptionDetail(message="Produce Type Exit", code="BE0036"))
    PRODUCE_NOT_FOUND =  BusinessException(ExceptionDetail(message="Produce Not Found", code="BE0037"))
    PACKAGE_REPOSITORY_NOT_FOUND =  BusinessException(ExceptionDetail(message="Package Repository Not Found", code="BE0037"))
    PACKAGE_REPOSITORY_EXITED =  BusinessException(ExceptionDetail(message="Package Repository Exited", code="BE0038"))
    RESOURCE_PLATFORM_NOT_FOUND =  BusinessException(ExceptionDetail(message="Resource Platform Not Found", code="BE0039"))
    NOTIFICATION_NOT_FOUND = BusinessException(ExceptionDetail(message="Notification Not Found", code="BE0040"))
    NOTIFICATION_FORBIDDEN = BusinessException(ExceptionDetail(message="Notification Forbidden", code="BE0041"))
    AUTO_CLASSIFICATION_RULE_NOT_FOUND = BusinessException(
        ExceptionDetail(message="Auto classification rule not found", code="BE0042")
    )
    AUTO_CLASSIFICATION_REORDER_INVALID = BusinessException(
        ExceptionDetail(message="Invalid auto classification rule order", code="BE0043")
    )
    PERMISSION_NOT_FOUND = BusinessException(
        ExceptionDetail(message="Permission Not Found", code="BE0044")
    )
    PERMISSION_EXITED = BusinessException(
        ExceptionDetail(message="Permission Already Exists", code="BE0045")
    )
    PERMISSION_IN_USE = BusinessException(
        ExceptionDetail(message="Permission is assigned to users", code="BE0046")
    )
    RESOURCE_NOT_FOUND = BusinessException(
        ExceptionDetail(message="Resource Not Found", code="BE0047")
    )
    RESOURCE_NAME_EXISTED = BusinessException(
        ExceptionDetail(message="Resource name already exists", code="BE0048")
    )

class ServerErrorCode(Enum):
    """doc."""

    SERVER_ERROR = BusinessException(ExceptionDetail(message="INTERNAL SERVER ERROR", code="SERVER0100"),
                                     status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    DATABASE_ERROR = BusinessException(ExceptionDetail(message="Database Error", code="SERVER0101"),
                                       status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    FILE_STORAGE_ERROR = BusinessException(ExceptionDetail(message="FILE STORAGE ERROR", code="SERVER0102"),
                                           status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AuthErrorCode(Enum):
    """doc."""

    USERNAME_NOT_FOUND = BusinessException(ExceptionDetail(message="User Not Found", code="AUTH0001"))
    INCORRECT_PASSWORD = BusinessException(ExceptionDetail(message="Incorrect Password", code="AUTH0002"))
    EMAIL_NOT_CONFIRM = BusinessException(ExceptionDetail(message="User Not Confirmed", code="AUTH0003"))
    INVALID_ACCESS_TOKEN = BusinessException(ExceptionDetail(message="Invalid Access Token", code="AUTH0004"))
    BLACKLIST_TOKEN = BusinessException(ExceptionDetail(message="Blacklisted Token", code="AUTH0005"))
    EXPIRED_ACCESS_TOKEN = BusinessException(ExceptionDetail(message="Expired Access Token", code="AUTH0006"))
    PERMISSION_DENIED = BusinessException(ExceptionDetail(message="Permission Denied", code="AUTH0007"))
    USER_EXISTED = BusinessException(ExceptionDetail(message="Email already registered", code="AUTH0008"))
    INVALID_ENCRYPTION_KEY = BusinessException(ExceptionDetail(message="Invalid Public Key", code="AUTH0009"))
    INVALID_SIGNATURE = BusinessException(ExceptionDetail(message="Invalid Signature", code="AUTH0010"))
    TOKEN_NOT_FOUND = BusinessException(ExceptionDetail(message="Token Not Found", code="AUTH0011"))
    INCORRECT_SECRET_KEY = BusinessException(ExceptionDetail(message="Incorrect Key", code="AUTH0012"))
    INVALID_REFRESH_TOKEN = BusinessException(ExceptionDetail(message="Invalid Refresh Access Token", code="AUTH0013"))
    EXPIRED_REFRESH_TOKEN = BusinessException(ExceptionDetail(message="Expired Refresh Token", code="AUTH0014"))
    INVALID_TOKEN = BusinessException(ExceptionDetail(message="Invalid Token", code="AUTH0015"))
    EMAIL_EXISTED = BusinessException(ExceptionDetail(message="Email already registered", code="AUTH0016"))
    ACCOUNT_LOCKED = BusinessException(ExceptionDetail(message="Account is locked", code="AUTH0017"))

