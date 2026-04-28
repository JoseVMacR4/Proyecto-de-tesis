# Generated migration for BankStatement model updates
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reconciliation', '0003_bankstatement_bankstatementtransaction_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='bankstatement',
            name='internal_id',
            field=models.CharField(max_length=50, unique=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name='bankstatement',
            name='file_path',
            field=models.CharField(max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='bankstatement',
            name='file_size',
            field=models.BigIntegerField(help_text="File size in bytes", null=True),
        ),
        migrations.AddField(
            model_name='bankstatement',
            name='status',
            field=models.CharField(
                max_length=50,
                default='uploaded',
                choices=[
                    ('uploaded', 'Subido'),
                    ('processing', 'Procesando'),
                    ('completed', 'Completado'),
                    ('error', 'Error'),
                ]
            ),
        ),
        migrations.AddIndex(
            model_name='bankstatement',
            index=models.Index(fields=['status'], name='reconciliat_status_12345_idx'),
        ),
        migrations.AddIndex(
            model_name='bankstatement',
            index=models.Index(fields=['bank_account', 'statement_date'], name='bank_acc_stmt_date_idx'),
        ),
        migrations.AddConstraint(
            model_name='bankstatement',
            constraint=models.UniqueConstraint(
                fields=['bank_account', 'statement_date'],
                name='unique_bank_statement_per_day'
            ),
        ),
    ]
