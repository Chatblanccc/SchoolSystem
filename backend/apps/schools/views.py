from django.db.models import Count, Value, IntegerField
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.response import Response

from django.http import HttpResponse
from .filters import ClassFilter
from .models import Class, Grade
from .serializers import ClassListSerializer, ClassDetailSerializer


class ClassViewSet(viewsets.ModelViewSet):
    # 学生模块接入后，使用 Count("students") 获取人数
    queryset = (
        Class.objects.all()
        .select_related("grade")
        .annotate(student_count=Count("students"))
    )
    serializer_class = ClassDetailSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "code", "head_teacher_name"]
    filterset_class = ClassFilter
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ClassListSerializer
        return ClassDetailSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        # 兼容前端传入 grade 字符串（年级名）
        if isinstance(data.get('grade'), str) and data.get('grade'):
            data['grade_name_input'] = data.get('grade')
            data.pop('grade')
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"success": True, "data": serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if isinstance(data.get('grade'), str) and data.get('grade'):
            data['grade_name_input'] = data.get('grade')
            data.pop('grade')
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"success": True, "data": serializer.data})

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data.copy()
        if isinstance(data.get('grade'), str) and data.get('grade'):
            data['grade_name_input'] = data.get('grade')
            data.pop('grade')
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"success": True, "data": serializer.data})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser])
    def import_classes(self, request):
        file_obj = request.FILES.get("file")
        records = []
        created = 0
        updated = 0

        if file_obj is None:
            # 支持直接传 JSON 数组 { items: [...] }
            items = request.data.get("items") or []
            if not isinstance(items, list):
                return Response({
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "缺少文件或 items",
                        "details": {"file": ["请上传CSV文件或提供items数组"]},
                    },
                    "timestamp": timezone.now().isoformat(),
                }, status=400)
            for row in items:
                code = row.get("code")
                name = row.get("name")
                grade_name = row.get("grade") or row.get("grade_name")
                head_teacher_name = row.get("head_teacher_name") or row.get("headTeacherName")
                capacity = row.get("capacity") or 50
                status_value = row.get("status") or "在读"
                remark = row.get("remark") or ""
                if not code or not name:
                    continue
                grade = None
                if grade_name:
                    grade, _ = Grade.objects.get_or_create(name=grade_name)
                obj, is_created = Class.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": name,
                        "grade": grade or Grade.objects.get_or_create(name="一年级")[0],
                        "head_teacher_name": head_teacher_name,
                        "capacity": capacity,
                        "status": status_value,
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
            code = first_val(row, ["code", "编码"]) 
            name = first_val(row, ["name", "名称"]) 
            grade_name = first_val(row, ["grade", "grade_name", "年级"]) 
            head_teacher_name = first_val(row, ["head_teacher_name", "headTeacherName", "班主任", "班主任名称"]) 
            capacity_str = first_val(row, ["capacity", "容量"], "50")
            try:
                capacity = int(capacity_str)
            except Exception:
                capacity = 50
            status_value = first_val(row, ["status", "状态"], "在读")
            remark = first_val(row, ["remark", "备注"], "")
            if not code or not name:
                continue
            grade = None
            if grade_name:
                grade, _ = Grade.objects.get_or_create(name=grade_name)
            obj, is_created = Class.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "grade": grade or Grade.objects.get_or_create(name="一年级")[0],
                    "head_teacher_name": head_teacher_name or None,
                    "capacity": capacity,
                    "status": status_value,
                    "remark": remark,
                },
            )
            created += 1 if is_created else 0
            updated += 0 if is_created else 1
            records.append(obj.id)

        return Response({
            "success": True,
            "data": {"created": created, "updated": updated, "ids": records},
            "message": "导入完成",
            "timestamp": timezone.now().isoformat(),
        })

    @action(detail=True, methods=["post"], url_path="assign-teacher")
    def assign_teacher(self, request, pk=None):
        """分配/更换班主任（支持 teacher_id 或 teacher_name）"""
        instance = self.get_object()
        teacher_id = request.data.get("teacher_id")
        teacher_name = request.data.get("teacher_name") or request.data.get("teacherName")
        from apps.teachers.models import Teacher

        teacher = None
        if teacher_id:
            try:
                teacher = Teacher.objects.get(id=teacher_id)
            except Teacher.DoesNotExist:
                return Response({
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "教师不存在"},
                    "timestamp": timezone.now().isoformat(),
                }, status=404)
        elif teacher_name:
            teacher, _ = Teacher.objects.get_or_create(name=teacher_name, defaults={
                "teacher_id": f"T{int(timezone.now().timestamp())}",
                "gender": "男",
                "phone": f"1{int(timezone.now().timestamp())%10}000000000",
                "id_card": f"{int(timezone.now().timestamp())}X",
            })
        else:
            # 允许清空
            instance.head_teacher = None
            instance.head_teacher_name = None
            instance.save(update_fields=["head_teacher", "head_teacher_name", "updated_at"])
            serializer = self.get_serializer(instance)
            return Response({"success": True, "data": serializer.data})

        instance.head_teacher = teacher
        instance.head_teacher_name = teacher.name
        instance.save(update_fields=["head_teacher", "head_teacher_name", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response({"success": True, "data": serializer.data})

    @action(detail=False, methods=["get"], url_path="export")
    def export_classes(self, request):
        # 使用筛选后的数据导出
        queryset = self.filter_queryset(self.get_queryset())
        import csv, io
        output = io.StringIO()
        writer = csv.writer(output)
        # 中文表头
        writer.writerow([
            "ID",
            "编码",
            "名称",
            "年级",
            "班主任",
            "容量",
            "学生人数",
            "状态",
            "备注",
            "创建时间",
            "更新时间",
        ])
        for c in queryset:
            writer.writerow([
                str(c.id),
                c.code,
                c.name,
                c.grade.name if c.grade else "",
                c.head_teacher_name or "",
                c.capacity,
                getattr(c, "student_count", 0),
                c.status,
                c.remark or "",
                c.created_at.isoformat(),
                c.updated_at.isoformat(),
            ])
        content = output.getvalue()
        # 为兼容 Excel，可选择在开头添加 BOM："\ufeff" + content
        response = HttpResponse(content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="班级导出.csv"'
        return response

    @action(detail=False, methods=["post"], url_path="bulk-update-status")
    def bulk_update_status(self, request):
        status_value = request.data.get("status")
        ids = request.data.get("ids")
        if status_value not in {"在读", "已结班", "归档"}:
            return Response({
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "无效的状态"},
                "timestamp": timezone.now().isoformat(),
            }, status=400)
        if ids:
            qs = Class.objects.filter(id__in=ids)
        else:
            qs = self.filter_queryset(self.get_queryset())
        updated_count = qs.update(status=status_value)
        return Response({
            "success": True,
            "data": {"updated": updated_count},
            "message": "批量更新完成",
            "timestamp": timezone.now().isoformat(),
        })


