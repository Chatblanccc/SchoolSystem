from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.changes.models import StudentChange
from apps.changes.serializers import StudentChangeSerializer, StudentChangeListSerializer
from apps.students.models import Student


class StudentChangeViewSet(viewsets.ModelViewSet):
    queryset = StudentChange.objects.select_related("student", "student__current_class").all()
    serializer_class = StudentChangeSerializer
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return StudentChangeListSerializer
        return StudentChangeSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        change_type = request.query_params.get("type")
        status_val = request.query_params.get("status")
        student_id = request.query_params.get("student_id")
        if change_type:
            queryset = queryset.filter(type=change_type)
        if status_val:
            queryset = queryset.filter(status=status_val)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

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

    @transaction.atomic
    def _effect_change(self, change: StudentChange):
        # 幂等：若已生效直接返回
        if change.status == StudentChange.Status.EFFECTED:
            return
        student: Student = change.student
        if change.type == StudentChange.ChangeType.TRANSFER_OUT:
            student.status = "转学"
            student.current_class_id = student.current_class_id  # 不动班级字段，视业务需要可置空
        elif change.type == StudentChange.ChangeType.LEAVE:
            student.status = "休学"
        elif change.type == StudentChange.ChangeType.REINSTATE:
            student.status = "在校"
            if change.placement_policy == "新班" and change.target_class_id:
                student.current_class_id = change.target_class_id
        student.save(update_fields=["status", "current_class_id", "updated_at"])
        change.status = StudentChange.Status.EFFECTED
        change.save(update_fields=["status", "updated_at"])

    @action(detail=True, methods=["POST"], url_path="submit")
    def submit(self, request, pk=None):
        change = self.get_object()
        if change.status != StudentChange.Status.DRAFT:
            return Response({"success": False, "error": {"code": "INVALID_STATE", "message": "仅草稿可提交"}}, status=400)
        change.status = StudentChange.Status.SUBMITTED
        change.save(update_fields=["status", "updated_at"])
        return Response({"success": True, "data": {"status": change.status}})

    @action(detail=True, methods=["POST"], url_path="approve")
    def approve(self, request, pk=None):
        change = self.get_object()
        if change.status not in [StudentChange.Status.SUBMITTED, StudentChange.Status.APPROVING]:
            return Response({"success": False, "error": {"code": "INVALID_STATE", "message": "当前状态不可审批"}}, status=400)
        # 简化：直接批准
        now = timezone.now()
        if change.effective_date and change.effective_date > now:
            change.status = StudentChange.Status.SCHEDULED
        else:
            change.status = StudentChange.Status.APPROVED
        change.save(update_fields=["status", "updated_at"])
        # 若无需等待，立即生效
        if change.status == StudentChange.Status.APPROVED:
            self._effect_change(change)
        return Response({"success": True, "data": {"status": change.status}})

    @action(detail=True, methods=["POST"], url_path="reject")
    def reject(self, request, pk=None):
        change = self.get_object()
        if change.status not in [StudentChange.Status.SUBMITTED, StudentChange.Status.APPROVING]:
            return Response({"success": False, "error": {"code": "INVALID_STATE", "message": "当前状态不可驳回"}}, status=400)
        change.status = StudentChange.Status.REJECTED
        change.save(update_fields=["status", "updated_at"])
        return Response({"success": True, "data": {"status": change.status}})

    @action(detail=True, methods=["POST"], url_path="cancel")
    def cancel(self, request, pk=None):
        change = self.get_object()
        if change.status not in [StudentChange.Status.SUBMITTED, StudentChange.Status.SCHEDULED, StudentChange.Status.APPROVED]:
            return Response({"success": False, "error": {"code": "INVALID_STATE", "message": "当前状态不可取消"}}, status=400)
        change.status = StudentChange.Status.CANCELLED
        change.save(update_fields=["status", "updated_at"])
        return Response({"success": True, "data": {"status": change.status}})

    @action(detail=True, methods=["POST"], url_path="effect")
    def effect(self, request, pk=None):
        change = self.get_object()
        if change.status not in [StudentChange.Status.APPROVED, StudentChange.Status.SCHEDULED]:
            return Response({"success": False, "error": {"code": "INVALID_STATE", "message": "未批准/计划，无法生效"}}, status=400)
        if change.effective_date and change.effective_date > timezone.now():
            return Response({"success": False, "error": {"code": "NOT_DUE", "message": "未到生效时间"}}, status=400)
        self._effect_change(change)
        return Response({"success": True, "data": {"status": change.status}})


