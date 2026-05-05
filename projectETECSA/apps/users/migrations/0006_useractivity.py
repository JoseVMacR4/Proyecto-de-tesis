from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_role_permissions'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserActivity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('login', 'Inicio de sesión'), ('logout', 'Cierre de sesión'), ('conciliation', 'Conciliación'), ('upload_statement', 'Subir estado de cuenta'), ('create_user', 'Crear usuario'), ('update_user', 'Actualizar usuario'), ('delete_user', 'Eliminar usuario'), ('create_bank', 'Crear banco'), ('update_bank', 'Actualizar banco'), ('delete_bank', 'Eliminar banco'), ('create_operation', 'Crear operación'), ('update_operation', 'Actualizar operación'), ('delete_operation', 'Eliminar operación'), ('create_office', 'Crear oficina'), ('update_office', 'Actualizar oficina'), ('delete_office', 'Eliminar oficina'), ('generate_report', 'Generar reporte')], max_length=30)),
                ('description', models.TextField()),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=models.CASCADE, related_name='user_activities', to='users.user')),
            ],
            options={
                'verbose_name': 'User Activity',
                'verbose_name_plural': 'User Activities',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='useractivity',
            index=models.Index(fields=['user', 'created_at'], name='users_user__user_id_50b4a8_idx'),
        ),
        migrations.AddIndex(
            model_name='useractivity',
            index=models.Index(fields=['action'], name='users_user__action_7d4f9e_idx'),
        ),
    ]