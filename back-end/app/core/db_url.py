"""Build PostgreSQL URL with URL-encoded credentials."""
from urllib.parse import quote_plus

import decouple


def build_database_url() -> str:
    user = decouple.config("USERNAME_DB")
    password = decouple.config("PASSWORD_DB")
    host = decouple.config("HOST_DB")
    port = decouple.config("PORT_DB", default=5432, cast=int)
    name = decouple.config("NAME_DB")
    return (
        f"postgresql://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{name}"
    )
