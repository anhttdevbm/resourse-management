"""Define app."""
import sys
from pathlib import Path

_root = str(Path(__file__).resolve().parents[2])
if _root not in sys.path:
    sys.path.insert(0, _root)

from app import bootstrap_env  # noqa: F401 — load .env before other imports

import decouple
from fastapi.openapi.utils import get_openapi
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.src.controllers.auth_controller import auth_routers
from app.src.controllers.user_controller import users_routers
from app.src.controllers.resource_tag_controller import resource_tags_routers
from app.src.controllers.resource_stage_controller import resource_stages_routers
from app.src.controllers.resource_controller import resource_routers
from app.src.controllers.resourse_status_controlller import resource_statuss_routers
from app.src.controllers.produce_type_controller import produce_types_routers
from app.src.controllers.package_repository_controller import package_repositories_routers
from app.src.controllers.resource_platform_controller import resource_forms_routers
from app.src.controllers.system_info_controller import system_info_routers
from app.src.controllers.statistics_controller import statistics_routers
from app.src.controllers.notification_controller import notification_router
from app.src.controllers.auto_classification_rule_controller import auto_classification_routers
from app.src.exceptions.exception import BusinessException
from app.src.exceptions.exception_handler import business_exception_handler

app = FastAPI()
app.add_middleware(
    SessionMiddleware,
    secret_key="truongtuananh1212004@123",  
)
ALLOWED_ORIGINS = [
    o.strip()
    for o in decouple.config("CORS_ORIGINS", default="http://localhost:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def custom_openapi():
    """Define custon openapi."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Resource Management",
        version=app.version,
        openapi_version=app.openapi_version,
        terms_of_service=app.terms_of_service,
        contact=app.contact,
        license_info=app.license_info,
        routes=app.routes,
        tags=app.openapi_tags,
        servers=app.servers,
    )
    for _, method_item in openapi_schema.get('paths').items():
        for _, param in method_item.items():
            responses = param.get('responses')
            if '422' in responses:
                del responses['422']
    openapi_schema["info"]["x-logo"] = {
        "url": "https://rabiloo.weekly.vn/images/hrm_logo.png",
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
app.exception_handler(BusinessException)(business_exception_handler)
PREFIX = "/resource-management"
app.include_router(auth_routers, tags=["Authentication"], prefix='/api/auth')
app.include_router(users_routers, tags=["User"], prefix=PREFIX)
app.include_router(resource_tags_routers, tags=["Resource Tag"], prefix=PREFIX)
app.include_router(resource_stages_routers, tags=["Resource Stage"], prefix=PREFIX)
app.include_router(resource_routers, tags=["Resource"], prefix=PREFIX)
app.include_router(produce_types_routers, tags=["Produce Type"], prefix=PREFIX)
app.include_router(resource_statuss_routers, tags=["Resource Status"], prefix=PREFIX)
app.include_router(package_repositories_routers, tags=["Package Repository"], prefix=PREFIX)
app.include_router(resource_forms_routers, tags=["Resource Platform"], prefix=PREFIX)
app.include_router(system_info_routers, tags=["System Info"], prefix=PREFIX)
app.include_router(statistics_routers, tags=["Statistics"], prefix=PREFIX)
app.include_router(notification_router, tags=["Notification"], prefix=PREFIX)
app.include_router(auto_classification_routers, tags=["Auto Classification"], prefix=PREFIX)