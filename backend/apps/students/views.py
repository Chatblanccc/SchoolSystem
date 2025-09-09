from django.db.models import Q
from django.http import HttpResponse
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend

from apps.students.models import Student
from apps.students.serializers import StudentListSerializer, StudentDetailSerializer
from apps.students.filters import StudentFilter


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related("current_class", "current_class__grade").all()
    serializer_class = StudentDetailSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "student_id", "phone"]
    filterset_class = StudentFilter
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return StudentListSerializer
        return StudentDetailSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # 兼容前端过渡期参数：grade（名称模糊）、className（名称匹配）
        grade_name = request.query_params.get("grade")
        if grade_name:
            queryset = queryset.filter(current_class__grade__name__icontains=grade_name)
        class_name = request.query_params.get("className")
        if class_name:
            queryset = queryset.filter(current_class__name=class_name)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": {"results": serializer.data}})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"success": True, "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return Response({"success": True, "data": None})

    @action(detail=False, methods=["POST"], url_path="import", parser_classes=[MultiPartParser])
    def import_students(self, request):
        # 支持 CSV（UTF-8/GBK 回退），中文/英文表头混用
        # 推荐中文表头：学号,姓名,性别,班级,状态,身份证号,市学籍号,国学籍号,出生日期,家庭住址
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"success": False, "error": {"code": "INVALID_FILE", "message": "未上传文件"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        content = None
        for encoding in ["utf-8-sig", "utf-8", "gbk", "gb18030", "cp936"]:
            try:
                content = file.read().decode(encoding)
                break
            except Exception:
                file.seek(0)
        if content is None:
            return Response(
                {
                    "success": False,
                    "error": {"code": "INVALID_FILE", "message": "文件解码失败，应为UTF-8/GBK"},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        import csv
        from io import StringIO
        from django.db import transaction
        from datetime import date
        from apps.schools.models import Class, Grade

        reader = csv.DictReader(StringIO(content))
        created_count = 0
        updated_count = 0

        def pick(d: dict, keys: list[str]) -> str:
            for k in keys:
                v = d.get(k)
                if isinstance(v, str) and v.strip():
                    return v.strip()
            return ""

        with transaction.atomic():
            for row in reader:
                if not row:
                    continue
                student_id = pick(row, ["student_id", "学号"]) or ""
                name = pick(row, ["name", "姓名"]) or ""
                class_name = pick(row, ["class", "class_name", "班级"]) or ""
                gender = pick(row, ["gender", "性别"]) or "男"
                status_val = pick(row, ["status", "状态"]) or "在校"

                id_card = pick(row, ["id_card", "身份证号"]) or ""
                gz_id = pick(row, ["guangzhou_student_id", "市学籍号"]) or ""
                national_id = pick(row, ["national_student_id", "国学籍号"]) or ""
                birth_date_str = pick(row, ["birth_date", "出生日期"]) or ""
                address = pick(row, ["address", "家庭住址", "homeAddress", "home_address"]) or ""

                if not student_id or not name or not class_name:
                    continue

                # 解析出生日期
                birth_d = None
                if birth_date_str:
                    try:
                        birth_d = date.fromisoformat(birth_date_str)
                    except Exception:
                        birth_d = None

                # 班级
                grade, _ = Grade.objects.get_or_create(name="未分级")
                current_class, _ = Class.objects.get_or_create(
                    name=class_name, defaults={"code": class_name, "grade": grade}
                )

                obj, created = Student.objects.update_or_create(
                    student_id=student_id,
                    defaults={
                        "name": name,
                        "gender": gender,
                        "current_class": current_class,
                        "status": status_val,
                        "id_card": id_card,
                        "guangzhou_student_id": gz_id,
                        "national_student_id": national_id,
                        "birth_date": birth_d,
                        "address": address,
                    },
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
        return Response({"success": True, "data": {"created": created_count, "updated": updated_count}})

    @action(detail=False, methods=["GET"], url_path="export")
    def export_students(self, request):
        # 中文表头导出，增加证件与学籍号等字段
        qs = self.filter_queryset(self.get_queryset())
        import csv, io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "学号",
            "姓名",
            "性别",
            "班级",
            "状态",
            "身份证号",
            "市学籍号",
            "国学籍号",
            "出生日期",
            "家庭住址",
            "创建时间",
            "更新时间",
        ])
        for s in qs[:10000]:
            writer.writerow([
                s.student_id,
                s.name,
                s.gender,
                s.current_class.name if s.current_class_id else "",
                s.status,
                s.id_card or "",
                s.guangzhou_student_id or "",
                s.national_student_id or "",
                s.birth_date.isoformat() if s.birth_date else "",
                s.address or "",
                s.created_at.isoformat(),
                s.updated_at.isoformat(),
            ])
        content = output.getvalue()
        resp = HttpResponse(content, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="学生导出.csv"'
        return resp

    @action(detail=False, methods=["POST"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return Response(
                {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "ids 必须为非空数组"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Student.objects.filter(id__in=ids).delete()
        return Response({"success": True, "data": {"deleted": len(ids)}})

    @action(detail=False, methods=["POST"], url_path="bulk-update-status")
    def bulk_update_status(self, request):
        ids = request.data.get("ids", [])
        status_value = request.data.get("status")
        if not status_value:
            return Response(
                {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "status 必填"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = Student.objects.all()
        if ids and isinstance(ids, list):
            qs = qs.filter(id__in=ids)
        updated = qs.update(status=status_value)
        return Response({"success": True, "data": {"updated": updated}})


