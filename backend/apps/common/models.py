from django.db import models
import uuid
from django.utils import timezone


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="created_%(class)s_set"
    )
    updated_by = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_%(class)s_set"
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True



class AcademicSetting(BaseModel):
    """全局学年/学期设置（单例表，通常仅保留一条记录）。"""
    current_year = models.CharField(max_length=32, verbose_name="学年")  # 例如 2024-2025
    current_term = models.CharField(max_length=32, verbose_name="学期")  # 例如 2024-2025-1

    class Meta:
        db_table = "academic_settings"
        verbose_name = "学年学期设置"
        verbose_name_plural = "学年学期设置"
        indexes = [
            models.Index(fields=["current_year"]),
            models.Index(fields=["current_term"]),
        ]

    @staticmethod
    def get_or_create_default() -> "AcademicSetting":
        obj = AcademicSetting.objects.order_by("created_at").first()
        if obj:
            return obj
        # 依据当前日期推断默认学年与学期：8 月~次年 7 月为一个学年，上学期为 1，下学期为 2
        today = timezone.localdate()
        year = today.year
        month = today.month
        if month >= 8:
            start_year = year
            end_year = year + 1
            term_no = 1
        else:
            start_year = year - 1
            end_year = year
            term_no = 2
        current_year = f"{start_year}-{end_year}"
        current_term = f"{current_year}-{term_no}"
        obj = AcademicSetting.objects.create(current_year=current_year, current_term=current_term)
        return obj

