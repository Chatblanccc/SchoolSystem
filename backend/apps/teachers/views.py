from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse

from .models import Teacher
from .serializers import TeacherListSerializer, TeacherDetailSerializer
from .filters import TeacherFilter


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().order_by("-created_at")
    serializer_class = TeacherDetailSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "teacher_id", "phone"]
    filterset_class = TeacherFilter
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return TeacherListSerializer
        return TeacherDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        self.queryset = (
            Teacher.objects.all()
            .prefetch_related("assignments__class_ref__head_teacher")
            .prefetch_related("assignments__course")
        )
        return super().retrieve(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"success": True, "data": serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"success": True, "data": serializer.data})

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"success": True, "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return Response({
            "success": True,
            "data": None,
            "message": "删除成功",
            "timestamp": timezone.now().isoformat(),
        })

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser])
    def import_teachers(self, request):
        file_obj = request.FILES.get("file")
        created = 0
        updated = 0

        if file_obj is None:
            # 支持直接传 JSON 数组 { items: [...] }
            items = request.data.get("items") or []
            if not isinstance(items, list):
                return Response({
                    "success": False,
                    "error": {"code": "VALIDATION_ERROR", "message": "缺少文件或 items", "details": {"file": ["请上传CSV文件或提供items数组"]}},
                    "timestamp": timezone.now().isoformat(),
                }, status=400)

            for row in items:
                teacher_id = row.get("teacher_id") or row.get("teacherId")
                name = row.get("name")
                if not teacher_id or not name:
                    continue
                defaults = {
                    "name": name,
                    "gender": row.get("gender") or "男",
                    "phone": row.get("phone") or "",
                    "email": row.get("email") or "",
                    "id_card": row.get("id_card") or row.get("idCard") or "",
                    "employment_status": row.get("employment_status") or row.get("employmentStatus") or "在职",
                    "employment_type": row.get("employment_type") or row.get("employmentType") or "全职",
                    "remark": row.get("remark") or "",
                }
                obj, is_created = Teacher.objects.update_or_create(
                    teacher_id=teacher_id,
                    defaults=defaults,
                )
                created += 1 if is_created else 0
                updated += 0 if is_created else 1

            return Response({
                "success": True,
                "data": {"created": created, "updated": updated},
                "message": "导入完成",
                "timestamp": timezone.now().isoformat(),
            })

        # CSV 解析，自动编码回退，支持中文表头
        import csv, io

        raw = file_obj.read()
        text_str = None
        for enc in ("utf-8-sig", "utf-8", "gbk", "gb18030", "cp936"):
            try:
                text_str = raw.decode(enc)
                break
            except Exception:
                continue
        if text_str is None:  # pragma: no cover
            return Response({
                "success": False,
                "error": {"code": "INVALID_FILE", "message": "文件解码失败，建议使用 UTF-8 或 GBK 保存"},
                "timestamp": timezone.now().isoformat(),
            }, status=400)

        reader = csv.DictReader(io.StringIO(text_str))

        def first_val(row, keys, default=""):
            for k in keys:
                v = row.get(k)
                if v is not None and str(v).strip() != "":
                    return str(v).strip()
            return default

        for row in reader:
            teacher_id = first_val(row, ["teacher_id", "工号"]) 
            name = first_val(row, ["name", "姓名"]) 
            if not teacher_id or not name:
                continue
            gender = first_val(row, ["gender", "性别"], "男")
            phone = first_val(row, ["phone", "手机号", "电话"], "")
            email = first_val(row, ["email", "邮箱"], "")
            id_card = first_val(row, ["id_card", "身份证", "身份证号"], "")
            employment_status = first_val(row, ["employment_status", "在职状态"], "在职")
            employment_type = first_val(row, ["employment_type", "用工类型"], "全职")
            remark = first_val(row, ["remark", "备注"], "")

            obj, is_created = Teacher.objects.update_or_create(
                teacher_id=teacher_id,
                defaults={
                    "name": name,
                    "gender": gender,
                    "phone": phone,
                    "email": email,
                    "id_card": id_card,
                    "employment_status": employment_status,
                    "employment_type": employment_type,
                    "remark": remark,
                },
            )
            created += 1 if is_created else 0
            updated += 0 if is_created else 1

        return Response({
            "success": True,
            "data": {"created": created, "updated": updated},
            "message": "导入完成",
            "timestamp": timezone.now().isoformat(),
        })

    @action(detail=False, methods=["get"], url_path="export")
    def export_teachers(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        import csv, io
        output = io.StringIO()
        writer = csv.writer(output)
        # 中文表头
        writer.writerow([
            "ID",
            "工号",
            "姓名",
            "性别",
            "手机号",
            "邮箱",
            "身份证号",
            "用工类型",
            "在职状态",
            "备注",
            "创建时间",
            "更新时间",
        ])
        for t in queryset:
            writer.writerow([
                str(t.id),
                t.teacher_id,
                t.name,
                t.gender,
                t.phone,
                t.email or "",
                t.id_card or "",
                t.employment_type,
                t.employment_status,
                t.remark or "",
                t.created_at.isoformat(),
                t.updated_at.isoformat(),
            ])
        content = output.getvalue()
        response = HttpResponse(content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="教师导出.csv"'
        return response

    @action(detail=False, methods=["post"], url_path="bulk-update-status")
    def bulk_update_status(self, request):
        status_value = request.data.get("employment_status") or request.data.get("status")
        if status_value not in {"在职", "试用", "停职", "离职"}:
            return Response({
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "无效的在职状态"},
                "timestamp": timezone.now().isoformat(),
            }, status=400)
        ids = request.data.get("ids")
        if ids:
            qs = Teacher.objects.filter(id__in=ids)
        else:
            qs = self.filter_queryset(self.get_queryset())
        updated_count = qs.update(employment_status=status_value)
        return Response({
            "success": True,
            "data": {"updated": updated_count},
            "message": "批量更新完成",
            "timestamp": timezone.now().isoformat(),
        })


