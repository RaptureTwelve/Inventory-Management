from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.crypto import get_random_string
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from uuid import uuid4


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)

class MaguvaUsers(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    def __str__(self):
        return self.email

class Vendor(models.Model):
    vendor_name = models.CharField(max_length=255)
    contact_person_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)

    def __str__(self):
        return self.vendor_name


class Product(models.Model):
    PRODUCT_TYPES = [
        ('Kurti', 'Kurti'),
        ('Saree', 'Saree'),
        ('Lehenga', 'Lehenga'),
        ('Dress', 'Dress'),
        ('Top', 'Top'),
        ('Bottom', 'Bottom'),
        ('Dupatta', 'Dupatta'),
        ('Accessories', 'Accessories'),
        ('Nighty', 'Nighty'),
        ('Chudidar', 'Chudidar'),
        ('Blouse', 'Blouse'),
        ('Other', 'Other'),
    ]

    FABRIC_TYPES = [
        ('Cotton', 'Cotton'),
        ('Linen', 'Linen'),
        ('Silk', 'Silk'),
        ('Chiffon', 'Chiffon'),
        ('Georgette', 'Georgette'),
        ('Crepe', 'Crepe'),
        ('Polyester', 'Polyester'),
        ('Rayon', 'Rayon'),
        ('Mixed', 'Mixed'),
        ('Other', 'Other'),
    ]
    MARKUP_TYPES = [
        ('fixed', 'Fixed Amount'),
        ('percent', 'Percentage'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    product_type = models.CharField(max_length=50, choices=PRODUCT_TYPES)
    fabric_type = models.CharField(max_length=50, choices=FABRIC_TYPES)
    sub_category = models.CharField(max_length=100, blank=True, null=True)
    color_code = models.CharField(max_length=7)  # e.g. "#FF5733"
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    markup_price = models.DecimalField(max_digits=10, decimal_places=2)
    markup_type = models.CharField(max_length=10, choices=MARKUP_TYPES, default='fixed')
    sku = models.CharField(max_length=20, unique=True, editable=False)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    stock_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.sku:
            # Example: NIG-6757 for Nighty
            prefix = self.product_type[:3].upper()
            random_num = get_random_string(length=4, allowed_chars='0123456789')
            self.sku = f"{prefix}-{random_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_type} - {self.sku}"

SIZE_CHOICES = [
    ('S', 'Small'),
    ('M', 'Medium'),
    ('L', 'Large'),
    ('XL', 'Extra Large'),
    ('XXL', 'Double Extra Large'),
    ('', 'No Size')
]

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_items')
    batch = models.ForeignKey('StockBatch', on_delete=models.CASCADE, related_name="inventory_units")
    size = models.CharField(max_length=5, choices=SIZE_CHOICES)
    sku = models.CharField(max_length=50, unique=True, editable=False)
    barcode = models.CharField(max_length=100, unique=True, editable=False)

    def save(self, *args, **kwargs):
        if not self.sku:
            # Format: PRODUCTSKU-SIZE-COLOR-RANDOM4
            color_code_clean = self.product.color_code.replace("#", "")
            random_num = uuid4().hex[:6]
            self.sku = f"{self.product.sku}-{self.size}-{color_code_clean}-{random_num}"

        if not self.barcode:
            self.barcode = f"BC-{get_random_string(10, '0123456789')}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.product_type} ({self.size}) - {self.sku}"

class StockBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="batches")
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    batch_number = models.PositiveIntegerField()
    added_qty = models.PositiveIntegerField()
    sold_qty = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'batch_number')

    @property
    def available_qty(self):
        return self.added_qty - self.sold_qty

    def __str__(self):
        return f"{self.product.product_type} | Batch {self.batch_number} | Available {self.available_qty}"


def generate_order_code(length=10):
    return get_random_string(length=length)

class Order(models.Model):
    order_number = models.CharField(default=generate_order_code, editable=False, unique=True, max_length=10)
    customer_name = models.CharField(max_length=255, blank=True)
    customer_mobile = models.CharField(max_length=15, blank=True)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)  
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)  
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)  
    
    payment_method = models.CharField(max_length=50)  # e.g. 'cash', 'card', 'upi'
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2)

    created_by = models.ForeignKey(MaguvaUsers, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def short_order_number(self):
        return str(self.order_number).replace("-", "")[:10].upper()

    def __str__(self):
        return f"Order #{self.order_number}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    
    product_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    size = models.CharField(max_length=20, blank=True, null=True)
    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    quantity = models.PositiveIntegerField(default=1)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)  
    
    inventory_id = models.PositiveIntegerField()  
    product_id = models.PositiveIntegerField()
    batch = models.ForeignKey(StockBatch, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.product_name} ({self.sku})"


class TailorOrder(models.Model):
    order_number = models.CharField(max_length=8, unique=True, editable=False)

    customer_name = models.CharField(max_length=200)
    customer_mobile = models.CharField(max_length=15)

    product_name = models.CharField(max_length=200)
    description = models.TextField()

    order_date = models.DateTimeField(default=timezone.now)
    delivery_date = models.DateField()

    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    STATUS_CHOICES = [
        ("ordered", "Ordered"),
        ("delivered", "Delivered"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ordered")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = generate_order_code(length=8)
        # auto calculate balance
        self.balance_amount = self.total_amount - self.advance_paid

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name} ({self.product_name})"

class TailorOrderItemDetail(models.Model):
    tailor_order = models.ForeignKey(TailorOrder, related_name="item_details", on_delete=models.CASCADE)
    item_name = models.CharField(max_length=255)   # e.g., "Kurti", "Blouse", "Lehenga"
    quantity = models.PositiveIntegerField(default=1)
    remarks = models.TextField(blank=True, null=True)  # custom notes (e.g., "Add lining", "3/4 sleeve")

    def __str__(self):
        return f"{self.item_name} x{self.quantity} for Order {self.tailor_order.order_number}"


