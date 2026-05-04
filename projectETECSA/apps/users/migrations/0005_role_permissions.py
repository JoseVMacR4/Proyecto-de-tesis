from django.db import migrations, models


def set_default_permissions(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    
    Role.objects.filter(name='Administrador').update(
        can_access_admin=True,
        can_upload_statements=False,
        can_reconcile=False,
        can_view_all=True
    )
    Role.objects.filter(name='Analista Financiero').update(
        can_access_admin=False,
        can_upload_statements=True,
        can_reconcile=False,
        can_view_all=True
    )
    Role.objects.filter(name='Analista Económico').update(
        can_access_admin=False,
        can_upload_statements=False,
        can_reconcile=True,
        can_view_all=True
    )
    Role.objects.filter(name='Analista Comercial').update(
        can_access_admin=False,
        can_upload_statements=False,
        can_reconcile=False,
        can_view_all=True
    )


def reverse_permissions(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    Role.objects.update(
        can_access_admin=False,
        can_upload_statements=False,
        can_reconcile=False,
        can_view_all=False
    )


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_userrole_role_alter_userrole_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='role',
            name='can_access_admin',
            field=models.BooleanField(default=False, verbose_name='Acceso al Panel de Administración'),
        ),
        migrations.AddField(
            model_name='role',
            name='can_upload_statements',
            field=models.BooleanField(default=False, verbose_name='Subir Estados de Cuenta'),
        ),
        migrations.AddField(
            model_name='role',
            name='can_reconcile',
            field=models.BooleanField(default=False, verbose_name='Conciliar'),
        ),
        migrations.AddField(
            model_name='role',
            name='can_view_all',
            field=models.BooleanField(default=False, verbose_name='Ver Toda la Información'),
        ),
        migrations.RunPython(set_default_permissions, reverse_permissions),
    ]