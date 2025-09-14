from django.db import models
from apps.common.models import BaseModel


class Course(BaseModel):
    code = models.CharField(max_length=64, verbose_name="课程学段")
    name = models.CharField(max_length=128, verbose_name="课程名称")
    category = models.CharField(max_length=16, choices=[("必修", "必修"), ("选修", "选修")], default="必修")
    weekly_hours = models.PositiveIntegerField(default=1, verbose_name="周课时")
    description = models.TextField(blank=True, default="", verbose_name="课程简介")
    status = models.CharField(max_length=8, choices=[("启用", "启用"), ("停用", "停用")], default="启用")

    # teaching_assignments: 由 teachers.TeachingAssignment 反向关联，用于展示授课老师与班级

    class Meta:
        db_table = "courses"
        indexes = [models.Index(fields=["code"]), models.Index(fields=["name"])]
        verbose_name = "课程"
        verbose_name_plural = "课程"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name}({self.code})"


