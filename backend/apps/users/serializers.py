from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "is_active",
            "is_staff",
            "date_joined",
        ]

    def get_name(self, obj):
        return obj.get_full_name() or obj.username


class UserDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "is_active",
            "is_staff",
            "password",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]

    def get_name(self, obj):
        return obj.get_full_name() or obj.username

    def validate(self, attrs):
        # 创建时必须提供 username 与 password
        if self.instance is None:
            if not attrs.get("username"):
                raise serializers.ValidationError({"username": ["必填"]})
            if not attrs.get("password"):
                raise serializers.ValidationError({"password": ["必填"]})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # 默认随机密码（不可登录），要求后续改密
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


