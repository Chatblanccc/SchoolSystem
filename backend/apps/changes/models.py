from django.db import models

from apps.common.models import BaseModel
from apps.students.models import Student


class StudentChange(BaseModel):
    class ChangeType(models.TextChoices):
        TRANSFER_OUT = "transfer_out", "转出"
        LEAVE = "leave", "休学"
        REINSTATE = "reinstate", "复学"

    class Status(models.TextChoices):
        DRAFT = "draft", "草稿"
        SUBMITTED = "submitted", "已提交"
        APPROVING = "approving", "审批中"
        APPROVED = "approved", "已批准"
        SCHEDULED = "scheduled", "已计划"
        EFFECTED = "effected", "已生效"
        REJECTED = "rejected", "已驳回"
        CANCELLED = "cancelled", "已取消"

    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="changes")
    type = models.CharField(max_length=20, choices=ChangeType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    effective_date = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True, default="")
    attachments = models.JSONField(default=list, blank=True)
    student_snapshot = models.JSONField(default=dict, blank=True)
    idempotency_key = models.CharField(max_length=64, null=True, blank=True, default=None, db_index=True, unique=True)
    version = models.IntegerField(default=0)

    # 关联细节
    # 为简化：直接放本表可空字段，后续可拆分子表
    # 转出
    target_school_name = models.CharField(max_length=128, blank=True, default="")
    target_school_contact = models.CharField(max_length=64, blank=True, default="")
    release_date = models.DateField(null=True, blank=True)
    handover_note = models.TextField(blank=True, default="")
    # 休学
    leave_type = models.CharField(max_length=32, blank=True, default="")
    leave_start_date = models.DateField(null=True, blank=True)
    leave_end_date = models.DateField(null=True, blank=True)
    # 复学
    reinstate_return_date = models.DateField(null=True, blank=True)
    placement_policy = models.CharField(max_length=16, blank=True, default="")  # 原班|新班
    target_class_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "student_changes"
        indexes = [
            models.Index(fields=["student", "type", "status"], name="schg_student_type_status_idx"),
            models.Index(fields=["effective_date"], name="schg_effective_date_idx"),
        ]
        verbose_name = "学籍异动"
        verbose_name_plural = "学籍异动"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.student.student_id} {self.get_type_display()} {self.get_status_display()}"


