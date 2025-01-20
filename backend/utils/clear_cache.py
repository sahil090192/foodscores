from pathlib import Path
import shutil
import click

@click.command()
@click.option('--force', is_flag=True, help='Force clear all cache without confirmation')
def clear_cache(force):
    """Clear all cached meal plans"""
    cache_dir = Path("cache")
    
    if not cache_dir.exists():
        print("Cache directory not found!")
        return
        
    if not force:
        confirm = input("Are you sure you want to clear all cached meal plans? (y/N): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return
    
    try:
        shutil.rmtree(cache_dir)
        cache_dir.mkdir()
        print("Cache cleared successfully!")
    except Exception as e:
        print(f"Error clearing cache: {str(e)}")

if __name__ == '__main__':
    clear_cache() 