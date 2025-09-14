from django.db import models
from apps.common.models import BaseModel


class Room(BaseModel):
    name = models.CharField(max_length=64, unique=True)

    class Meta:
        db_table = 'rooms'
        verbose_name = '教室'
        verbose_name_plural = '教室'

    def __str__(self):  # pragma: no cover
        return self.name


class Lesson(BaseModel):
    term = models.CharField(max_length=16)
    day_of_week = models.PositiveSmallIntegerField()  # 1-7
    start_time = models.CharField(max_length=5, null=True, blank=True)  # HH:mm
    end_time = models.CharField(max_length=5, null=True, blank=True)
    start_period = models.PositiveSmallIntegerField(null=True, blank=True)
    end_period = models.PositiveSmallIntegerField(null=True, blank=True)
    week_type = models.CharField(max_length=8, choices=[('odd','odd'),('even','even'),('all','all')], default='all')
    weeks = models.CharField(max_length=64, blank=True, default='')  # 如 1-16 或 1,3,5

    course = models.ForeignKey('courses.Course', on_delete=models.SET_NULL, null=True, blank=True)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.SET_NULL, null=True, blank=True)
    class_ref = models.ForeignKey('schools.Class', on_delete=models.SET_NULL, null=True, blank=True)
    room = models.ForeignKey('timetable.Room', on_delete=models.SET_NULL, null=True, blank=True)

    course_name = models.CharField(max_length=128)
    teacher_name = models.CharField(max_length=64, blank=True, default='')
    class_name = models.CharField(max_length=64, blank=True, default='')
    room_name = models.CharField(max_length=64, blank=True, default='')

    remark = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'lessons'
        indexes = [
            models.Index(fields=['term','day_of_week']),
        ]
        verbose_name = '课程表-课次'
        verbose_name_plural = '课程表-课次'


