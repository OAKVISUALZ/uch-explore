import os
import json

def run_smoke_checks():
    dist_dir = 'dist'
    assert os.path.exists(os.path.join(dist_dir, 'index.html')), 'dist/index.html missing'
    assert os.path.exists(os.path.join(dist_dir, 'review.html')), 'dist/review.html missing'
    assert os.path.exists(os.path.join(dist_dir, 'data', 'buildings.geojson')), 'dist/data/buildings.geojson missing'
    assert os.path.exists(os.path.join(dist_dir, 'data', 'places.json')), 'dist/data/places.json missing'

    with open(os.path.join(dist_dir, 'data', 'places.json'), 'r', encoding='utf-8') as f:
        places = json.load(f)
    print(f'Verified {len(places)} destinations in production bundle.')

    with open(os.path.join(dist_dir, 'data', 'buildings.geojson'), 'r', encoding='utf-8') as f:
        blds = json.load(f)
    print(f'Verified {len(blds["features"])} building footprints in production bundle.')
    print('All static distribution sanity checks passed!')

if __name__ == '__main__':
    run_smoke_checks()
