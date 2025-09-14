from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("students", "0002_rename_student_student_id_idx_students_student_1ff8ed_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentChange",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(null=True, blank=True, on_delete=models.SET_NULL, related_name="created_studentchange_set", to="auth.user")),
                ("updated_by", models.ForeignKey(null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_studentchange_set", to="auth.user")),
                ("deleted_at", models.DateTimeField(null=True, blank=True)),
                ("type", models.CharField(max_length=20, choices=[("transfer_out", "转出"), ("leave", "休学"), ("reinstate", "复学")])),
                ("status", models.CharField(max_length=20, default="draft", choices=[
                    ("draft", "草稿"), ("submitted", "已提交"), ("approving", "审批中"), ("approved", "已批准"), ("scheduled", "已计划"), ("effected", "已生效"), ("rejected", "已驳回"), ("cancelled", "已取消")
                ])),
                ("effective_date", models.DateTimeField(null=True, blank=True)),
                ("reason", models.TextField(blank=True, default="")),
                ("attachments", models.JSONField(default=list, blank=True)),
                ("student_snapshot", models.JSONField(default=dict, blank=True)),
                ("idempotency_key", models.CharField(max_length=64, blank=True, default="", db_index=True, unique=True)),
                ("version", models.IntegerField(default=0)),
                ("target_school_name", models.CharField(max_length=128, blank=True, default="")),
                ("target_school_contact", models.CharField(max_length=64, blank=True, default="")),
                ("release_date", models.DateField(null=True, blank=True)),
                ("handover_note", models.TextField(blank=True, default="")),
                ("leave_type", models.CharField(max_length=32, blank=True, default="")),
                ("leave_start_date", models.DateField(null=True, blank=True)),
                ("leave_end_date", models.DateField(null=True, blank=True)),
                ("reinstate_return_date", models.DateField(null=True, blank=True)),
                ("placement_policy", models.CharField(max_length=16, blank=True, default="")),
                ("target_class_id", models.UUIDField(null=True, blank=True)),
                ("student", models.ForeignKey(on_delete=models.PROTECT, related_name="changes", to="students.student")),
            ],
            options={
                "db_table": "student_changes",
                "verbose_name": "学籍异动",
                "verbose_name_plural": "学籍异动",
                "indexes": [
                    models.Index(fields=["student", "type", "status"], name="schg_student_type_status_idx"),
                    models.Index(fields=["effective_date"], name="schg_effective_date_idx"),
                ],
            },
        ),
    ]


