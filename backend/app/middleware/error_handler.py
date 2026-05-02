from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.schemas.common import ApiResponse


class PrepForgeException(Exception):
    def __init__(self, message: str, error_code: str, status_code: int):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


class ResourceNotFoundException(PrepForgeException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, "NOT_FOUND", 404)


class UnauthorizedException(PrepForgeException):
    def __init__(self):
        super().__init__("Unauthorized", "UNAUTHORIZED", 401)


class ForbiddenException(PrepForgeException):
    def __init__(self):
        super().__init__("Forbidden", "FORBIDDEN", 403)


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(PrepForgeException)
    async def prepforge_handler(req: Request, exc: PrepForgeException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiResponse.error(
                exc.message, exc.error_code
            ).model_dump(mode="json"),
        )

    @app.exception_handler(Exception)
    async def generic_handler(req: Request, exc: Exception):
        import logging
        logging.error("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=ApiResponse.error(
                "An unexpected error occurred", "INTERNAL_ERROR"
            ).model_dump(mode="json"),
        )
