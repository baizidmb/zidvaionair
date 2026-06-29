import urllib.request
import re
import json
import concurrent.futures
import time
import ssl
import sys

# Reconfigure stdout to prevent Windows console encoding crashes
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(errors='replace')

M3U_URL = 'https://iptv-org.github.io/iptv/categories/sports.m3u'
ssl_context = ssl._create_unverified_context()

def fetch_m3u():
    print("Fetching M3U from source...")
    try:
        req = urllib.request.Request(M3U_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching M3U: {e}")
        return ""

def parse_m3u(content):
    lines = content.splitlines()
    channels = []
    current_logo = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        if line.startswith('#EXTINF:'):
            # Extract logo if present
            logo_match = re.search(r'tvg-logo="([^"]+)"', line)
            current_logo = logo_match.group(1) if logo_match else ""
            
            # Extract name
            name_parts = line.split(',')
            current_name = name_parts[-1].strip() if name_parts else "Unknown"
            
        elif line.startswith('http') and current_name:
            channels.append({
                'name': current_name,
                'url': line,
                'logo': current_logo,
                'detail': 'International Sports Feed',
                'badge': 'HD'
            })
            current_name = None
            
    print(f"Parsed {len(channels)} total channels.")
    return channels

def verify_channel(channel):
    url = channel['url']
    # Skip dashboard DRM/DASH mpd links since they need special handling/auth
    if url.endswith('.mpd'):
        return None
        
    try:
        req = urllib.request.Request(
            url, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://ustvgo.tv/'
            }
        )
        # We perform a brief GET or HEAD request
        # Setting a short timeout of 2.5 seconds to filter out slow/dead links
        with urllib.request.urlopen(req, timeout=2.5, context=ssl_context) as response:
            if response.status in [200, 201, 206]:
                # Read a small amount of data to ensure stream is actually broadcasting
                chunk = response.read(1024)
                if len(chunk) > 0:
                    print(f"ONLINE: {channel['name']}")
                    return channel
    except Exception as e:
        print(f"OFFLINE: {channel['name']}")
    return None

def main():
    m3u_content = fetch_m3u()
    if not m3u_content:
        return
        
    raw_channels = parse_m3u(m3u_content)
    
    verified_channels = []
    print("Testing stream URLs concurrently (this may take up to 1-2 minutes)...")
    
    # Check concurrently with 30 threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        results = executor.map(verify_channel, raw_channels)
        for res in results:
            if res:
                verified_channels.append(res)
                
    print(f"\nDone! Found {len(verified_channels)} online working channels.")
    
    # Save the output
    output_file = 'verified_channels.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(verified_channels, f, indent=4, ensure_ascii=False)
    print(f"Successfully saved online feeds to {output_file}")

if __name__ == '__main__':
    main()
