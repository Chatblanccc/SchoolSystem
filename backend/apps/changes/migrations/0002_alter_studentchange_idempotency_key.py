from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("changes", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="studentchange",
            name="idempotency_key",
            field=models.CharField(max_length=64, null=True, blank=True, default=None, db_index=True, unique=True),
        ),
    ]


