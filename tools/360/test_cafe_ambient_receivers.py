import unittest

from cafe_ambient_receivers import candidate_surfaces, discover_receivers


def surface(key, height, facing, count=11):
    position = []
    for i in range(count):
        x = i * 10
        vertices = ((x, 0, 0), (x, 0, 8), (x + 8, 0, 0))
        for vertex in (vertices if facing > 0 else reversed(vertices)):
            position.extend(vertex)
    matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, height, 0, 1]
    return ({'name': key, 'geometry': key, 'matrix': matrix},
            {'position': position, 'index': None, 'drawRange': {'start': 0, 'count': len(position) // 3}})


def fixture(*items):
    return {'floor': .07, 'ceiling': 5.02,
            'objects': [obj for obj, _ in items],
            'geometries': {obj['geometry']: geometry for obj, geometry in items}}


class ReceiverDiscoveryTest(unittest.TestCase):
    def test_finds_largest_coplanar_surfaces_without_geometry_ids(self):
        source = fixture(surface('changed-ceiling-id', 5.02, -1, 12),
                         surface('small-floor-patch', .07, 1, 2),
                         surface('changed-floor-id', .07, 1, 11))
        self.assertEqual(discover_receivers(source), {
            'floor': ('changed-floor-id', .07, 1),
            'ceiling': ('changed-ceiling-id', 5.02, -1)})
        self.assertEqual(candidate_surfaces(source, .07, 1)[0]['faces'], 11)

    def test_rejects_missing_and_ambiguous_receivers(self):
        floor = surface('floor', .07, 1)
        ceiling = surface('ceiling', 5.02, -1, 12)
        with self.assertRaisesRegex(ValueError, 'floor receiver absent'):
            discover_receivers(fixture(ceiling))
        with self.assertRaisesRegex(ValueError, 'floor receiver ambiguous'):
            discover_receivers(fixture(floor, surface('floor-copy', .07, 1), ceiling))


if __name__ == '__main__':
    unittest.main()
