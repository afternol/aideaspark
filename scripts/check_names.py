import os, psycopg2, io, sys, re
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()
cur.execute('SELECT number, "serviceName" FROM "Idea" ORDER BY number')
rows = cur.fetchall()
conn.close()

jp, en = [], []
for r in rows:
    name = r[1]
    if re.search(r'[ぁ-んァ-ン一-鿿]', name):
        jp.append(f"#{r[0]} {name}")
    else:
        en.append(f"#{r[0]} {name}")

print(f"日本語・カタカナ系: {len(jp)}件 ({len(jp)/55*100:.0f}%)")
for n in jp:
    print(f"  {n}")
print(f"\n英語系: {len(en)}件 ({len(en)/55*100:.0f}%)")
for n in en:
    print(f"  {n}")
