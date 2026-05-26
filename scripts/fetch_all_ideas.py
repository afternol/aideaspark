import os, psycopg2, io, sys
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()
cur.execute("""
    SELECT number, "serviceName", category, "targetIndustry", "targetCustomer", "oneLiner"
    FROM "Idea" ORDER BY number
""")
for row in cur.fetchall():
    print(f"#{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]}")
    print(f"  oneLiner: {row[5]}")
conn.close()
