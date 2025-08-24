from django.core.management.base import BaseCommand
from admin_app.models import MaguvaUsers, Vendor, Product, Inventory, Order, OrderItem
from decimal import Decimal
import random

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate sample data...'))
        
        # Create sample vendors
        vendors_data = [
            {
                'vendor_name': 'Saree Palace Pvt Ltd',
                'contact_person_name': 'Rajesh Kumar',
                'phone': '+91-9876543210',
                'email': 'rajesh@sareepalace.com',
                'street': '123 Textile Market Street',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'zip_code': '400001',
                'country': 'India'
            },
            {
                'vendor_name': 'Fashion Forward Textiles',
                'contact_person_name': 'Priya Sharma',
                'phone': '+91-9876543211',
                'email': 'priya@fashionforward.com',
                'street': '456 Cotton Mill Road',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'zip_code': '560001',
                'country': 'India'
            },
            {
                'vendor_name': 'Ethnic Elegance',
                'contact_person_name': 'Amit Patel',
                'phone': '+91-9876543212',
                'email': 'amit@ethnicelegance.com',
                'street': '789 Silk Route',
                'city': 'Surat',
                'state': 'Gujarat',
                'zip_code': '395001',
                'country': 'India'
            },
            {
                'vendor_name': 'Modern Trends Fashion',
                'contact_person_name': 'Sneha Reddy',
                'phone': '+91-9876543213',
                'email': 'sneha@moderntrends.com',
                'street': '321 Fashion Street',
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'zip_code': '600001',
                'country': 'India'
            }
        ]
        
        vendors = []
        for vendor_data in vendors_data:
            vendor, created = Vendor.objects.get_or_create(
                vendor_name=vendor_data['vendor_name'],
                defaults=vendor_data
            )
            vendors.append(vendor)
            if created:
                self.stdout.write(f'Created vendor: {vendor.vendor_name}')
        
        # Create sample products
        products_data = [
            # Kurtis
            {'product_type': 'Kurti', 'fabric_type': 'Cotton', 'sub_category': 'Casual Wear', 'color_code': '#FF6B6B', 'base_price': 800, 'markup_price': 1000, 'mrp': 1200, 'discount_percentage': 10},
            {'product_type': 'Kurti', 'fabric_type': 'Rayon', 'sub_category': 'Party Wear', 'color_code': '#4ECDC4', 'base_price': 1200, 'markup_price': 1500, 'mrp': 1800, 'discount_percentage': 15},
            {'product_type': 'Kurti', 'fabric_type': 'Silk', 'sub_category': 'Formal Wear', 'color_code': '#45B7D1', 'base_price': 2000, 'markup_price': 2500, 'mrp': 3000, 'discount_percentage': 5},
            
            # Sarees
            {'product_type': 'Saree', 'fabric_type': 'Silk', 'sub_category': 'Bridal Wear', 'color_code': '#F39C12', 'base_price': 5000, 'markup_price': 6500, 'mrp': 8000, 'discount_percentage': 8},
            {'product_type': 'Saree', 'fabric_type': 'Cotton', 'sub_category': 'Daily Wear', 'color_code': '#E74C3C', 'base_price': 1500, 'markup_price': 2000, 'mrp': 2500, 'discount_percentage': 12},
            {'product_type': 'Saree', 'fabric_type': 'Georgette', 'sub_category': 'Party Wear', 'color_code': '#9B59B6', 'base_price': 2500, 'markup_price': 3200, 'mrp': 4000, 'discount_percentage': 10},
            
            # Lehengas
            {'product_type': 'Lehenga', 'fabric_type': 'Silk', 'sub_category': 'Wedding Collection', 'color_code': '#E67E22', 'base_price': 8000, 'markup_price': 10000, 'mrp': 12000, 'discount_percentage': 5},
            {'product_type': 'Lehenga', 'fabric_type': 'Georgette', 'sub_category': 'Festival Wear', 'color_code': '#27AE60', 'base_price': 4500, 'markup_price': 6000, 'mrp': 7500, 'discount_percentage': 15},
            
            # Dresses
            {'product_type': 'Dress', 'fabric_type': 'Cotton', 'sub_category': 'Casual Wear', 'color_code': '#3498DB', 'base_price': 1200, 'markup_price': 1600, 'mrp': 2000, 'discount_percentage': 20},
            {'product_type': 'Dress', 'fabric_type': 'Crepe', 'sub_category': 'Office Wear', 'color_code': '#2C3E50', 'base_price': 1800, 'markup_price': 2400, 'mrp': 3000, 'discount_percentage': 10},
            
            # Tops
            {'product_type': 'Top', 'fabric_type': 'Cotton', 'sub_category': 'Casual Wear', 'color_code': '#E91E63', 'base_price': 600, 'markup_price': 800, 'mrp': 1000, 'discount_percentage': 15},
            {'product_type': 'Top', 'fabric_type': 'Polyester', 'sub_category': 'Party Wear', 'color_code': '#FF9800', 'base_price': 900, 'markup_price': 1200, 'mrp': 1500, 'discount_percentage': 12},
            
            # Nighties
            {'product_type': 'Nighty', 'fabric_type': 'Cotton', 'sub_category': 'Sleepwear', 'color_code': '#FF5722', 'base_price': 500, 'markup_price': 700, 'mrp': 900, 'discount_percentage': 10},
            {'product_type': 'Nighty', 'fabric_type': 'Rayon', 'sub_category': 'Comfort Wear', 'color_code': '#607D8B', 'base_price': 650, 'markup_price': 850, 'mrp': 1100, 'discount_percentage': 8}
        ]
        
        products = []
        for i, product_data in enumerate(products_data):
            vendor = vendors[i % len(vendors)]  # Distribute products among vendors
            product_data['vendor'] = vendor
            product_data['stock_count'] = random.randint(10, 50)
            
            # Convert to Decimal
            for field in ['base_price', 'markup_price', 'mrp', 'discount_percentage']:
                product_data[field] = Decimal(str(product_data[field]))
            
            product = Product.objects.create(**product_data)
            products.append(product)
            self.stdout.write(f'Created product: {product.product_type} - {product.sku}')
        
        # Create inventory items for each product
        sizes = ['S', 'M', 'L', 'XL', 'XXL']
        inventory_items = []
        
        for product in products:
            # Create 2-4 size variants for each product
            num_sizes = random.randint(2, 4)
            selected_sizes = random.sample(sizes, num_sizes)
            
            for size in selected_sizes:
                inventory = Inventory.objects.create(
                    product=product,
                    size=size
                )
                inventory_items.append(inventory)
                self.stdout.write(f'Created inventory: {inventory.sku}')
        
        # Create sample orders
        orders_data = [
            {
                'customer_name': 'Anita Desai',
                'customer_mobile': '+91-9988776655',
                'payment_method': 'UPI'
            },
            {
                'customer_name': 'Kavya Mehta',
                'customer_mobile': '+91-9988776656',
                'payment_method': 'Card'
            },
            {
                'customer_name': 'Ritu Singh',
                'customer_mobile': '+91-9988776657',
                'payment_method': 'Cash'
            },
            {
                'customer_name': 'Deepika Jain',
                'customer_mobile': '+91-9988776658',
                'payment_method': 'UPI'
            },
            {
                'customer_name': 'Meera Gupta',
                'customer_mobile': '+91-9988776659',
                'payment_method': 'Card'
            }
        ]
        
        # Get the superuser for order creation
        user = MaguvaUsers.objects.filter(is_superuser=True).first()
        
        for order_data in orders_data:
            # Calculate order totals
            subtotal = Decimal('0.00')
            discount_total = Decimal('0.00')
            
            # Create order first
            order = Order.objects.create(
                customer_name=order_data['customer_name'],
                customer_mobile=order_data['customer_mobile'],
                payment_method=order_data['payment_method'],
                subtotal=Decimal('0.00'),
                discount_total=Decimal('0.00'),
                gst_amount=Decimal('0.00'),
                total_amount=Decimal('0.00'),
                payment_amount=Decimal('0.00'),
                created_by=user
            )
            
            # Add 1-3 items to each order
            num_items = random.randint(1, 3)
            selected_inventory = random.sample(inventory_items, num_items)
            
            for inventory in selected_inventory:
                quantity = random.randint(1, 3)
                price = inventory.product.mrp
                discount_percentage = inventory.product.discount_percentage
                discount_amount = (price * discount_percentage / 100) * quantity
                line_total = (price * quantity) - discount_amount
                
                OrderItem.objects.create(
                    order=order,
                    product_name=f"{inventory.product.product_type} - {inventory.product.fabric_type}",
                    sku=inventory.sku,
                    size=inventory.size,
                    price=price,
                    discount_percentage=discount_percentage,
                    discount_amount=discount_amount,
                    quantity=quantity,
                    line_total=line_total,
                    inventory_id=inventory.id,
                    product_id=inventory.product.id
                )
                
                subtotal += price * quantity
                discount_total += discount_amount
            
            # Update order totals
            gst_amount = (subtotal - discount_total) * Decimal('0.18')  # 18% GST
            total_amount = subtotal - discount_total + gst_amount
            
            order.subtotal = subtotal
            order.discount_total = discount_total
            order.gst_amount = gst_amount
            order.total_amount = total_amount
            order.payment_amount = total_amount
            order.save()
            
            self.stdout.write(f'Created order: {order.order_number} for {order.customer_name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with:\n'
                f'- {len(vendors)} vendors\n'
                f'- {len(products)} products\n'
                f'- {len(inventory_items)} inventory items\n'
                f'- {len(orders_data)} orders with multiple items'
            )
        )
