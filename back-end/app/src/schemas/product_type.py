"""Define product type schema file."""
from pydantic import BaseModel

class ProductTypeCreate(BaseModel):
    """Define  input schema to create product type."""
    name: str


class ProductTypeUpdate(ProductTypeCreate):
    """Define Permission input schema to update product type."""