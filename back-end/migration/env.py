import os
from logging.config import fileConfig

import decouple
from alembic import context
from sqlalchemy import engine_from_config
from sqlalchemy import pool

# Load .env from migration/ or from parent (back-end/) so one .env is enough
_env_path = ".env"
if not os.path.isfile(_env_path):
    _env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
decouple.config = decouple.Config(decouple.RepositoryEnv(_env_path))

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the configs file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

# add your models's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = None


# other values from the configs, defined by the needs of env.py,
# can be acquired:
# my_important_option = configs.get_main_option("my_important_option")
# ... etc.


def get_url():
    import sys
    from pathlib import Path

    _root = str(Path(__file__).resolve().parent.parent)
    if _root not in sys.path:
        sys.path.insert(0, _root)

    from app.core.db_url import build_database_url

    url = build_database_url()
    print(
        f"postgresql://{decouple.config('USERNAME_DB')}:****@"
        f"{decouple.config('HOST_DB')}:{decouple.config('PORT_DB')}/"
        f"{decouple.config('NAME_DB')}"
    )
    return url


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
