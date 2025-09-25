from django.db import models

from apps.common.models import BaseModel
from apps.students.models import Student
from apps.courses.models import Course


class Exam(BaseModel):
    code = models.CharField(max_length=64, unique=True, verbose_name="考试编码")
    name = models.CharField(max_length=128, verbose_name="考试名称")
    term = models.CharField(max_length=32, verbose_name="学期")
    grade = models.ForeignKey("schools.Grade", on_delete=models.PROTECT, related_name="exams", verbose_name="年级")
    exam_date = models.DateField(null=True, blank=True, verbose_name="考试日期")
    remark = models.CharField(max_length=255, blank=True, default="", verbose_name="备注")

    class Meta:
        db_table = "exams"
        indexes = [
            models.Index(fields=["term"]),
            models.Index(fields=["name"]),
        ]
        verbose_name = "考试"
        verbose_name_plural = "考试"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name}({self.term})"


class Score(BaseModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="scores", verbose_name="考试")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="scores", verbose_name="学生")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="scores", verbose_name="课程")
    class_ref = models.ForeignKey("schools.Class", on_delete=models.PROTECT, related_name="scores", verbose_name="班级")

    # 分数维度
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="总分")
    full_score = models.DecimalField(max_digits=6, decimal_places=2, default=100, verbose_name="满分")
    rank_in_class = models.PositiveIntegerField(null=True, blank=True, verbose_name="班内排名")
    rank_in_grade = models.PositiveIntegerField(null=True, blank=True, verbose_name="年级排名")
    passed = models.BooleanField(default=False, verbose_name="是否及格")

    # 冗余名称字段，便于导出/查询
    student_name = models.CharField(max_length=64, verbose_name="学生姓名")
    class_name = models.CharField(max_length=64, verbose_name="班级名称")
    course_name = models.CharField(max_length=128, verbose_name="课程名称")

    class Meta:
        db_table = "scores"
        indexes = [
            models.Index(fields=["exam", "class_ref"]),
            models.Index(fields=["student"]),
            models.Index(fields=["course"]),
        ]
        unique_together = ("exam", "student", "course")
        verbose_name = "成绩"
        verbose_name_plural = "成绩"


