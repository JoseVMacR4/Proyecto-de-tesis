# Generated migration to add file_size field to BankStatement

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reconciliation', '0003_bankstatement_bankstatementtransaction_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='bankstatement',
            name='file_size',
            field=models.BigIntegerField(blank=True, null=True),
        ),
    ]
