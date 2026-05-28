import psycopg2
import random
from datetime import datetime, timedelta

# Підключення до бази
conn = psycopg2.connect(
    host="localhost",
    database="isttp",
    user="postgres",
    password="1234"
)
cur = conn.cursor()

# Варіанти шаблонів для генерації описів
task_templates = [
    "Підготувати звіт по темі '{}'",
    "Виконати лабораторну роботу №{}",
    "Прочитати розділ {} підручника та зробити конспект",
    "Розв'язати пакет задач з теми '{}'",
    "Підготуватися до контрольної роботи по '{}'",
    "Завершити проєктну частину: '{}'",
    "Виправити помилки у попередній роботі по '{}'"
]

def populate_random_assignments():
    # 1. Отримуємо всі наявні предмети
    cur.execute("SELECT subject_id, name FROM subjects")
    subjects = cur.fetchall()
    
    if not subjects:
        print("Предметів не знайдено. Спочатку заповніть таблицю subjects!")
        return

    now = datetime.now()
    total_added = 0

    for subj_id, subj_name in subjects:
        # 2. Визначаємо випадкову кількість завдань для кожного предмета (від 2 до 10)
        num_tasks = random.randint(2, 10)
        
        for i in range(1, num_tasks + 1):
            # Геруємо опис та випадковий дедлайн (від 1 до 20 днів)
            template = random.choice(task_templates)
            description = template.format(subj_name if '{}' in template else i)
            deadline = now + timedelta(days=random.randint(1, 20), hours=random.randint(0, 23))
            
            # 3. Вставляємо в базу зі статусом 'Active'
            cur.execute("""
                INSERT INTO assignments (subject_id, description, deadline, status)
                VALUES (%s, %s, %s, %s)
            """, (subj_id, description, deadline, 'Active'))
            total_added += 1
            
    conn.commit()
    print(f"Успішно додано {total_added} завдань для {len(subjects)} предметів.")

if __name__ == "__main__":
    populate_random_assignments()
    cur.close()
    conn.close()