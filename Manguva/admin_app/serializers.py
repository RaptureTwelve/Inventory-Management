from rest_framework import serializers
from .models import *
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaguvaUsers
        fields = ['id', 'email', 'name', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = self.Meta.model(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    product_type_name = serializers.CharField(source='product_type.name', read_only=True)
    fabric_type_name = serializers.CharField(source='fabric_type.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

    def validate_base_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Base price must be positive.")
        return value

    def validate_markup_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Markup price cannot be negative.")
        return value
    
    def validate(self, data):
        base_price = data.get('base_price', getattr(self.instance, 'base_price', None))
        markup_price = data.get('markup_price')
        
        if base_price is not None and markup_price is not None:
            if data.get('markup_type') == 'percent':
                # Convert percentage to fixed amount for storage
                data['mrp'] = base_price * (1 + markup_price/100)
            else:
                # Fixed amount
                data['mrp'] = base_price + markup_price
        
        return data


class InventorySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ['sku', 'barcode']

class ProductSelectSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name')

    class Meta:
        model = Product
        fields = ['id', 'product_type', 'vendor_name']


class InventorySearchSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Inventory
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_name',
            'sku',
            'size',
            'price',
            'discount_percentage',
            'discount_amount',
            'quantity',
            'line_total'
        ]


class OrderSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'customer_name',
            'customer_mobile',
            'subtotal',
            'discount_total',
            'gst_percentage',
            'gst_amount',
            'total_amount',
            'payment_method',
            'payment_amount',
            'created_at',
            'created_by',
            'items'
        ]

class StockBatchSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)
    product_name = serializers.CharField(source="product.product_type", read_only=True)
    available_qty = serializers.IntegerField(read_only=True)

    class Meta:
        model = StockBatch
        fields = ["id", "batch_number", "product_name", "vendor_name", "added_qty", "sold_qty", "available_qty", "created_at"]

    
class VendorAnalyticsSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()
    monthly_sold = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = '__all__'

    def get_products_count(self, obj):
        return obj.products.count()

    def get_total_stock(self, obj):
        return sum(batch.added_qty for batch in obj.stockbatch_set.all())

    def get_monthly_sold(self, obj):
        
        last_month = timezone.now() - timedelta(days=30)
        return obj.stockbatch_set.filter(
            created_at__gte=last_month
        ).aggregate(Sum('sold_qty'))['sold_qty__sum'] or 0

    
class TailorOrderItemDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TailorOrderItemDetail
        fields = ["id", "item_name", "quantity", "remarks"]


class TailorOrderSerializer(serializers.ModelSerializer):
    item_details = TailorOrderItemDetailSerializer(many=True, read_only=True)
    class Meta:
        model = TailorOrder
        fields = "__all__"
        read_only_fields = ["id", "status", "balance_amount", "created_at", "updated_at"]

    # def validate(self, data):
    #     total = data.get("total_amount", 0)
    #     advance = data.get("advance_paid", 0)

    #     if advance > total:
    #         raise serializers.ValidationError("Advance cannot be greater than total amount.")

    #     return data

    # def create(self, validated_data):
    #     items = validated_data.pop("item_details", [])
    #     order = TailorOrder.objects.create(**validated_data)

    #     if not items:
    #         raise serializers.ValidationError("At least one item detail is required.")

    #     for item in items:
    #         TailorOrderItemDetail.objects.create(tailor_order=order, **item)

    #     return order
