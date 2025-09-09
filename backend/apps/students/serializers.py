from django.db import transaction
from rest_framework import serializers

from apps.students.models import Student
from apps.schools.models import Class, Grade


class StudentListSerializer(serializers.ModelSerializer):
    className = serializers.CharField(source="current_class.name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "student_id",
            "name",
            "gender",
            "className",
            "status",
            "created_at",
        ]


class StudentDetailSerializer(serializers.ModelSerializer):
    className = serializers.CharField(source="current_class.name", read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(), source="current_class", write_only=True, required=False
    )
    # 兼容前端按班级名创建/更新（过渡期）
    class_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # 兼容前端字段命名
    idCardNumber = serializers.CharField(source="id_card", required=False, allow_blank=True)
    guangzhouStudentId = serializers.CharField(source="guangzhou_student_id", required=False, allow_blank=True)
    nationalStudentId = serializers.CharField(source="national_student_id", required=False, allow_blank=True)
    birthDate = serializers.DateField(source="birth_date", required=False, allow_null=True)
    homeAddress = serializers.CharField(source="address", required=False, allow_blank=True)
    studentId = serializers.CharField(source="student_id")

    class Meta:
        model = Student
        fields = [
            "id",
            "studentId",
            "name",
            "gender",
            "birthDate",
            "idCardNumber",
            "guangzhouStudentId",
            "nationalStudentId",
            "homeAddress",
            "status",
            "className",
            "class_id",
            "class_name_input",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        # 创建/更新需要有班级ID或班级名
        if self.instance is None:
            has_class = attrs.get("current_class") is not None
            has_name = bool(attrs.get("class_name_input"))
            if not (has_class or has_name):
                raise serializers.ValidationError({"class": ["class_id 或 class_name_input 必填"]})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        class_name = validated_data.pop("class_name_input", "").strip()
        if not validated_data.get("current_class") and class_name:
            # 兼容：按班级名创建/关联班级（需要存在年级，先简单放入默认年级“未分级”）
            grade, _ = Grade.objects.get_or_create(name="未分级")
            current_class, _ = Class.objects.get_or_create(name=class_name, defaults={"code": class_name, "grade": grade})
            validated_data["current_class"] = current_class
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        class_name = validated_data.pop("class_name_input", "").strip()
        if class_name:
            grade, _ = Grade.objects.get_or_create(name="未分级")
            current_class, _ = Class.objects.get_or_create(name=class_name, defaults={"code": class_name, "grade": grade})
            validated_data["current_class"] = current_class
        return super().update(instance, validated_data)


