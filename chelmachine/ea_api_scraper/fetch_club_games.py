import sys
import requests
import json

base_url = "https://proclubs.ea.com/api/nhl"
platform = "common-gen5"
headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en',
    'Referer': 'https://proclubs.ea.com/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json',
    'Connection': 'keep-alive'
}
matchType = "club_private"

def get_json(url):
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        return r.json()
    except requests.exceptions.RequestException as e:
        print(json.dumps({"error": f"API request failed: {e}"}), file=sys.stderr)
        sys.exit(1)

def fetch_team_matches(club_id):
    if not club_id:
        print(json.dumps({"error": "Invalid club_id"}), file=sys.stderr)
        return

    request_url = f"{base_url}/clubs/matches?clubIds={club_id}&platform={platform}&matchType={matchType}"
    
    try:
        matches = get_json(request_url)
        print(json.dumps(matches))
    except Exception as e:
        print(json.dumps({"error": f"An error occurred: {e}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python fetch_club_games.py <club_id>"}), file=sys.stderr)
        sys.exit(1)
    
    club_id_arg = sys.argv[1]
    fetch_team_matches(club_id_arg) 