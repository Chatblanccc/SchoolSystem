from django.utils import timezone
from rest_framework.views import exception_handler


def byss_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
    response.data = {
        "success": False,
        "error": {
            "code": getattr(exc, "default_code", "error"),
            "message": getattr(exc, "detail", str(exc)),
            "details": getattr(exc, "detail", None),
        },
        "timestamp": timezone.now().isoformat(),
    }
    return response


