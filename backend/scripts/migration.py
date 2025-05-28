# Migration management script
import sys
import os
import subprocess

def create_migration(message):
    """Create a new migration with the specified message"""
    subprocess.run(["alembic", "revision", "--autogenerate", "-m", message])
    print(f"Created migration with message: {message}")

def run_migrations():
    """Run all pending migrations"""
    subprocess.run(["alembic", "upgrade", "head"])
    print("Migrations completed successfully")

def rollback_migration():
    """Rollback the last migration"""
    subprocess.run(["alembic", "downgrade", "-1"])
    print("Rolled back the last migration")

def show_history():
    """Show migration history"""
    subprocess.run(["alembic", "history"])

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python migration.py create \"migration message\"")
        print("  python migration.py run")
        print("  python migration.py rollback")
        print("  python migration.py history")
        sys.exit(1)

    command = sys.argv[1]
    
    if command == "create" and len(sys.argv) > 2:
        create_migration(sys.argv[2])
    elif command == "run":
        run_migrations()
    elif command == "rollback":
        rollback_migration()
    elif command == "history":
        show_history()
    else:
        print("Invalid command")
        sys.exit(1)
