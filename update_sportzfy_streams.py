import sys
import os
import re
import json
import base64
import hashlib
import subprocess
import urllib.parse
from Crypto.Cipher import AES

DEFAULT_WATCH_URL = "https://s1.sportzfytvlive.xyz/watch/Lpxqk597rkh7kwz5799vr97r779n9h"
DEFAULT_K = "ZESBtSlRTuF4Ac4k757OuasOWOA0W8LcqRn3SFgdInDoMyS8"
DEFAULT_P = "FIFA World Cup"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

def fetch_url_curl(url, referer=None):
    cmd = ["curl.exe", "-s", "-H", f"User-Agent: {USER_AGENT}"]
    if referer:
        cmd += ["-H", f"Referer: {referer}"]
        cmd += ["-H", "X-Requested-With: lsp"]
        cmd += ["-H", "X-LSP-Enc: 1"]
        cmd += ["-H", "Accept: application/json"]
        
    cmd.append(url)
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(f"Error fetching {url}: {result.stderr.decode('utf-8', errors='ignore')}")
        return None
    return result.stdout

def decrypt_payload(enc_b64, bucket, K_str):
    enc_bytes = base64.b64decode(enc_b64)
    iv = enc_bytes[0:12]
    ct_with_tag = enc_bytes[12:]
    ct = ct_with_tag[:-16]
    tag = ct_with_tag[-16:]
    
    key_material = f"{K_str}|lsp-v1|{bucket}".encode('utf-8')
    key_hash = hashlib.sha256(key_material).digest()
    
    cipher = AES.new(key_hash, AES.MODE_GCM, nonce=iv)
    pt = cipher.decrypt_and_verify(ct, tag)
    return json.loads(pt.decode('utf-8'))

def main():
    watch_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_WATCH_URL
    print(f"Step 1: Fetching watch page HTML from: {watch_url}")
    
    html_bytes = fetch_url_curl(watch_url)
    if not html_bytes:
        print("Failed to download watch page.")
        sys.exit(1)
        
    html = html_bytes.decode('utf-8', errors='ignore')
    
    # Extract K
    k_match = re.search(r'var\s+K\s*=\s*["\']([^"\']+)["\']', html)
    if k_match:
        K_val = k_match.group(1)
        print(f"  Extracted Key K: {K_val[:10]}...")
    else:
        K_val = DEFAULT_K
        print(f"  Could not extract K, using fallback: {K_val[:10]}...")
        
    # Extract P
    p_match = re.search(r'var\s+P\s*=\s*["\']([^"\']+)["\']', html)
    if p_match:
        P_val = p_match.group(1)
        print(f"  Extracted Parent Match P: {P_val}")
    else:
        P_val = DEFAULT_P
        print(f"  Could not extract P, using fallback: {P_val}")
        
    # Step 2: Fetch playback API
    encoded_P = urllib.parse.quote(P_val)
    domain_match = re.match(r'(https?://[^/]+)', watch_url)
    domain = domain_match.group(1) if domain_match else "https://s1.sportzfytvlive.xyz"
    
    api_url = f"{domain}/api/upstream/playback/{encoded_P}"
    print(f"\nStep 2: Fetching Playback API: {api_url}")
    
    api_bytes = fetch_url_curl(api_url, referer=watch_url)
    if not api_bytes:
        print("Failed to fetch Playback API response.")
        sys.exit(1)
        
    try:
        api_json = json.loads(api_bytes.decode('utf-8'))
    except Exception as e:
        print(f"Failed to parse API JSON: {e}")
        print("Raw response:", api_bytes[:200])
        sys.exit(1)
        
    if 'enc' not in api_json:
        print("API response does not contain encrypted stream details.", api_json)
        sys.exit(1)
        
    bucket = str(api_json.get('bucket'))
    print(f"  Bucket: {bucket}")
    
    # Step 3: Decrypt
    print("\nStep 3: Decrypting streams using AES-GCM...")
    try:
        decrypted = decrypt_payload(api_json['enc'], bucket, K_val)
        print(f"  Successfully decrypted {len(decrypted.get('streams', []))} streams.")
        
        # Save to sportzfy_streams.json
        output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sportzfy_streams.json")
        with open(output_file, 'w', encoding='utf-8') as out:
            json.dump(decrypted, out, indent=2)
            
        print(f"\nSUCCESS: Decrypted streams written to: {output_file}")
    except Exception as e:
        print(f"Decryption failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
