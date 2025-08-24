# admin.py
from django.contrib import admin
from .models import *

# ================
# OrderItem Inline
# ================
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        'product_name', 'sku', 'size',
        'price', 'discount_percentage', 'discount_amount',
        'quantity', 'line_total',
        'inventory_id', 'product_id'
    )

# ================
# Order Admin
# ================
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'customer_name', 'customer_mobile',
        'total_amount', 'payment_method', 'created_at'
    )
    search_fields = ('order_number', 'customer_name', 'customer_mobile')
    list_filter = ('payment_method', 'created_at')
    inlines = [OrderItemInline]
    readonly_fields = (
        'order_number', 'subtotal', 'discount_total', 'gst_percentage', 'gst_amount', 'total_amount',
        'payment_amount', 'created_by', 'created_at'
    )

# ================
# Other Models
# ================
@admin.register(MaguvaUsers)
class MaguvaUsersAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_staff', 'is_active')
    search_fields = ('email', 'name')
    list_filter = ('is_staff', 'is_active')

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('vendor_name', 'contact_person_name', 'phone', 'email', 'city', 'state', 'country')
    search_fields = ('vendor_name', 'contact_person_name', 'phone', 'email')
    list_filter = ('city', 'state', 'country')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'product_type', 'fabric_type', 'sub_category', 'base_price', 'markup_price', 'mrp', 'discount_percentage', 'stock_count', 'vendor')
    search_fields = ('sku', 'product_type', 'fabric_type', 'vendor__vendor_name')
    list_filter = ('product_type', 'fabric_type', 'discount_percentage', 'vendor')

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('sku', 'product', 'size', 'barcode', 'batch')
    search_fields = ('sku', 'barcode', 'product__product_type')
    list_filter = ('size',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product_name', 'sku', 'size', 'quantity', 'price', 'discount_percentage', 'line_total')
    search_fields = ('sku', 'product_name', 'order__order_number', 'order__customer__name')
    list_filter = ('size', 'product_name', 'order__order_number')

    fieldsets = (
        (None, {
            'fields': ('order', 'product_name', 'sku', 'size', 'price', 'discount_percentage', 'discount_amount', 'quantity', 'line_total')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order')

    def order_number(self, obj):
        return obj.order.order_number

    order_number.admin_order_field = 'order__order_number'
    order_number.short_description = 'Order Number'

    def product_name(self, obj):
        return obj.product_name

    product_name.admin_order_field = 'product_name'
    product_name.short_description = 'Product Name'


@admin.register(StockBatch)
class StockBatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'batch_number', 'added_qty', 'sold_qty', 'created_at')
    search_fields = ('product__product_type', 'product__sku')
    list_filter = ('product',)

