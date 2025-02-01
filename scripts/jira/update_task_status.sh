#!/bin/bash

# Load environment variables
source .env

# Database Architecture Tasks - Moving to Done
python3 update_tasks.py --key TENP-79 --status "Done" --comment "Schema design completed with User, Group, Customer, Permission, and UserProfile entities"
python3 update_tasks.py --key TENP-80 --status "Done" --comment "Migration system set up with TypeORM, including configuration files"
python3 update_tasks.py --key TENP-81 --status "Done" --comment "Entity models created with proper relationships and validations"
python3 update_tasks.py --key TENP-84 --status "Done" --comment "Database-level validation implemented using class-validator"
