import urllib.request
import urllib.error
import ssl
import concurrent.futures

ssl_context = ssl._create_unverified_context()

channels = [
    {"name": "SP - SD", "url": "https://rglzdwqlaqpzfoofnohk.supabase.co/functions/v1/go?url=Q09k4OukERocFRoTLpNhopWhojWRopWkQVbmFk6nI0zf&headers=3OvT47zfFAzydly_zKugdly_FOKXdly_HG_hI0oSrVwhv1P0dly_dVwhvGgTIGSh4KHmHRdJERI_4UgRHGHJIRIRFhNcE0zKLpycyCv_EU1Uq1yjin"},
    {"name": "SP - HD", "url": "https://rglzdwqlaqpzfoofnohk.supabase.co/functions/v1/go?url=Q09k4OuzERokijak4MYmoV9JdsHJokrJdkABFhNcE0zKLw&headers=3OvT47zfFAzydly_zKugdly_FOKXdly_HG_hI0oSrVwhv1P0dly_dVwhvGgTIGSh4KHmHRdJERI_4UgRHGHJIRIRFhNcE0zKLpycyCv_EU1Uq1yjin"},
    {"name": "FAST 1", "url": "https://pullsgp.yyzb456.top/live/stream-698168_lhd.m3u8"},
    {"name": "FAST 2", "url": "https://pul-tenm.nbs3g.com/live/hd-en-1-4459717.m3u8?txSecret=cb546b67173ce18b5d6e9c15e9ec6b4b&txTime=6A42BDE0"},
    {"name": "Arabic", "url": "https://em.golatooa.site/Canads1.m3u8"},
    {"name": "CCTV 5", "url": "https://live.666666.zip/cctv/5.m3u8"},
    {"name": "SP - 2", "url": "https://live.666666.zip/migu/1.m3u8"},
    {"name": "SP - 3", "url": "https://hqlive.yarncdn.live/live/hqtv_blv_phanma/playlist.m3u8"},
    {"name": "FUSSBALL (Germany VPN)", "url": "https://svc45.main.sl.t-online.de/bpk-tv/KID01037_FUSSBALLTV1_hd/DASH/index.mpd"},
    {"name": "FUSSBALL 4K (Germany VPN)", "url": "https://svc45.main.sl.t-online.de/bpk-tv/KID01037_FUSSBALLTV1_uhd/DASH/index.mpd"},
    {"name": "Somoy TV", "url": "https://live.thebosstv.com:30443/dwlive/Somoy-TV/chunks.m3u8"},
    {"name": "Win Sports", "url": "https://1nyaler.streamhostingcdn.top/stream/32/index.m3u8"},
    {"name": "beIN Sports 1", "url": "https://ua102.online24.pm:8443/1101/video.m3u8?token=350B326FB34F4B8"},
    {"name": "Fox Sports", "url": "http://84.17.50.102/fox/index.m3u8"},
    {"name": "Peace TV English", "url": "https://dzkyvlfyge.erbvr.com/PeaceTvEnglish/index.m3u8?sid=Z44HMm4XiUygzqBGwjL4gA"},
    {"name": "BTV", "url": "https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/index.m3u8"},
    {"name": "DAZN Directo", "url": "https://1nyaler.streamhostingcdn.top/stream/94/index.m3u8"},
    {"name": "D Sports", "url": "https://1nyaler.streamhostingcdn.top/stream/106/index.m3u8"},
    {"name": "beIN Sports 2", "url": "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8"}
]

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
                # Read first few bytes to check HLS/DASH manifest signature
                head = resp.read(100)
                if b"#EXTM3U" in head or b"<MPD" in head or b"xml" in head or len(head) > 10:
                    return name, True, "Online"
                else:
                    return name, False, "Empty/Bad Content"
            else:
                return name, False, f"HTTP {code}"
    except urllib.error.HTTPError as e:
        return name, False, f"HTTP {e.code}"
    except urllib.error.URLError as e:
        return name, False, f"Network Error: {e.reason}"
    except Exception as e:
        return name, False, f"Error: {e}"

print("Checking static channels HLS endpoints...")
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(check_url, channels)
    for name, ok, msg in results:
        status = "ONLINE" if ok else "DEAD"
        print(f"{name:30} {status:10} ({msg})")
