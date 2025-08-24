from django.urls import path
from .views import *

urlpatterns = [

    # Login
    path('login', LoginView.as_view(), name='login'),
    path('auth/verify', verify_auth, name='verify_auth'),

    # Vendor
    path('vendors/', VendorListView.as_view(), name='vendor-list'),
    path('vendors/add', VendorCreateView.as_view(), name='vendor-create'),
    path('vendors/<int:pk>/', VendorUpdateView.as_view(), name='vendor-update'),
    path('vendors/<int:pk>/analytics/', vendor_analytics, name='vendor-analytics'),

    # Product
    path('products', ProductListView.as_view(), name='product-list'),
    path('products/add/features', DropdownDataView.as_view(), name='product-features'),
    path('products/add', ProductCreateView.as_view(), name='product-add'),
    path('products/<int:pk>', ProductDeleteView.as_view(), name='product-delete'),
    path('products/edit/<int:pk>', ProductUpdateView.as_view(), name='product-edit'),
    path('products/<int:product_id>/inventory', ProductInventoryListView.as_view(), name='product-inventory-list'),
    path('products/add/inventory', InventoryCreateView.as_view(), name='inventory-create'),
    path('products/delete/<int:pk>/inventory', InventoryDeleteView.as_view(), name='delete-inventory'),
    path('products/<int:pk>/', ProductUpdateView.as_view(), name='product-update'),

    # Inventory
    path('inventory', InventoryGroupedListView.as_view(), name='inventory-list'),
    path('inventory/products', ProductSelectListView.as_view(), name='inventory-product'),
    path('inventory/search/', InventoryByCodeView.as_view(), name='inventory-by-barcode'),
    path('stock-batches/', StockBatchListView.as_view(), name='StockBatch-ListView'),

    # Payment
    path('transactions/create', CreateOrderView.as_view(), name='create-order'),
    path('transactions/list', OrderListView.as_view(), name='order-list'),

    # Dashboard endpoints
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),

    # Tailor
    path("tailor/orders/", list_tailor_orders, name="list_tailor_orders"),
    path("tailor/orders/add/", create_tailor_order, name="create_tailor_order"),
    path("tailor/orders/<int:order_id>/update/", update_tailor_order, name="update_tailor_order"),
    path('tailor/orders/<int:order_id>/payment/', record_payment, name='record-payment'),
    path('tailor/orders/<int:order_id>/delete', delete_order, name='delete-order'),
    path('tailor/orders/items/<int:item_id>/delete/', delete_tailor_order_item, name='delete_tailor_order_item'),

    # Report
    path("manguva/report/", daily_report, name="daily_report"),

]
