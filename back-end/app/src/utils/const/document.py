from os.path import join
from typing import Any, Dict

from app.src.utils.file.dictionary_loader import JsonDictionaryLoader
from app.src.utils.path import ROOT_PATH

RESPONSES: Dict[str, Dict[str, Any]] = JsonDictionaryLoader().load(join(ROOT_PATH, "resources/responses.json"))


def get_response(field: str) -> Dict[str, Any]:
    # Using RESPONSE.get(field) for ignore error when start application,
    # But should using RESPONSE[field] for fix document error as soon as
    return RESPONSES[field]


def generate_doc_response(*, example: Dict[str, Any], model: Any) -> Dict[str, Any]:
    """doc."""
    return {
        "model": model,
        "content": {"application/json": {"example": example}},
    }
