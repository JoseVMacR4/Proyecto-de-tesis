from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('bank_accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='accountstate',
            name='period_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='accountstate',
            name='period_end',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='accountstate',
            name='balance',
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=20, null=True),
        ),
        migrations.RunSQL(
            sql=(
                "UPDATE bank_accounts_accountstate "
                "SET period_start = date, period_end = date, balance = COALESCE(final_balance, initial_balance, 0) "
                "WHERE period_start IS NULL OR period_end IS NULL OR balance IS NULL;"
            ),
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterModelOptions(
            name='accountstate',
            options={
                'verbose_name': 'Account State',
                'verbose_name_plural': 'Account States',
                'ordering': ['-period_end'],
                'indexes': [models.Index(fields=['period_start', 'period_end'], name='bank_accoun_period__b4c733_idx')],
            },
        ),
    ]
