from database import engine
from sqlalchemy import text

# Update the alembic version to point to the correct revision
with engine.connect() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num = '4c11619cb743'"))
    conn.commit()
print("Migration version updated successfully") 