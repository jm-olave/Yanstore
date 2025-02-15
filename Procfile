# Root Procfile (place this in the root of your repository)
web: cd backend && uvicorn main:app --host=0.0.0.0 --port=${PORT:-5000}

# requirements.txt (place this in your backend folder)
fastapi==0.109.0
uvicorn==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
pydantic==2.5.3
python-dotenv==1.0.0
python-multipart==0.0.6

# .gitignore (root level)
venv/
__pycache__/
*.pyc
.env
.DS_Store