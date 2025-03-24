import os
from sqlalchemy import create_engine, text

# Get the DATABASE_URL from environment
database_url = os.environ.get('DATABASE_URL')
print(f'Database URL: {database_url[:10]}...{database_url[-10:]}')

# Fix postgres:// to postgresql:// if needed
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://')
    print('Fixed protocol in database URL')

# Create engine
try:
    engine = create_engine(database_url)
    print('Created engine successfully')
    
    # Try to connect and run a query
    with engine.connect() as conn:
        print('Connection established')
        
        # Check tables
        result = conn.execute(text('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\''))
        tables = [row[0] for row in result]
        print(f'Tables found: {len(tables)}')
        for table in tables:
            print(f'- {table}')
except Exception as e:
    print(f'Error: {str(e)}')