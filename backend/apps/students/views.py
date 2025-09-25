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
    queryset = (
        Student.objects.select_related("current_class", "current_class__grade")
        .filter(deleted_at__isnull=True)
        .all()
    )
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

        # 默认不显示已转出的学生，除非明确指定 include_transferred=true
        if not request.query_params.get("include_transferred"):
            queryset = queryset.exclude(status="转学")

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
        instance = self.get_object()
        force = str(request.query_params.get("force", "")).lower() in {"1", "true", "yes"}
        if force:
            # 硬删除：先清理可能的保护性外键（如 StudentChange），再物理删除
            from django.db import transaction
            from apps.changes.models import StudentChange
            with transaction.atomic():
                StudentChange.objects.filter(student=instance).delete()
                instance.delete()
            return Response({"success": True, "data": None})
        else:
            # 软删除：打标 deleted_at，避免外键约束报错
            from django.utils import timezone
            instance.deleted_at = timezone.now()
            instance.save(update_fields=["deleted_at"])
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
        error_rows = []

        def pick(d: dict, keys: list[str]) -> str:
            for k in keys:
                v = d.get(k)
                if isinstance(v, str) and v.strip():
                    return v.strip()
            return ""

        with transaction.atomic():
            for idx, row in enumerate(reader, start=2):  # 数据行自第2行起
                try:
                    if not row:
                        continue
                    student_id = pick(row, ["student_id", "学号"]) or ""
                    name = pick(row, ["name", "姓名"]) or ""
                    class_code = pick(row, ["class_code", "班级编码", "code"]) or ""
                    class_name = pick(row, ["class", "class_name", "班级"]) or ""
                    grade_name = pick(row, ["grade", "grade_name", "年级"]) or ""
                    gender = pick(row, ["gender", "性别"]) or "男"
                    status_val = pick(row, ["status", "状态"]) or "在校"

                    id_card = pick(row, ["id_card", "身份证号"]) or ""
                    gz_id = pick(row, ["guangzhou_student_id", "市学籍号"]) or ""
                    national_id = pick(row, ["national_student_id", "国学籍号"]) or ""
                    birth_date_str = pick(row, ["birth_date", "出生日期"]) or ""
                    address = pick(row, ["address", "家庭住址", "homeAddress", "home_address"]) or ""

                    if not student_id or not name or not class_name:
                        error_rows.append({"row": idx, "message": "学号/姓名/班级不能为空"})
                        continue

                    gender = gender.strip()
                    if gender not in {"男", "女"}:
                        gender = "男"

                    birth_d = None
                    if birth_date_str:
                        try:
                            birth_d = date.fromisoformat(birth_date_str)
                        except Exception:
                            error_rows.append({"row": idx, "message": f"出生日期格式无效: {birth_date_str}"})
                            birth_d = None

                    # 允许存在同名班级：优先按编码匹配，其次按年级+名称
                    class_qs = Class.objects.all()
                    if class_code:
                        class_qs = class_qs.filter(code=class_code)
                    else:
                        class_qs = class_qs.filter(name=class_name)
                        if grade_name:
                            class_qs = class_qs.filter(grade__name=grade_name)

                    current_class = class_qs.order_by("created_at").first()

                    if current_class is None:
                        # 若未找到，按年级名创建，默认归入“未分级”
                        if grade_name:
                            grade, _ = Grade.objects.get_or_create(name=grade_name)
                        else:
                            grade, _ = Grade.objects.get_or_create(name="未分级")

                        if class_code:
                            current_class, _ = Class.objects.get_or_create(
                                code=class_code,
                                defaults={
                                    "name": class_name or class_code,
                                    "grade": grade,
                                },
                            )
                        else:
                            current_class, _ = Class.objects.get_or_create(
                                name=class_name,
                                grade=grade,
                                defaults={"code": class_name or grade.name},
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
                            "deleted_at": None,
                        },
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                except Exception as exc:
                    error_rows.append({"row": idx, "message": str(exc)})

        if error_rows:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "IMPORT_ERROR",
                        "message": "部分数据导入失败",
                        "details": error_rows,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"success": True, "data": {"created": created_count, "updated": updated_count}})

    @action(detail=False, methods=["GET"], url_path="export")
    def export_students(self, request):
        # 中文表头导出，增加证件与学籍号等字段
        qs = self.filter_queryset(self.get_queryset())
        
        # 默认不导出已转出的学生，除非明确指定
        if not request.query_params.get("include_transferred"):
            qs = qs.exclude(status="转学")
        import csv, io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "学号",
            "姓名",
            "性别",
            "班级",
            "班级编码",
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
                s.current_class.code if s.current_class_id else "",
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
        force = bool(request.data.get("force")) or str(request.data.get("force", "")).lower() in {"1", "true", "yes"}
        if not isinstance(ids, list) or not ids:
            return Response(
                {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "ids 必须为非空数组"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if force:
            from django.db import transaction
            from apps.changes.models import StudentChange
            with transaction.atomic():
                StudentChange.objects.filter(student_id__in=ids).delete()
                deleted_tuple = Student.objects.filter(id__in=ids).delete()
                # deleted_tuple: (num_deleted, { 'app.Model': count, ...})
                return Response({"success": True, "data": {"deleted": deleted_tuple[0]}})
        else:
            from django.utils import timezone
            updated = Student.objects.filter(id__in=ids, deleted_at__isnull=True).update(deleted_at=timezone.now())
            return Response({"success": True, "data": {"deleted": updated}})

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


