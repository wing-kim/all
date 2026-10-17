"""Find the source cafe's largest horizontal floor and ceiling meshes.

The snapshot is in Three.js coordinates and matrices are column-major. Keep
this module independent of Blender so an export can be inspected before baking.
"""


def source_faces(geometry):
    indices = geometry['index'] or range(len(geometry['position']) // 3)
    draw = geometry['drawRange']
    end = min(len(indices), draw['start'] + draw['count'])
    for offset in range(draw['start'], end - 2, 3):
        yield offset, (indices[offset], indices[offset + 1], indices[offset + 2])


def candidate_surfaces(source, height, facing, tolerance=.001):
    """Rank source objects by coplanar, consistently facing world-space area."""
    ranked = []
    for obj in source['objects']:
        key = obj['geometry']
        geometry = source['geometries'][key]
        positions = geometry['position']
        matrix = obj['matrix']
        vertex_count = len(positions) // 3
        world_y = [matrix[1] * positions[3 * i] + matrix[5] * positions[3 * i + 1]
                   + matrix[9] * positions[3 * i + 2] + matrix[13]
                   for i in range(vertex_count)]
        near = [abs(y - height) <= tolerance for y in world_y]
        if sum(near) < 3:
            continue
        world_xz = {}

        def xz(index):
            if index not in world_xz:
                x, y, z = positions[3 * index:3 * index + 3]
                world_xz[index] = (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
                                   matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14])
            return world_xz[index]

        area, offsets = 0.0, []
        for offset, (i, j, k) in source_faces(geometry):
            if not (near[i] and near[j] and near[k]):
                continue
            ax, az = xz(i)
            bx, bz = xz(j)
            cx, cz = xz(k)
            double_area = (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
            if double_area * facing <= .0001:
                continue
            area += abs(double_area) / 2
            offsets.append(offset)
        if offsets:
            ranked.append({'key': key, 'name': obj['name'], 'area': area,
                           'faces': len(offsets), 'offsets': offsets})
    return sorted(ranked, key=lambda item: item['area'], reverse=True)


def discover_receivers(source):
    """Return floor/ceiling specs, rejecting missing or ambiguous receivers."""
    specs = {}
    for name, facing, minimum_area in (('floor', 1, 300), ('ceiling', -1, 350)):
        height = source[name]
        ranked = candidate_surfaces(source, height, facing)
        if not ranked or ranked[0]['area'] <= minimum_area or ranked[0]['faces'] < 10:
            raise ValueError(f'{name} receiver absent at y={height}: {ranked[:2]}')
        winner = ranked[0]
        if len(ranked) > 1 and ranked[1]['area'] >= winner['area'] * .9:
            raise ValueError(f'{name} receiver ambiguous at y={height}: {ranked[:2]}')
        specs[name] = (winner['key'], height, facing)
    if specs['floor'][0] == specs['ceiling'][0]:
        raise ValueError('Floor and ceiling receivers share an object; split-face handling required')
    return specs


if __name__ == '__main__':
    import gzip
    import json
    import sys
    from pathlib import Path

    path = Path(sys.argv[1])
    with (gzip.open(path, 'rt') if path.suffix == '.gz' else path.open()) as stream:
        source = json.load(stream)
    specs = discover_receivers(source)
    for name, (key, height, facing) in specs.items():
        winner = candidate_surfaces(source, height, facing)[0]
        print(f'{name}: {key}, y={height:.3f}, {winner["faces"]} triangles, {winner["area"]:.2f} m²')
