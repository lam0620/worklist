# FOR BACKEND
```
cd backend
```

- step 1: Create env
```
python3 -m venv env
```

- step 2: Activate env
```
source env/bin/activate
```

- step 3: Install requirements
```
pip install -r requirements.txt
```

- step 4: copy .env.example =>> .env and change config value

- step 5: Migrate
```
python manage.py makemigrations
python manage.py migrate
```

- step 6: Create superuser
```
python manage.py create_super_user <username> <password> <email> <firstname> <lastname>
```

vd:
```
python manage.py create_super_user admin 12345678@X admin@vn.sprite.jp Admin Admin
```

- step 7: Apply Permission
```
python manage.py init_data
```

- step 8: Run server
```
python manage.py runserver
```

# FOR FONT-END
```
cd frontend
```

- step 1: Install dependencies
```
npm install
```

- step 2. Run server
  * For deverloment
```
npm run dev
```

  * For Production:
```
npm build
npm start
```
