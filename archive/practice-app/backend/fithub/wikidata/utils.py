# wikidata/utils.py
import requests
from django.core.cache import cache
from typing import Optional, Dict, Any

def get_wikidata_id(ingredient_name: str) -> Optional[str]:
    """
    Retrieves the Wikidata ID (Q-number) for a given ingredient name, with caching.
    """
    cache_key = f"wikidata_id_{ingredient_name.lower().replace(' ', '_')}"
    wikidata_id = cache.get(cache_key)
    if wikidata_id is None:
        url = "https://www.wikidata.org/w/api.php"
        params = {
            'action': 'wbsearchentities',
            'format': 'json',
            'language': 'en',
            'type': 'item',
            'search': ingredient_name,
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data and 'search' in data and data['search']:
                wikidata_id = data['search'][0]['id']
                cache.set(cache_key, wikidata_id, timeout=86400)  # Cache for 24 hours
            else:
                wikidata_id = None
        except requests.exceptions.RequestException as e:
            print(f"Error searching Wikidata for '{ingredient_name}': {e}")
            wikidata_id = None
        except (KeyError, ValueError, TypeError) as e:
            print(f"Error parsing Wikidata response for '{ingredient_name}': {e}")
            wikidata_id = None
        cache.set(cache_key, wikidata_id, timeout=86400)
    return wikidata_id


def get_wikidata_details(wikidata_id: str, properties: tuple = ('labels', 'descriptions', 'claims', 'sitelinks')) -> Optional[Dict[str, Any]]:
    """
    Retrieves detailed information about a Wikidata entity, with caching.
    """
    cache_key = f"wikidata_details_{wikidata_id}"
    details = cache.get(cache_key)
    if details is None:
        url = "https://www.wikidata.org/w/api.php"
        params = {
            'action': 'wbgetentities',
            'ids': wikidata_id,
            'format': 'json',
            'props': '|'.join(properties),
            'languages': 'en',  # Specify preferred languages
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data and 'entities' in data and wikidata_id in data['entities']:
                details = data['entities'][wikidata_id]
                cache.set(cache_key, details, timeout=86400)  # Cache for 24 hours
            else:
                details = None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching Wikidata details for '{wikidata_id}': {e}")
            details = None
        except (KeyError, ValueError, TypeError) as e:
            print(f"Error parsing Wikidata response for '{wikidata_id}': {e}")
            details = None
        cache.set(cache_key, details, timeout=86400)
    return details