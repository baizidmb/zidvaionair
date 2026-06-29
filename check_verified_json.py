import urllib.request
import urllib.error
import ssl
import json
import concurrent.futures

ssl_context = ssl._create_unverified_context()

def check_url(chan):
    name = chan["name"]
    url = chan["url"]
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://ajkerkhela.vercel.app/'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5, context=ssl_context) as resp:
            code = resp.getcode()
            if code == 200:
                head = resp.read(100)
                if b"#EXTM3U" in head or b"<MPD" in head or b"xml" in head or len(head) > 10:
                    return chan, True, "Online"
                else:
                    return chan, False, "Empty/Bad Content"
            else:
                return chan, False, f"HTTP {code}"
    except Exception as e:
        return chan, False, str(e)

try:
    with open("verified_channels.json", "r", encoding="utf-8") as f:
        channels = json.load(f)
    print(f"Loaded {len(channels)} channels from verified_channels.json")
except Exception as e:
    print(f"Error reading file: {e}")
    channels = []

online_channels = []
if channels:
    print("Checking channel health status...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        results = list(executor.map(check_url, channels))
        for chan, ok, msg in results:
            name = chan["name"]
            ascii_name = name.encode('ascii', 'ignore').decode('ascii')
            if ok:
                print(f"ONLINE: {ascii_name}")
                online_channels.append(chan)
            else:
                print(f"DEAD  : {ascii_name} ({msg})")

    # Overwrite verified_channels.json with only online channels
    with open("verified_channels.json", "w", encoding="utf-8") as f:
        json.dump(online_channels, f, indent=4)
    print(f"Successfully pruned list! Wrote {len(online_channels)} working channels to verified_channels.json")
