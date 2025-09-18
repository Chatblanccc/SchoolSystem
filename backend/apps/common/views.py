from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import update_session_auth_hash


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == "PATCH":
        updated_fields = set()

        if "name" in request.data:
            name = (request.data.get("name") or "").strip()
            user.first_name = name
            user.last_name = ""
            updated_fields.update({"first_name", "last_name"})
        else:
            if "first_name" in request.data:
                first_name = (request.data.get("first_name") or "").strip()
                user.first_name = first_name
                updated_fields.add("first_name")
            if "last_name" in request.data:
                last_name = (request.data.get("last_name") or "").strip()
                user.last_name = last_name
                updated_fields.add("last_name")

        if "email" in request.data:
            email = (request.data.get("email") or "").strip()
            user.email = email
            updated_fields.add("email")

        if updated_fields:
            user.save(update_fields=list(updated_fields))

    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "name": user.get_full_name() or user.username,
        "is_staff": bool(getattr(user, "is_staff", False)),
        "is_superuser": bool(getattr(user, "is_superuser", False)),
    }
    return Response(
        {
            "success": True,
            "data": data,
            "message": "操作成功",
            "timestamp": now().isoformat(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")
    if not old_password or not new_password:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "数据验证失败",
                    "details": {"password": ["old_password 和 new_password 均为必填"]},
                },
                "timestamp": now().isoformat(),
            },
            status=400,
        )
    if not user.check_password(old_password):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "原密码不正确",
                    "details": {"old_password": ["原密码不正确"]},
                },
                "timestamp": now().isoformat(),
            },
            status=400,
        )
    try:
        validate_password(new_password, user)
    except ValidationError as exc:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "密码不符合安全要求",
                    "details": {"new_password": list(exc.messages)},
                },
                "timestamp": now().isoformat(),
            },
            status=400,
        )

    user.set_password(new_password)
    user.save(update_fields=["password"])
    update_session_auth_hash(request, user)
    return Response(
        {
            "success": True,
            "data": {"updated": True},
            "message": "密码修改成功",
            "timestamp": now().isoformat(),
        }
    )
