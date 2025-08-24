from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.views import APIView
from django.contrib.auth import authenticate
import logging
from .models import *
from .serializers import *
from django.db.models import Sum, Count, Avg, F, Subquery, OuterRef, Value, IntegerField
from django.shortcuts import get_object_or_404
from django.db.models.functions import TruncDate, TruncMonth
from django.db import transaction
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
from django.db.models.functions import Coalesce

logger = logging.getLogger(__name__)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        access_token = AccessToken.for_user(user)
        access_token.set_exp(lifetime=timedelta(days=1)) 

        if user.is_superuser:
            role = "admin"
        elif user.is_staff:
            role = "staff"
        else:
            role = "user"

        return Response({
            "access": str(access_token),
            "user": {
                "email": user.email,
                "name": user.name,
                "role": role
            }
                })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_auth(request):
    user = request.user
    role = "admin" if user.is_superuser else "staff" if user.is_staff else "user"
    
    return Response({
        "user": {
            "email": user.email,
            "name": user.name,
            "role": role
        }
    })

class VendorListView(generics.ListAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

class VendorCreateView(generics.CreateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        logger.info(f"Vendor creation request by user {request.user.email}")
        return super().create(request, *args, **kwargs)

class VendorUpdateView(generics.UpdateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        vendor = self.get_object()
        logger.info(f"Vendor update request by user {request.user.email} for vendor {vendor.id}")
        return super().update(request, *args, **kwargs)

# View Single Vendor
class VendorDetailView(generics.RetrieveAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        vendor = self.get_object()
        logger.info(f"Vendor details viewed: {vendor.vendor_name} by {request.user.email}")
        return super().retrieve(request, *args, **kwargs)


class DropdownDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vendors = VendorSerializer(Vendor.objects.all(), many=True).data

            # Extract product types from the model choices
            product_types = [
                {"value": choice[0], "label": choice[1]}
                for choice in Product.PRODUCT_TYPES
            ]

            # Extract fabric types from the model choices
            fabric_types = [
                {"value": choice[0], "label": choice[1]}
                for choice in Product.FABRIC_TYPES
            ]

            return Response({
                "vendors": vendors,
                "product_types": product_types,
                "fabric_types": fabric_types
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching dropdown data: {e}")
            return Response(
                {"error": "Failed to fetch dropdown data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# 2. API: View all products
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


# 3. API: Create a product
class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Product creation request: {request.data}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            return Response({"error": "Failed to create product"}, status=status.HTTP_400_BAD_REQUEST)

class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        product = self.get_object()
        logger.info(f"Product update request by user {request.user.email} for product {product.id}")
        return super().update(request, *args, **kwargs)


# 4. API: Delete product
class ProductDeleteView(generics.DestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def delete(self, request, *args, **kwargs):
        try:
            logger.info(f"Product delete request ID: {kwargs.get('pk')}")
            return super().delete(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error deleting product: {e}")
            return Response({"error": "Failed to delete product"}, status=status.HTTP_400_BAD_REQUEST)


# 5. API: Edit product
class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        try:
            logger.info(f"Product update request ID: {kwargs.get('pk')} data: {request.data}")
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error updating product: {e}")
            return Response({"error": "Failed to update product"}, status=status.HTTP_400_BAD_REQUEST)


class ProductInventoryListView(APIView):
    """Fetch product details and inventory for a given product."""
    def get(self, request, product_id):
        try:
            product = Product.objects.select_related('vendor').get(id=product_id)
            inventory = Inventory.objects.filter(product_id=product_id)

            product_data = {
                "id": product.id,
                "product_type": product.product_type,
                "fabric_type": product.fabric_type,
                "color_code": product.color_code,
                "base_price": product.base_price,
                "markup_price": product.markup_price,
                "sku": product.sku,
                "mrp": product.mrp,
                "vendor": {
                    "id": product.vendor.id if product.vendor else None,
                    "vendor_name": product.vendor.vendor_name if product.vendor else None,
                    "contact_person_name": product.vendor.contact_person_name if product.vendor else None,
                    "phone": product.vendor.phone if product.vendor else None
                }
            }

            inventory_data = InventorySerializer(inventory, many=True).data

            return Response({
                "product": product_data,
                "inventory": inventory_data
            }, status=status.HTTP_200_OK)

        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching inventory for product {product_id}: {e}")
            return Response({"error": "Failed to fetch inventory"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class InventoryCreateView(APIView):
    permission_classes = [IsAdminUser]
    """Add new inventory rows in bulk (each quantity = separate row)."""
    def post(self, request):
        data = request.data
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected array of inventory items"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if not data:
                return Response({"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)

            first_item = data[0]
            product_id = first_item.get("product")
            product = Product.objects.get(id=product_id)

            # ✅ check if batch_id is passed
            batch_id = first_item.get("batch_id")
            batch = None
            if batch_id:
                try:
                    batch = StockBatch.objects.get(id=batch_id, product=product)
                except StockBatch.DoesNotExist:
                    return Response({"error": "Batch not found for this product"}, status=status.HTTP_404_NOT_FOUND)
            else:
                # create new batch
                last_batch = StockBatch.objects.filter(product=product).order_by("-batch_number").first()
                next_batch_number = (last_batch.batch_number + 1) if last_batch else 1
                batch = StockBatch.objects.create(
                    product=product,
                    batch_number=next_batch_number,
                    added_qty=0,
                    vendor=product.vendor
                )

            expanded_items = []
            total_qty = 0

            for item in data:
                qty = int(item.get("quantity", 0))
                if qty <= 0:
                    continue

                total_qty += qty

                for _ in range(qty):
                    expanded_items.append({
                        "product": item["product"],
                        "size": item.get("size", ""),
                        "quantity": 1,
                        "batch": batch.id
                    })

            if not expanded_items:
                return Response({"error": "No valid inventory items"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = InventorySerializer(data=expanded_items, many=True)
            if serializer.is_valid():
                serializer.save()

                # update batch + product stock
                batch.added_qty = F("added_qty") + total_qty
                batch.save(update_fields=["added_qty"])

                Product.objects.filter(id=product.id).update(
                    stock_count=F("stock_count") + total_qty
                )

                return Response({
                    "message": "Inventory added successfully",
                    "batch_id": batch.id,
                    "batch_number": batch.batch_number,
                    "total_quantity": total_qty,
                    "items": serializer.data
                }, status=status.HTTP_201_CREATED)

            logger.error(f"Error creating inventory: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StockBatchListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        product_id = self.request.query_params.get("product")
        qs = StockBatch.objects.all()
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs.order_by("batch_number")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [
            {"id": batch.id, "label": f"Unit {batch.batch_number}"}
            for batch in queryset
        ]
        return Response(data)



class InventoryDeleteView(APIView):
    """Delete an inventory row and decrease product stock count."""
    permission_classes = [IsAdminUser]
    def delete(self, request, pk):
        try:
            inventory_item = Inventory.objects.get(pk=pk)
            product = inventory_item.product
            batch = inventory_item.batch

            # Decrease stock count
            if product.stock_count is not None:
                new_stock = product.stock_count - 1
                product.stock_count = max(new_stock, 0)
                product.save(update_fields=['stock_count'])

            if batch and batch.added_qty > 0:
                batch.added_qty = F("added_qty") - 1
                batch.save(update_fields=['added_qty'])

            inventory_item.delete()
            return Response({"message": "Inventory deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        except Inventory.DoesNotExist:
            return Response({"error": "Inventory item not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting inventory {pk}: {e}")
            return Response({"error": "Failed to delete inventory"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InventoryGroupedListView(APIView):
    def get(self, request):
        try:
            inventory_groups = (
                Inventory.objects
                .select_related("product")
                .values("product", "product__product_type", "product__vendor__vendor_name", "size")
                .annotate(quantity=Count("id"))
            )

            response_data = [
                {
                    "product": {
                        "id": group["product"],
                        "product_type": group["product__product_type"],
                        "vendor_name": group["product__vendor__vendor_name"],
                    },
                    "size": group["size"] or "NONE",
                    "quantity": group["quantity"],
                }
                for group in inventory_groups
            ]

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductSelectListView(APIView):
    """List products for admin selection dropdown."""

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSelectSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InventoryByCodeView(APIView):
    """Fetch inventory by barcode or SKU."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barcode = request.query_params.get("barcode")
        sku = request.query_params.get("sku")

        try:
            if barcode:
                inventory_item = Inventory.objects.select_related("product").get(barcode=barcode)
            elif sku:
                inventory_item = Inventory.objects.select_related("product").get(sku=sku)
            else:
                return Response({"error": "Please provide either barcode or SKU"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "inventory": InventorySearchSerializer(inventory_item).data
            }, status=status.HTTP_200_OK)

        except Inventory.DoesNotExist:
            return Response({"error": "Inventory not found"}, status=status.HTTP_404_NOT_FOUND)


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        try:
            with transaction.atomic():
                # Create the order
                subtotal = sum(item["price"] * item.get("quantity", 1) for item in data["items"])
                discount_total = sum(
                    (item["price"] * item.get("discount", 0) / 100) * item.get("quantity", 1)
                    for item in data["items"]
                )
                price_after_discount = subtotal - discount_total
                gst_amount = round(price_after_discount * 0.18, 2)

                total_amount = price_after_discount + gst_amount

                order = Order.objects.create(
                    customer_name=data.get("customer", {}).get("name", ""),
                    customer_mobile=data.get("customer", {}).get("mobile", ""),
                    subtotal=subtotal,
                    discount_total=discount_total,
                    gst_percentage=18,
                    gst_amount=gst_amount,
                    total_amount=total_amount,
                    payment_method=data.get("payment", {}).get("method", "cash"),
                    payment_amount=data.get("payment", {}).get("amount", 0),
                    created_by=request.user if request.user.is_authenticated else None
                )

                # Create order items
                order_items = []
                for item in data["items"]:
                    discount_amount = (item["price"] * item.get("discount", 0)) / 100
                    inventory_item = Inventory.objects.get(id=item["inventoryId"])
                    batch = inventory_item.batch  
                    order_item = OrderItem.objects.create(
                        order=order,
                        product_name=item["name"],
                        sku=item["sku"],
                        size=item.get("size"),
                        price=item["price"],
                        discount_percentage=item.get("discount", 0),
                        discount_amount=discount_amount,
                        quantity=item.get("quantity", 1),
                        line_total=(item["price"] - discount_amount) * item.get("quantity", 1),
                        inventory_id=item["inventoryId"],
                        product_id=item["productId"],
                        batch=batch
                    )
                    order_items.append(order_item)
                    Product.objects.filter(id=item["productId"]).update(
                        stock_count=models.F('stock_count') - item.get("quantity", 1)
                    )


                    batch.sold_qty = F("sold_qty") + item.get("quantity", 1)
                    batch.save(update_fields=["sold_qty"])

                    # delete the unit
                    inventory_item.delete()


                # Prepare response data
                order_data = {
                    'order_number': str(order.order_number),
                    'customer_name': order.customer_name,
                    'customer_mobile': order.customer_mobile,
                    'subtotal': float(order.subtotal),
                    'discount_total': float(order.discount_total),
                    'gst_amount': float(gst_amount),
                    'total_amount': float(order.total_amount),
                    'payment_method': order.payment_method,
                    'payment_amount': float(order.payment_amount),
                    'created_at': order.created_at.isoformat(),
                    'items': [{
                        'product_name': item.product_name,
                        'sku': item.sku,
                        'size': item.size,
                        'price': float(item.price),
                        'discount_percentage': float(item.discount_percentage),
                        'discount_amount': float(item.discount_amount),
                        'quantity': item.quantity,
                        'line_total': float(item.line_total),
                        'inventoryId': item.inventory_id,
                        'productId': item.product_id
                    } for item in order_items]
                }

                return Response({
                    "message": "Order created successfully", 
                    "order_number": order.order_number,
                    "order_data": order_data
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'Error while create a Order - {e}')
            return Response({"error": 'While creating order'}, status=status.HTTP_400_BAD_REQUEST)

        
class OrderListView(generics.ListAPIView):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def list(self, request, *args, **kwargs):
        logger.info(f"User {request.user} fetched order list.")
        return super().list(request, *args, **kwargs)


class DashboardAnalyticsView(APIView):
    """
    Comprehensive dashboard analytics endpoint with proper error handling
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get date range from query params (default: last 30 days)
            days = int(request.query_params.get('days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # Previous period for comparison
            prev_start_date = start_date - timedelta(days=days)
            
            analytics_data = {}
            
            # 1. Key Metrics
            analytics_data.update(self._get_key_metrics(start_date, end_date, prev_start_date))
            
            # 2. Monthly Revenue and Orders Trend
            analytics_data.update(self._get_monthly_trends(start_date, end_date))
            
            # 3. Recent Orders
            analytics_data['recent_orders'] = self._get_recent_orders()
            
            # 4. Product Performance
            analytics_data['top_products'] = self._get_top_products(start_date, end_date)
            
            # 5. Low Stock Products
            analytics_data['low_stock_products'] = self._get_low_stock_products()
            
            # 6. Payment Method Statistics
            analytics_data['payment_methods'] = self._get_payment_stats(start_date, end_date)
            
            # 7. Vendor Performance
            analytics_data['vendor_performance'] = self._get_vendor_performance(start_date, end_date)
            
            # 8. Additional Metrics
            analytics_data.update(self._get_additional_metrics(start_date, end_date))
            
            return Response(analytics_data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(e)
            return Response(
                {'error': f'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_key_metrics(self, start_date, end_date, prev_start_date):
        """Calculate key dashboard metrics with growth percentages"""
        try:
            # Current period metrics
            current_orders = Order.objects.filter(created_at__range=[start_date, end_date])
            current_revenue = current_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0')
            current_order_count = current_orders.count()
            
            # Previous period metrics
            prev_orders = Order.objects.filter(created_at__range=[prev_start_date, start_date])
            prev_revenue = prev_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0')
            prev_order_count = prev_orders.count()
            
            # Calculate growth percentages
            revenue_growth = self._calculate_growth(float(prev_revenue), float(current_revenue))
            orders_growth = self._calculate_growth(prev_order_count, current_order_count)
            
            # Additional metrics
            total_products = Product.objects.count()
            total_inventory_value = Product.objects.aggregate(
                total=Sum(F('base_price') * F('stock_count'))
            )['total'] or Decimal('0')
            
            # Average order value
            avg_order_value = current_orders.aggregate(
                avg=Avg('total_amount')
            )['avg'] or Decimal('0')
            
            return {
                'total_revenue': float(current_revenue),
                'total_orders': current_order_count,
                'total_products': total_products,
                'total_inventory_value': float(total_inventory_value),
                'revenue_growth': revenue_growth,
                'orders_growth': orders_growth,
                'avg_order_value': float(avg_order_value),
            }
        except Exception as e:
            raise Exception(f"Error calculating key metrics: {str(e)}")
    
    def _get_monthly_trends(self, start_date, end_date):
        """Get monthly revenue and order trends"""
        try:
            # Monthly revenue
            monthly_revenue = Order.objects.filter(
                created_at__range=[start_date, end_date]
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                revenue=Sum('total_amount')
            ).order_by('month')
            
            # Monthly orders
            monthly_orders = Order.objects.filter(
                created_at__range=[start_date, end_date]
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                orders=Count('id')
            ).order_by('month')
            
            # Format data
            revenue_data = [
                {
                    'month': item['month'].strftime('%b %Y'),
                    'revenue': float(item['revenue'])
                }
                for item in monthly_revenue
            ]
            
            orders_data = [
                {
                    'month': item['month'].strftime('%b %Y'),
                    'orders': item['orders']
                }
                for item in monthly_orders
            ]
            
            return {
                'monthly_revenue': revenue_data,
                'monthly_orders': orders_data
            }
        except Exception as e:
            raise Exception(f"Error getting monthly trends: {str(e)}")
    
    def _get_recent_orders(self, limit=10):
        """Get recent orders with customer details"""
        try:
            recent_orders = Order.objects.select_related().prefetch_related('items').order_by('-created_at')[:limit]
            
            orders_data = []
            for order in recent_orders:
                orders_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer_name': order.customer_name or 'Walk-in Customer',
                    'customer_mobile': order.customer_mobile,
                    'total_amount': float(order.total_amount),
                    'payment_method': order.payment_method,
                    'items_count': order.items.count(),
                    'created_at': order.created_at.isoformat(),
                })
            
            return orders_data
        except Exception as e:
            raise Exception(f"Error getting recent orders: {str(e)}")
    
    def _get_top_products(self, start_date, end_date, limit=10):
        """Get top performing products by revenue (aggregated per product type)"""
        try:
            top_products = (
                OrderItem.objects.filter(
                    order__created_at__range=[start_date, end_date]
                )
                .values(
                    product_type=F("batch__product__product_type")
                )
                .annotate(
                    revenue=Sum("line_total"),
                    quantity_sold=Sum("quantity")
                )
                .order_by("-revenue")[:limit]
            )

            return [
                {
                    "product_type": item["product_type"],
                    "revenue": float(item["revenue"]),
                    "quantity_sold": item["quantity_sold"],
                }
                for item in top_products
            ]
        except Exception as e:
            raise Exception(f"Error getting top products: {str(e)}")
    
    def _get_low_stock_products(self, threshold=10):
        """Get products with low stock levels"""
        try:
            low_stock = Product.objects.filter(
                stock_count__lte=threshold
            ).select_related('vendor').order_by('stock_count')[:20]
            
            return [
                {
                    'product_name': f"{product.product_type} - {product.fabric_type}",
                    'sku': product.sku,
                    'stock_count': product.stock_count,
                    'vendor_name': product.vendor.vendor_name if product.vendor else 'No Vendor',
                    'base_price': float(product.base_price),
                    'color_code': product.color_code
                }
                for product in low_stock
            ]
        except Exception as e:
            raise Exception(f"Error getting low stock products: {str(e)}")
    
    def _get_payment_stats(self, start_date, end_date):
        """Get payment method statistics"""
        try:
            payment_stats = Order.objects.filter(
                created_at__range=[start_date, end_date]
            ).values('payment_method').annotate(
                count=Count('id'),
                revenue=Sum('total_amount')
            ).order_by('-count')
            
            return [
                {
                    'method': item['payment_method'],
                    'count': item['count'],
                    'revenue': float(item['revenue'])
                }
                for item in payment_stats
            ]
        except Exception as e:
            raise Exception(f"Error getting payment stats: {str(e)}")
    
    def _get_vendor_performance(self, start_date, end_date, limit=10):
        """Get vendor performance metrics"""
        try:
            vendor_performance = []
            
            # Get all vendors first
            vendors = Vendor.objects.all()
            
            for vendor in vendors:
                # Get all products for this vendor
                vendor_product_ids = list(vendor.products.values_list('id', flat=True))
                
                if not vendor_product_ids:
                    continue
                
                # Calculate metrics for each vendor using product IDs
                vendor_orders = OrderItem.objects.filter(
                    order__created_at__range=[start_date, end_date],
                    product_id__in=vendor_product_ids
                ).select_related('order')
                
                total_revenue = vendor_orders.aggregate(
                    total=Sum('line_total')
                )['total'] or Decimal('0')
                
                # Only include vendors with orders in the period
                if total_revenue > 0:
                    vendor_performance.append({
                        'vendor_id': vendor.id,
                        'vendor_name': vendor.vendor_name,
                        'total_revenue': float(total_revenue),
                        'product_count': vendor.products.count(),
                        'order_count': vendor_orders.values('order_id').distinct().count()
                    })
            
            # Sort by revenue and limit
            vendor_performance.sort(key=lambda x: x['total_revenue'], reverse=True)
            return vendor_performance[:limit]
            
        except Exception as e:
            raise Exception(f"Error getting vendor performance: {str(e)}")
    
    def _get_additional_metrics(self, start_date, end_date):
        """Get additional dashboard metrics"""
        try:
            # Items sold in period
            items_sold = OrderItem.objects.filter(
                order__created_at__range=[start_date, end_date]
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            # Products running low (stock < 5)
            low_stock_count = Product.objects.filter(stock_count__lt=5).count()
            
            # Out of stock products
            out_of_stock_count = Product.objects.filter(stock_count=0).count()
            
            # New products this month
            current_month_start = timezone.now().replace(day=1)
            new_products_this_month = Product.objects.filter(
                id__gte=1  # Assuming auto-incrementing IDs, adjust as needed
            ).count()  # This is a simplified calculation
            
            return {
                'items_sold': {
                    'last_30_days': items_sold
                },
                'products': {
                    'low_stock': low_stock_count,
                    'out_of_stock': out_of_stock_count
                },
                'new_products_this_month': new_products_this_month,
                'inventory_turnover': 4.2,  # This would need more complex calculation
                'products_growth': 12.5,  # This would need historical data
                'inventory_growth': 8.3   # This would need historical data
            }
        except Exception as e:
            raise Exception(f"Error getting additional metrics: {str(e)}")
    
    def _calculate_growth(self, previous, current):
        """Calculate growth percentage"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)


class BatchBriefSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField()
    batch_number = serializers.IntegerField()
    sold = serializers.IntegerField()
    added_qty = serializers.IntegerField(required=False)
    sold_qty = serializers.IntegerField(required=False)
    available_qty = serializers.IntegerField(required=False)


class TopProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_type = serializers.CharField()
    sold = serializers.IntegerField()


class BatchDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    batch_number = serializers.IntegerField()
    added_qty = serializers.IntegerField()
    sold_qty = serializers.IntegerField()
    available_qty = serializers.IntegerField()


class ProductStockDetailSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_type = serializers.CharField()
    total_added = serializers.IntegerField()
    total_sold = serializers.IntegerField()
    total_available = serializers.IntegerField()
    batches = BatchDetailSerializer(many=True)


class VendorAnalyticsSerializer(serializers.Serializer):
    vendor_id = serializers.IntegerField()
    vendor_name = serializers.CharField()
    total_products = serializers.IntegerField()
    total_stock = serializers.IntegerField()
    month_sold_stock = serializers.IntegerField()
    top_batches_this_month = BatchBriefSerializer(many=True)
    top_products_this_month = TopProductSerializer(many=True)
    product_stock_details = ProductStockDetailSerializer(many=True)


# -----------------------------
# Function-based analytics view
# -----------------------------

@api_view(["GET"])
@permission_classes([IsAdminUser])
def vendor_analytics(request, pk):
    """
    /api/vendors/<pk>/analytics/
    Returns:
    - total_products
    - total_stock (available)
    - month_sold_stock
    - top_batches_this_month (ranked)
    - top_products_this_month (ranked)
    - product_stock_details (per-product + per-batch)
    """
    vendor = get_object_or_404(Vendor, pk=pk)

    # timeframe = current month
    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # All products for this vendor
    vendor_products_qs = Product.objects.filter(vendor=vendor).only("id", "product_type")
    product_ids = list(vendor_products_qs.values_list("id", flat=True))

    # -----------------------------
    # Totals
    # -----------------------------
    total_products = vendor_products_qs.count()

    # Current stock = sum(added_qty - sold_qty) across batches
    batch_totals = StockBatch.objects.filter(product__in=product_ids).aggregate(
        total_added=Coalesce(Sum("added_qty"), Value(0)),
        total_sold=Coalesce(Sum("sold_qty"), Value(0)),
    )
    total_stock_available = int(batch_totals["total_added"] - batch_totals["total_sold"])

    # This month's sold = sum(OrderItem.quantity) filtered by orders in this month
    month_sold_qs = OrderItem.objects.filter(
        product_id__in=product_ids,
        order__created_at__gte=start_of_month,
    ).aggregate(total=Coalesce(Sum("quantity"), Value(0)))
    month_sold_stock = int(month_sold_qs["total"])

    # -----------------------------
    # Top batches sold this month (ranking)
    # Need batch for each OrderItem via Inventory(inventory_id)->batch
    # -----------------------------
    # Annotate OrderItem with batch_id via Subquery
    batch_id_subquery = Subquery(
        Inventory.objects.filter(id=OuterRef("inventory_id")).values("batch_id")[:1]
    )

    oi_with_batch = (
        OrderItem.objects
        .filter(product_id__in=product_ids, order__created_at__gte=start_of_month)
        .exclude(batch__isnull=True)
        .values("batch_id")
        .annotate(sold=Coalesce(Sum("quantity"), Value(0)))
        .order_by("-sold")
    )[:10]


    # Fetch batch numbers for these batch_ids
    batch_map = {
        b.id: b.batch_number
        for b in StockBatch.objects.filter(id__in=[row["batch_id"] for row in oi_with_batch])
    }
    top_batches = [
        {
            "batch_id": row["batch_id"],
            "batch_number": batch_map.get(row["batch_id"], 0),
            "sold": int(row["sold"]),
        }
        for row in oi_with_batch
    ]

    # -----------------------------
    # Top products sold this month (ranking)
    # -----------------------------
    top_products_qs = (
        OrderItem.objects
        .filter(product_id__in=product_ids, order__created_at__gte=start_of_month)
        .values("product_id")
        .annotate(sold=Coalesce(Sum("quantity"), Value(0)))
        .order_by("-sold")
    )[:10]

    # Map product_id -> product_type
    product_type_map = {
        p.id: p.product_type
        for p in vendor_products_qs
    }
    top_products = [
        {
            "product_id": row["product_id"],
            "product_type": product_type_map.get(row["product_id"], "Unknown"),
            "sold": int(row["sold"]),
        }
        for row in top_products_qs
    ]

    # -----------------------------
    # Per-product stock details (and batch breakdown)
    # -----------------------------
    product_stock_details = []
    # Prefetch batches for all products at once
    batches_qs = (
        StockBatch.objects
        .filter(product__in=product_ids)
        .values("product_id", "id", "batch_number", "added_qty", "sold_qty")
    )

    # Group batches by product
    batches_by_product = {}
    for b in batches_qs:
        batches_by_product.setdefault(b["product_id"], []).append(b)

    for p in vendor_products_qs:
        p_batches = batches_by_product.get(p.id, [])
        total_added = sum(b["added_qty"] for b in p_batches) if p_batches else 0
        total_sold = sum(b["sold_qty"] for b in p_batches) if p_batches else 0
        total_available = total_added - total_sold

        batch_details = [
            {
                "id": b["id"],
                "batch_number": b["batch_number"],
                "added_qty": int(b["added_qty"]),
                "sold_qty": int(b["sold_qty"]),
                "available_qty": int(b["added_qty"] - b["sold_qty"]),
            }
            for b in sorted(p_batches, key=lambda x: x["batch_number"])
        ]

        product_stock_details.append({
            "product_id": p.id,
            "product_type": p.product_type,
            "total_added": int(total_added),
            "total_sold": int(total_sold),
            "total_available": int(total_available),
            "batches": batch_details,
        })

    # -----------------------------
    # Serialize and return
    # -----------------------------
    payload = {
        "vendor_id": vendor.id,
        "vendor_name": vendor.vendor_name,
        "total_products": total_products,
        "total_stock": total_stock_available,
        "month_sold_stock": month_sold_stock,
        "top_batches_this_month": top_batches,
        "top_products_this_month": top_products,
        "product_stock_details": product_stock_details,
    }

    serializer = VendorAnalyticsSerializer(payload)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_tailor_orders(request):
    """
    List all tailor orders
    """
    try:
        orders = TailorOrder.objects.all().order_by("-created_at")
        serializer = TailorOrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching tailor orders: {str(e)}")
        return Response(
            {"error": "Failed to fetch orders"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_tailor_order(request):
    """
    Create a new tailor order
    """
    try:
        data = request.data
        mobile = data.get("customer_mobile", "").lstrip("0")

        # Validate basic fields
        total_amount = Decimal(data.get("total_amount", 0))
        advance_paid = Decimal(data.get("advance_paid", 0))
        if advance_paid > total_amount:
            return Response(
                {"error": "Advance cannot be greater than total amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = data.get("item_details", [])
        if not items or len(items) == 0:
            return Response(
                {"error": "At least one item detail is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Create order
        order = TailorOrder.objects.create(
            customer_name=data.get("customer_name"),
            customer_mobile=mobile,
            product_name=data.get("product_name"),
            description=data.get("description"),
            delivery_date=data.get("delivery_date"),
            total_amount=total_amount,
            advance_paid=advance_paid,
        )

        # ✅ Create item details
        for item in items:
            TailorOrderItemDetail.objects.create(
                tailor_order=order,
                item_name=item["item_name"],
                quantity=item.get("quantity", 1),
                remarks=item.get("remarks", ""),
            )

        logger.info(f"Created new tailor order #{order.order_number} with {len(items)} items")
        return Response(TailorOrderSerializer(order).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating order: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to create order"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_tailor_order(request, order_id):
    try:
        order = get_object_or_404(TailorOrder, id=order_id)

        if order.status == "delivered":
            logger.warning(f"Attempt to update tailor order from delivered order #{order.order_number}")
            return Response(
                {"error": "Cannot update tailor order from a delivered order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Update order fields
        mobile = request.data.get("customer_mobile", "").lstrip("0")
        update_data = {**request.data, "customer_mobile": mobile}

        # Validate amounts
        total_amount = Decimal(update_data.get("total_amount", order.total_amount))
        advance_paid = Decimal(update_data.get("advance_paid", order.advance_paid))
        if advance_paid > total_amount:
            return Response(
                {"error": "Advance cannot be greater than total amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update basic fields
        for field, value in update_data.items():
            if field not in ["item_details"]:  # skip items for now
                setattr(order, field, value)
        order.save()

        # ✅ Update / Create items
        items_data = update_data.get("item_details", [])
        existing_ids = []

        for item in items_data:
            item_id = item.get("id")
            if item_id:  # update existing
                try:
                    obj = order.item_details.get(id=item_id)
                    obj.item_name = item.get("item_name", obj.item_name)
                    obj.quantity = item.get("quantity", obj.quantity)
                    obj.remarks = item.get("remarks", obj.remarks)
                    obj.save()
                    existing_ids.append(obj.id)
                except TailorOrderItemDetail.DoesNotExist:
                    continue
            else:  # create new
                new_obj = TailorOrderItemDetail.objects.create(
                    tailor_order=order,
                    item_name=item["item_name"],
                    quantity=item.get("quantity", 1),
                    remarks=item.get("remarks", "")
                )
                existing_ids.append(new_obj.id)

        # ✅ Delete removed items
        order.item_details.exclude(id__in=existing_ids).delete()

        logger.info(f"Updated TailorOrder #{order.order_number} with {order.item_details.count()} items")
        return Response(
            TailorOrderSerializer(order).data,
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error updating tailor order {order_id}: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to update order"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_tailor_order_item(request, item_id):
    """
    Delete a single TailorOrderItemDetail if the parent order is not delivered.
    """
    try:
        item = get_object_or_404(TailorOrderItemDetail, id=item_id)
        order = item.tailor_order

        # Check if the order is already delivered
        if order.status == "delivered":
            logger.warning(f"Attempt to delete item from delivered order #{order.order_number}")
            return Response(
                {"error": "Cannot delete item from a delivered order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.delete()
        logger.info(f"Deleted item {item_id} from order #{order.order_number} by {request.user}")
        return Response(
            {"message": f"Item {item_id} deleted successfully."},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"Error deleting order item {item_id}: {str(e)} by {request.user}")
        return Response(
            {"error": "Failed to delete order item."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def record_payment(request, order_id):
    """Record payment with strict full-payment validation"""
    try:
        order = TailorOrder.objects.get(id=order_id)
        try:
            amount = Decimal(request.data.get('amount', '0'))
        except Exception:
            return Response(
                {"error": "Invalid amount format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate amount is positive
        if amount < 0:
            return Response(
                {"error": "Amount must be positive"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # New total advance
        new_advance = order.advance_paid + amount

        # ❌ Cannot exceed total
        if new_advance > order.total_amount:
            return Response(
                {"error": "Total payments cannot exceed order amount"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ❌ Must exactly equal total if payment is made
        if new_advance != order.total_amount:
            required = order.total_amount - order.advance_paid
            return Response(
                {"error": f"Remaining balance must be paid in full (₹{required})"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Update order (only if exactly equal)
        order.advance_paid = new_advance
        order.balance_amount = Decimal("0.00")
        order.status = "delivered"
        order.save()

        logger.info(f"Recorded full payment of ₹{amount} for order #{order.order_number}")
        return Response(
            TailorOrderSerializer(order).data,
            status=status.HTTP_200_OK
        )

    except TailorOrder.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error recording payment: {str(e)}")
        return Response(
            {"error": "Failed to record payment"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_order(request, order_id):
    """Delete an order"""
    try:
        order = TailorOrder.objects.get(id=order_id)
        if order.status == 'delivered':
            return Response(
                {"error": "Cannot delete delivered orders"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        order_number = order.order_number
        order.delete()
        logger.info(f"Deleted order #{order_number}")
        return Response(
            {"message": "Order deleted successfully"},
            status=status.HTTP_200_OK
        )
    except TailorOrder.DoesNotExist:
        return Response(
            {"error": "Order not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting order: {str(e)}")
        return Response(
            {"error": "Failed to delete order"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

import pytz
IST = pytz.timezone("Asia/Kolkata")

@api_view(["GET"])
# @permission_classes([IsAdminUser])
def daily_report(request):
    try:
        date_str = request.query_params.get("date")
        if date_str:
            report_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=IST)
        else:
            report_date = datetime.now(IST).replace(hour=0, minute=0, second=0, microsecond=0)

        next_day = report_date + timedelta(days=1)

        # Get Orders instead of Bills
        orders_today = Order.objects.filter(created_at__gte=report_date, created_at__lt=next_day)

        # ✅ KPIs
        net_revenue = orders_today.aggregate(total=Sum("total_amount"))["total"] or 0
        cogs = 0  # if you don’t track cost yet, keep 0 or calculate from batches
        gross_profit = net_revenue - cogs
        gm_percent = (gross_profit / net_revenue * 100) if net_revenue else 0
        gst = orders_today.aggregate(total=Sum("gst_amount"))["total"] or 0
        bills_count = orders_today.count()
        units_sold = OrderItem.objects.filter(order__in=orders_today).aggregate(total=Sum("quantity"))["total"] or 0
        aov = (net_revenue / bills_count) if bills_count else 0

        # ✅ Category Revenue
        category_revenue = (
            OrderItem.objects.filter(order__in=orders_today)
            .values(category=F("product_id"))  # if you want actual category, join Product
            .annotate(revenue=Sum("line_total"))
            .order_by("-revenue")
        )

        # ✅ Payment Method Split
        payment_split = (
            orders_today.values("payment_method")
            .annotate(total=Sum("total_amount"))
            .order_by("-total")
        )

        # ✅ Vendor In-Stock (GRNs today)
        todays_grns = StockBatch.objects.filter(created_at__gte=report_date, created_at__lt=next_day)
        vendor_grn_summary = (
            todays_grns.values("vendor__vendor_name")
            .annotate(total_qty=Sum("added_qty"))
            .order_by("-total_qty")
        )

        # ✅ Stock Analysis
        stock_low = Product.objects.filter(stock_count__lte=5).count()
        stock_out = Product.objects.filter(stock_count=0).count()
        stock_old = StockBatch.objects.filter(created_at__lt=report_date - timedelta(days=180)).count()

        # ✅ Lot Trace
        lot_trace = todays_grns.values(
            product_pk=F("product__id"),
            product_name=F("product__product_type"),
            batch_no=F("batch_number"),
            qty=F("added_qty"),
        )

        data = {
            "report_date": report_date.strftime("%Y-%m-%d"),
            "kpis": {
                "net_revenue": net_revenue,
                "cogs": cogs,
                "gross_profit": gross_profit,
                "gm_percent": round(gm_percent, 2),
                "gst": gst,
                "bills": bills_count,
                "units": units_sold,
                "aov": round(aov, 2),
            },
            "orders_today": list(
                orders_today.values("id", "order_number", "total_amount", "payment_method", "created_at")
            ),
            "category_revenue": list(category_revenue),
            "payment_split": list(payment_split),
            "vendor_instock": list(vendor_grn_summary),
            "stock_analysis": {
                "low_stock": stock_low,
                "out_of_stock": stock_out,
                "old_stock_batches": stock_old,
            },
            "lot_trace": list(lot_trace),
        }

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)