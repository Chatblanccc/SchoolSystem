from rest_framework import serializers
from .models import Lesson


class LessonSerializer(serializers.ModelSerializer):
    dayOfWeek = serializers.IntegerField(source='day_of_week')
    startTime = serializers.CharField(source='start_time', required=False, allow_null=True, allow_blank=True)
    endTime = serializers.CharField(source='end_time', required=False, allow_null=True, allow_blank=True)
    startPeriod = serializers.IntegerField(source='start_period', required=False, allow_null=True)
    endPeriod = serializers.IntegerField(source='end_period', required=False, allow_null=True)
    weekType = serializers.ChoiceField(source='week_type', choices=[('odd','odd'),('even','even'),('all','all')], required=False)
    weeks = serializers.CharField(required=False, allow_blank=True)
    courseId = serializers.UUIDField(source='course_id', required=False, allow_null=True)
    courseName = serializers.CharField(source='course_name')
    teacherId = serializers.UUIDField(source='teacher_id', required=False, allow_null=True)
    teacherName = serializers.CharField(source='teacher_name', required=False)
    classId = serializers.UUIDField(source='class_ref_id', required=False, allow_null=True)
    className = serializers.CharField(source='class_name', required=False)
    roomId = serializers.UUIDField(source='room_id', required=False, allow_null=True)
    roomName = serializers.CharField(source='room_name', required=False)

    class Meta:
        model = Lesson
        fields = [
            'id','term','dayOfWeek','startTime','endTime','startPeriod','endPeriod','weekType','weeks',
            'courseId','courseName','teacherId','teacherName','classId','className','roomId','roomName','remark'
        ]


