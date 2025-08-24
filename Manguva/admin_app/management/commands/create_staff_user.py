from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Create a staff user interactively"

    def handle(self, *args, **kwargs):
        User = get_user_model()

        # Ask for details
        email = input("Enter staff email: ").strip()
        name = input("Enter staff name: ").strip()

        # Password confirmation loop
        while True:
            password = input("Enter password: ").strip()
            confirm_password = input("Confirm password: ").strip()
            if password == confirm_password:
                break
            else:
                self.stdout.write(self.style.ERROR("Passwords do not match. Try again."))

        # Create the staff user
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f"User with email '{email}' already exists."))
            return

        user = User.objects.create_user(
            email=email,
            name=name,
            password=password,
            is_staff=True,
            is_active=True
        )

        self.stdout.write(self.style.SUCCESS(f"Staff user '{email}' created successfully."))
