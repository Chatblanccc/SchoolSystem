from rest_framework import serializers

from .models import Class, Grade
from apps.teachers.models import Teacher


class ClassListSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.name", read_only=True)
    headTeacherName = serializers.CharField(source="head_teacher_name", read_only=True)
    head_teacher_id = serializers.UUIDField(source="head_teacher.id", read_only=True)
    student_count = serializers.IntegerField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Class
        fields = [
            "id",
            "code",
            "name",
            "grade_name",
            "headTeacherName",
            "head_teacher_id",
            "capacity",
            "student_count",
            "status",
            "created_at",
            "updated_at",
        ]


class ClassDetailSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.name", read_only=True)
    grade_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    grade = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(), required=False, allow_null=True)
    head_teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Class
        fields = [
            "id",
            "code",
            "name",
            "grade",
            "grade_name",
            "grade_name_input",
            "head_teacher",
            "head_teacher_name",
            "capacity",
            "status",
            "remark",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def create(self, validated_data):
        grade_name_input = validated_data.pop("grade_name_input", None)
        if not validated_data.get("grade") and grade_name_input:
            grade, _ = Grade.objects.get_or_create(name=grade_name_input)
            validated_data["grade"] = grade
        return super().create(validated_data)

    def update(self, instance, validated_data):
        grade_name_input = validated_data.pop("grade_name_input", None)
        if grade_name_input:
            grade, _ = Grade.objects.get_or_create(name=grade_name_input)
            validated_data["grade"] = grade
        return super().update(instance, validated_data)

    def validate(self, attrs):
        # 友好提示：创建时须提供 grade 或 grade_name_input
        if self.instance is None:
            if not attrs.get("grade") and not attrs.get("grade_name_input"):
                raise serializers.ValidationError({
                    "grade": ["grade 或 grade_name_input 必填"],
                })
        return attrs


