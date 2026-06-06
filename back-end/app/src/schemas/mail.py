from typing import List
from pydantic import BaseModel, EmailStr

class MailBody(BaseModel):
    subject: str
    body: str
    to: List[EmailStr]