from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db import models
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from datetime import timedelta
from django.utils import timezone
from apps.reconciliation.models import BankStatementTransaction
from apps.bank_accounts.models import BankAccount, Operation

MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']


@login_required
def reporting_view(request):
	context = {
		'current_page': 'reporting'
	}
	return render(request, 'reporting/reporting.html', context)


@login_required
def conciliation_trend(request):
	months = 6
	end_date = timezone.now().date()
	start_date = end_date - timedelta(days=months * 30)

	monthly_data = (
		BankStatementTransaction.objects
		.annotate(month=TruncMonth('date'))
		.values('month')
		.annotate(
			reconciled=Count('id', filter=models.Q(status='reconciled')),
			pending=Count('id', filter=models.Q(status='pending'))
		)
		.order_by('month')
	)

	labels = []
	reconciled_data = []
	pending_data = []

	for item in monthly_data:
		labels.append(MONTHS_ES[item['month'].month - 1])
		reconciled_data.append(item['reconciled'])
		pending_data.append(item['pending'])

	while len(labels) < months:
		labels.insert(0, '-')
		reconciled_data.insert(0, 0)
		pending_data.insert(0, 0)

	return JsonResponse({
		'labels': labels,
		'reconciled': reconciled_data,
		'pending': pending_data
	})


@login_required
def status_distribution(request):
	total = BankStatementTransaction.objects.count()
	reconciled = BankStatementTransaction.objects.filter(status='reconciled').count()
	pending = total - reconciled

	return JsonResponse({
		'reconciled': reconciled,
		'pending': pending,
		'total': total
	})


@login_required
def income_expense(request):
	months = 6
	end_date = timezone.now().date()
	start_date = end_date - timedelta(days=months * 30)

	monthly_data = (
		BankStatementTransaction.objects
		.annotate(month=TruncMonth('date'))
		.values('month')
		.annotate(
			credits=Sum('amount', filter=models.Q(entry_type='Cr')),
			debits=Sum('amount', filter=models.Q(entry_type='Db'))
		)
		.order_by('month')
	)

	labels = []
	credits_data = []
	debits_data = []

	for item in monthly_data:
		labels.append(MONTHS_ES[item['month'].month - 1])
		credits_data.append(float(item['credits'] or 0))
		debits_data.append(float(item['debits'] or 0))

	while len(labels) < months:
		labels.insert(0, '-')
		credits_data.insert(0, 0)
		debits_data.insert(0, 0)

	return JsonResponse({
		'labels': labels,
		'credits': credits_data,
		'debits': debits_data
	})


@login_required
def top_operations(request):
	limit = 5

	operations_dict = {op.code: op.name for op in Operation.objects.all()}

	top_ops = (
		BankStatementTransaction.objects
		.exclude(operation_type__isnull=True)
		.exclude(operation_type='')
		.values('operation_type')
		.annotate(count=Count('id'))
		.order_by('-count')[:limit]
	)

	labels = []
	values = []
	for item in top_ops:
		code = item['operation_type']
		label = operations_dict.get(code, code) if code else 'Sin tipo'
		labels.append(label)
		values.append(item['count'])

	return JsonResponse({
		'labels': labels,
		'values': values
	})


@login_required
def account_volume(request):
	accounts = (
		BankStatementTransaction.objects
		.values('bank_account__code', 'bank_account__name')
		.annotate(count=Count('id'))
		.order_by('-count')[:10]
	)

	labels = [item['bank_account__name'] or item['bank_account__code'] for item in accounts]
	values = [item['count'] for item in accounts]

	return JsonResponse({
		'labels': labels,
		'values': values
	})


@login_required
def fees_evolution(request):
	months = 6
	end_date = timezone.now().date()
	start_date = end_date - timedelta(days=months * 30)

	monthly_fees = (
		BankStatementTransaction.objects
		.annotate(month=TruncMonth('date'))
		.values('month')
		.annotate(total_fees=Sum('bank_fee'))
		.order_by('month')
	)

	labels = []
	fees_data = []

	for item in monthly_fees:
		labels.append(MONTHS_ES[item['month'].month - 1])
		fees_data.append(float(item['total_fees'] or 0))

	while len(labels) < months:
		labels.insert(0, '-')
		fees_data.insert(0, 0)

	return JsonResponse({
		'labels': labels,
		'values': fees_data
	})