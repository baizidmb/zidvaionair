import urllib.request
import json
import ssl
import os

ssl_context = ssl._create_unverified_context()
url = "https://ajkerkhela.vercel.app/api/schedule"
output_file = "schedule.json"

try:
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print(f"Successfully wrote {len(data)} matches to {output_file}")
except Exception as e:
    print(f"Error fetching schedule: {e}")
