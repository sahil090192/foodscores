from pathlib import Path
import json
import click

@click.group()
def cli():
    """Cache inspection utility"""
    pass

@cli.command()
def list_cache():
    """List all cached meal plans"""
    cache_dir = Path("cache")
    if not cache_dir.exists():
        print("Cache directory not found!")
        return
    
    for cache_file in cache_dir.glob("*.json"):
        with open(cache_file, 'r') as f:
            data = json.load(f)
            print(f"\nCache Key: {cache_file.stem}")
            # Print summary of the meal plan
            days = len(data['meal_plan'])
            total_meals = sum(len(day['meals']) for day in data['meal_plan'])
            print(f"Days: {days}")
            print(f"Total Meals: {total_meals}")
            print("-" * 50)

@cli.command()
@click.argument('cache_key')
def view_cache(cache_key):
    """View a specific cached meal plan"""
    cache_file = Path("cache") / f"{cache_key}.json"
    if not cache_file.exists():
        print(f"Cache file for key {cache_key} not found!")
        return
    
    with open(cache_file, 'r') as f:
        data = json.load(f)
        print(json.dumps(data, indent=2))

@cli.command()
def view_stats():
    """View request statistics"""
    log_file = Path("logs") / "request_logs.jsonl"
    if not log_file.exists():
        print("No logs found!")
        return
    
    cache_hits = 0
    api_calls = 0
    errors = 0
    total_api_duration = 0
    
    with open(log_file, 'r') as f:
        for line in f:
            entry = json.loads(line.strip())
            if entry['type'] == 'cache_hit':
                cache_hits += 1
            elif entry['type'] == 'api_call':
                api_calls += 1
                total_api_duration += entry['duration_seconds']
            elif entry['type'] == 'error':
                errors += 1
    
    print("\nCache Statistics:")
    print(f"Cache Hits: {cache_hits}")
    print(f"API Calls: {api_calls}")
    print(f"Errors: {errors}")
    if api_calls > 0:
        print(f"Average API Call Duration: {total_api_duration/api_calls:.2f} seconds")
    print(f"Cache Hit Rate: {cache_hits/(cache_hits+api_calls)*100:.1f}%")

if __name__ == '__main__':
    cli() 