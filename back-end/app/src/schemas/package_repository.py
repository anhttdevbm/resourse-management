"""Define package repository schema file."""
from pydantic import BaseModel

class PackageRepositoryCreate(BaseModel):
    """Define  input schema to create package repository."""
    name: str


class PackageRepositoryUpdate(PackageRepositoryCreate):
    """Define Permission input schema to update package repository."""