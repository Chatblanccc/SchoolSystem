from django.db import models

from apps.common.models import BaseModel


class Grade(BaseModel):
    name = models.CharField(max_length=32, unique=True)

    class Meta:
        db_table = "grades"
        verbose_name = "年级"
        verbose_name_plural = "年级"

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Class(BaseModel):
    code = models.CharField(max_length=32, unique=True, verbose_name="班级编码")
    name = models.CharField(max_length=64, verbose_name="班级名称")
    grade = models.ForeignKey(Grade, on_delete=models.PROTECT, related_name="classes", verbose_name="年级")
    # 新增正式外键，兼容保留 head_teacher_name 以向后兼容前端
    head_teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_classes",
        verbose_name="班主任",
    )
    head_teacher_name = models.CharField(max_length=64, null=True, blank=True, verbose_name="班主任名称")
    capacity = models.PositiveIntegerField(default=50, verbose_name="容量")
    status = models.CharField(
        max_length=16,
        choices=[("在读", "在读"), ("已结班", "已结班"), ("归档", "归档")],
        default="在读",
    )
    remark = models.TextField(blank=True, default="")

    class Meta:
        db_table = "classes"
        indexes = [models.Index(fields=["code"]), models.Index(fields=["name"])]
        verbose_name = "班级"
        verbose_name_plural = "班级"

    def __str__(self) -> str:  # pragma: no cover
        return self.name


