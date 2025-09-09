from django.db import models

from apps.common.models import BaseModel


class Teacher(BaseModel):
    teacher_id = models.CharField(max_length=32, unique=True, verbose_name="工号")
    name = models.CharField(max_length=64, verbose_name="姓名")
    gender = models.CharField(max_length=8, choices=[("男", "男"), ("女", "女")], verbose_name="性别", default="男")
    phone = models.CharField(max_length=20, unique=True, verbose_name="手机号")
    email = models.EmailField(blank=True, default="", verbose_name="邮箱")
    id_card = models.CharField(max_length=32, unique=True, verbose_name="身份证号")

    employment_status = models.CharField(
        max_length=16,
        choices=[("在职", "在职"), ("试用", "试用"), ("停职", "停职"), ("离职", "离职")],
        default="在职",
    )
    employment_type = models.CharField(
        max_length=16,
        choices=[("全职", "全职"), ("兼职", "兼职"), ("外聘", "外聘")],
        default="全职",
    )

    remark = models.TextField(blank=True, default="")

    class Meta:
        db_table = "teachers"
        indexes = [
            models.Index(fields=["teacher_id"]),
            models.Index(fields=["name"]),
            models.Index(fields=["phone"]),
        ]
        verbose_name = "教师"
        verbose_name_plural = "教师"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name}({self.teacher_id})"


class TeachingAssignment(BaseModel):
    # 可选关联课程，用于课程列表展示授课老师/班级
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="teaching_assignments",
        null=True,
        blank=True,
    )
    teacher = models.ForeignKey("teachers.Teacher", on_delete=models.CASCADE, related_name="assignments")
    class_ref = models.ForeignKey("schools.Class", on_delete=models.PROTECT, related_name="teaching_assignments", verbose_name="班级")
    subject = models.CharField(max_length=64, verbose_name="学科")
    duty = models.CharField(
        max_length=16,
        choices=[("任课", "任课"), ("年级主任", "年级主任"), ("教研组长", "教研组长")],
        default="任课",
        verbose_name="职务",
    )
    weekly_hours = models.PositiveIntegerField(default=0, verbose_name="周课时")
    year = models.CharField(max_length=16, blank=True, default="", verbose_name="学年")
    term = models.CharField(max_length=16, blank=True, default="", verbose_name="学期")

    class Meta:
        db_table = "teacher_assignments"
        indexes = [
            models.Index(fields=["teacher"]),
            models.Index(fields=["class_ref"]),
            models.Index(fields=["subject"]),
        ]
        verbose_name = "教师任课"
        verbose_name_plural = "教师任课"



