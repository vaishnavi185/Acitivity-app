from fastapi import APIRouter
from routes.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)
from routes.categories import router as categories_router

api_router.include_router(categories_router)
from routes.activities import router as activities_router

api_router.include_router(activities_router)
from routes.users import router as users_router

api_router.include_router(users_router)
from routes.dashboard import router as dashboard_router

api_router.include_router(dashboard_router)

from routes.buddy import router as buddy_router
api_router.include_router(buddy_router)