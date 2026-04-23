import uuid
from django.db import models


class CodeCatalog(models.Model):
    """
    Catálogo de códigos para decodificación de valores
    - office, bank_account, operation, etc.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=50, db_index=True)
    description = models.TextField(blank=True, null=True)
    display_name = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'code_catalog'
        verbose_name = 'Catálogo de Códigos'
        verbose_name_plural = 'Catálogos de Códigos'
        ordering = ['category', 'code']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.code} ({self.category})"
