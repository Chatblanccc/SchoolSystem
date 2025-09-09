from rest_framework import serializers

from .models import Teacher, TeachingAssignment


class TeacherListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = [
            "id",
            "teacher_id",
            "name",
            "gender",
            "phone",
            "employment_status",
            "employment_type",
            "created_at",
            "updated_at",
        ]


class TeachingAssignmentSerializer(serializers.ModelSerializer):
    class_id = serializers.UUIDField(source="class_ref.id", read_only=True)
    class_name = serializers.CharField(source="class_ref.name", read_only=True)
    class_code = serializers.CharField(source="class_ref.code", read_only=True)
    head_teacher_id = serializers.UUIDField(source="class_ref.head_teacher.id", read_only=True)
    head_teacher_name = serializers.CharField(source="class_ref.head_teacher.name", read_only=True)
    course_id = serializers.UUIDField(source="course.id", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = TeachingAssignment
        fields = [
            "id",
            "class_id",
            "class_name",
            "class_code",
            "head_teacher_id",
            "head_teacher_name",
            "course_id",
            "course_code",
            "course_name",
            "subject",
            "duty",
            "weekly_hours",
            "year",
            "term",
        ]


class TeacherDetailSerializer(serializers.ModelSerializer):
    assignments = TeachingAssignmentSerializer(many=True, read_only=True)
    class Meta:
        model = Teacher
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]


