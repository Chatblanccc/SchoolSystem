from django.db import models

from apps.common.models import BaseModel
from apps.schools.models import Class


class Student(BaseModel):
    student_id = models.CharField(max_length=32, unique=True, verbose_name="学号")
    name = models.CharField(max_length=64, verbose_name="姓名")
    gender = models.CharField(max_length=8, choices=[("男", "男"), ("女", "女")], verbose_name="性别")
    birth_date = models.DateField(null=True, blank=True, verbose_name="出生日期")
    id_card = models.CharField(max_length=32, blank=True, default="", verbose_name="身份证号")
    phone = models.CharField(max_length=20, blank=True, default="", verbose_name="联系电话")
    email = models.EmailField(blank=True, default="", verbose_name="邮箱")
    address = models.CharField(max_length=255, blank=True, default="", verbose_name="家庭住址")

    # 学籍号
    guangzhou_student_id = models.CharField(max_length=32, blank=True, default="", verbose_name="广州市学籍号")
    national_student_id = models.CharField(max_length=32, blank=True, default="", verbose_name="全国学籍号")

    # 关联班级
    current_class = models.ForeignKey(
        Class, on_delete=models.PROTECT, related_name="students", verbose_name="当前班级"
    )

    status = models.CharField(
        max_length=16,
        choices=[("在校", "在校"), ("请假", "请假"), ("转学", "转学"), ("休学", "休学"), ("毕业", "毕业")],
        default="在校",
    )

    class Meta:
        db_table = "students"
        indexes = [
            models.Index(fields=["student_id"]),
            models.Index(fields=["name"]),
        ]
        verbose_name = "学生"
        verbose_name_plural = "学生"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name}({self.student_id})"


