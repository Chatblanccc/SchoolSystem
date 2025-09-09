from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Student",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(null=True, blank=True)),
                ("student_id", models.CharField(max_length=32, unique=True, verbose_name="学号")),
                ("name", models.CharField(max_length=64, verbose_name="姓名")),
                ("gender", models.CharField(max_length=8, choices=[("男", "男"), ("女", "女")], verbose_name="性别")),
                ("birth_date", models.DateField(null=True, blank=True, verbose_name="出生日期")),
                ("id_card", models.CharField(max_length=32, blank=True, default="", verbose_name="身份证号")),
                ("phone", models.CharField(max_length=20, blank=True, default="", verbose_name="联系电话")),
                ("email", models.EmailField(blank=True, default="", max_length=254, verbose_name="邮箱")),
                ("address", models.CharField(max_length=255, blank=True, default="", verbose_name="家庭住址")),
                ("guangzhou_student_id", models.CharField(max_length=32, blank=True, default="", verbose_name="广州市学籍号")),
                ("national_student_id", models.CharField(max_length=32, blank=True, default="", verbose_name="全国学籍号")),
                (
                    "current_class",
                    models.ForeignKey(on_delete=models.PROTECT, related_name="students", to="schools.class", verbose_name="当前班级"),
                ),
                (
                    "status",
                    models.CharField(
                        max_length=16,
                        choices=[("在校", "在校"), ("请假", "请假"), ("转学", "转学"), ("休学", "休学"), ("毕业", "毕业")],
                        default="在校",
                    ),
                ),
            ],
            options={
                "db_table": "students",
                "verbose_name": "学生",
                "verbose_name_plural": "学生",
            },
        ),
        migrations.AddIndex(model_name="student", index=models.Index(fields=["student_id"], name="student_student_id_idx")),
        migrations.AddIndex(model_name="student", index=models.Index(fields=["name"], name="student_name_idx")),
    ]


